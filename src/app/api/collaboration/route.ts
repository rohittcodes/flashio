import { NextRequest } from 'next/server'
import { CollaborationService } from '@/lib/collaboration'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return new Response('Missing projectId', { status: 400 })
    }

    // Check if user can collaborate on this project
    const canCollaborate = await CollaborationService.canCollaborate(projectId, session.user.id)
    if (!canCollaborate) {
      return new Response('Access denied', { status: 403 })
    }

    // Start collaboration session
    const sessionId = await CollaborationService.startSession(
      projectId,
      session.user.id,
      {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email || '',
        avatar: session.user.image || undefined,
      }
    )

    // Create event stream
    const stream = CollaborationService.createEventStream(projectId)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Session-Id': sessionId,
      }
    })
  } catch (error) {
    console.error('Failed to start collaboration:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
