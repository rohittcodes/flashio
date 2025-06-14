import { db } from '@/db/drizzle'
import { projectCollaborators, collaborationSessions } from '@/db/schemas'
import { eq, and, or } from 'drizzle-orm'

export interface CollaborationSessionData {
  projectId: string
  userId: string
  userInfo: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  cursor?: {
    line: number
    column: number
    filePath: string
  }
  selection?: {
    start: { line: number; column: number }
    end: { line: number; column: number }
    filePath: string
  }
}

export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'edit' | 'file_open' | 'file_close' | 'user_join' | 'user_leave'
  userId: string
  sessionId: string
  data: any
  timestamp: Date
}

export class CollaborationService {
  private static activeSessions = new Map<string, CollaborationSessionData[]>()
  private static eventStreams = new Map<string, ReadableStreamDefaultController<string>[]>()
  /**
   * Start a collaboration session for a project
   */
  static async startSession(
    projectId: string,
    userId: string,
    userInfo: CollaborationSessionData['userInfo']
  ): Promise<string> {
    try {
      // Create database record
      const [session] = await db
        .insert(collaborationSessions)
        .values({
          projectId,
          userId,
          isActive: true,
        })
        .returning()

      // Add to active sessions
      if (!this.activeSessions.has(projectId)) {
        this.activeSessions.set(projectId, [])
      }

      const sessionData: CollaborationSessionData = {
        projectId,
        userId,
        userInfo,
      }

      this.activeSessions.get(projectId)!.push(sessionData)

      // Broadcast user join event
      this.broadcastEvent(projectId, {
        type: 'user_join',
        userId,
        sessionId: session.id,
        data: { userInfo },
        timestamp: new Date(),
      })

      return session.id
    } catch (error) {
      console.error('Failed to start collaboration session:', error)
      throw new Error('Failed to start collaboration session')
    }
  }
  /**
   * End a collaboration session
   */
  static async endSession(sessionId: string, projectId: string, userId: string): Promise<void> {
    try {
      // Update database record
      await db
        .update(collaborationSessions)
        .set({
          isActive: false,
          lastActivity: new Date(),
        })
        .where(eq(collaborationSessions.id, sessionId))

      // Remove from active sessions
      const sessions = this.activeSessions.get(projectId) || []
      const updatedSessions = sessions.filter(s => s.userId !== userId)
      this.activeSessions.set(projectId, updatedSessions)

      // Broadcast user leave event
      this.broadcastEvent(projectId, {
        type: 'user_leave',
        userId,
        sessionId,
        data: {},
        timestamp: new Date(),
      })
    } catch (error) {
      console.error('Failed to end collaboration session:', error)
      throw new Error('Failed to end collaboration session')
    }
  }

  /**
   * Update user cursor position
   */
  static updateCursor(
    projectId: string,
    userId: string,
    cursor: CollaborationSessionData['cursor']
  ): void {
    const sessions = this.activeSessions.get(projectId) || []
    const session = sessions.find(s => s.userId === userId)
    
    if (session) {
      session.cursor = cursor
      
      // Broadcast cursor update
      this.broadcastEvent(projectId, {
        type: 'cursor',
        userId,
        sessionId: '', // Will be filled by the session
        data: { cursor },
        timestamp: new Date(),
      })
    }
  }

  /**
   * Update user selection
   */
  static updateSelection(
    projectId: string,
    userId: string,
    selection: CollaborationSessionData['selection']
  ): void {
    const sessions = this.activeSessions.get(projectId) || []
    const session = sessions.find(s => s.userId === userId)
    
    if (session) {
      session.selection = selection
      
      // Broadcast selection update
      this.broadcastEvent(projectId, {
        type: 'selection',
        userId,
        sessionId: '', // Will be filled by the session
        data: { selection },
        timestamp: new Date(),
      })
    }
  }

  /**
   * Broadcast file operation (open/close)
   */
  static broadcastFileOperation(
    projectId: string,
    userId: string,
    operation: 'open' | 'close',
    filePath: string
  ): void {
    this.broadcastEvent(projectId, {
      type: operation === 'open' ? 'file_open' : 'file_close',
      userId,
      sessionId: '',
      data: { filePath },
      timestamp: new Date(),
    })
  }

  /**
   * Get active collaborators for a project
   */
  static getActiveCollaborators(projectId: string): CollaborationSessionData[] {
    return this.activeSessions.get(projectId) || []
  }
  /**
   * Create event stream for real-time collaboration
   */
  static createEventStream(projectId: string): ReadableStream<string> {
    return new ReadableStream({
      start(controller) {
        // Add controller to project streams
        if (!CollaborationService.eventStreams.has(projectId)) {
          CollaborationService.eventStreams.set(projectId, [])
        }
        CollaborationService.eventStreams.get(projectId)!.push(controller)

        // Send initial collaborators
        const collaborators = CollaborationService.getActiveCollaborators(projectId)
        const initialEvent = {
          type: 'initial',
          data: { collaborators },
          timestamp: new Date(),
        }
        controller.enqueue(`data: ${JSON.stringify(initialEvent)}\\n\\n`)
      },
      cancel(controller) {
        // Remove controller from project streams
        const controllers = CollaborationService.eventStreams.get(projectId) || []
        const updatedControllers = controllers.filter(c => c !== controller)
        CollaborationService.eventStreams.set(projectId, updatedControllers)
      }
    })
  }
  /**
   * Broadcast event to all collaborators in a project
   */
  private static broadcastEvent(projectId: string, event: CollaborationEvent): void {
    const controllers = this.eventStreams.get(projectId) || []
    const eventData = `data: ${JSON.stringify(event)}\\n\\n`
    
    controllers.forEach(controller => {
      try {
        controller.enqueue(eventData)
      } catch (error) {
        console.error('Failed to send event to collaborator:', error)
      }
    })
  }

  /**
   * Check if user can collaborate on project (basic implementation)
   */
  static async canCollaborate(projectId: string, userId: string): Promise<boolean> {
    try {
      const [collaborator] = await db
        .select()
        .from(projectCollaborators)
        .where(
          and(
            eq(projectCollaborators.projectId, projectId),
            eq(projectCollaborators.userId, userId)
          )
        )
        .limit(1)

      return !!collaborator
    } catch (error) {
      console.error('Failed to check collaboration permissions:', error)
      return false
    }
  }

  /**
   * Get project collaborators
   */
  static async getProjectCollaborators(projectId: string) {
    try {
      return await db
        .select()
        .from(projectCollaborators)
        .where(eq(projectCollaborators.projectId, projectId))
    } catch (error) {
      console.error('Failed to get project collaborators:', error)
      return []
    }
  }
}
