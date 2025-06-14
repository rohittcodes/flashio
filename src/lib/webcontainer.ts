import { WebContainer, WebContainerProcess, FileSystemTree } from '@webcontainer/api'
import { db } from '@/db/drizzle'
import { webContainerInstances, terminalSessions, fileWatchers, fileWatcherEvents } from '@/db/schemas'
import { eq, and } from 'drizzle-orm'

export interface WebContainerBootOptions {
  coep?: 'require-corp' | 'credentialless' | 'none'
  workdirName?: string
  forwardPreviewErrors?: boolean | 'exceptions-only'
}

export interface TerminalConfig {
  cols: number
  rows: number
}

export class WebContainerService {
  private static instances = new Map<string, WebContainer>()
  private static processes = new Map<string, WebContainerProcess>()

  /**
   * Check if we're in a browser environment
   */
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  /**
   * Boot a new WebContainer instance for a project
   */
  static async bootContainer(
    projectId: string,
    userId: string,
    options: WebContainerBootOptions = {}
  ): Promise<{ instanceId: string; webContainer: WebContainer }> {
    if (!this.isBrowser()) {
      throw new Error('WebContainer can only be used in browser environment')
    }

    try {// Check if container already exists for this project/user
      const existingInstance = await db
        .select()
        .from(webContainerInstances)
        .where(
          and(
            eq(webContainerInstances.projectId, projectId),
            eq(webContainerInstances.userId, userId),
            eq(webContainerInstances.status, 'ready')
          )
        )
        .limit(1)

      if (existingInstance.length > 0) {
        const instance = this.instances.get(existingInstance[0].id)
        if (instance) {
          return { instanceId: existingInstance[0].id, webContainer: instance }
        }
      }

      // Boot new WebContainer
      const webContainer = await WebContainer.boot(options)
      
      // Create database record
      const [dbInstance] = await db
        .insert(webContainerInstances)
        .values({
          projectId,
          userId,
          status: 'booting',
          workdirName: options.workdirName,
          bootOptions: options,
          lastActivity: new Date(),
        })
        .returning()

      // Store in memory
      this.instances.set(dbInstance.id, webContainer)      // Update status to ready
      await db
        .update(webContainerInstances)
        .set({ status: 'ready', lastActivity: new Date() })
        .where(eq(webContainerInstances.id, dbInstance.id))

      return { instanceId: dbInstance.id, webContainer }
    } catch (error) {
      console.error('Failed to boot WebContainer:', error)
      throw new Error('Failed to boot WebContainer')
    }
  }

  /**
   * Get an existing WebContainer instance
   */  static async getInstance(instanceId: string): Promise<WebContainer | null> {
    if (!this.isBrowser()) {
      return null
    }
    
    const instance = this.instances.get(instanceId)
    if (instance) {
      // Update last activity
      await db
        .update(webContainerInstances)
        .set({ lastActivity: new Date() })
        .where(eq(webContainerInstances.id, instanceId))
      
      return instance
    }
    return null
  }

  /**
   * Mount files to a WebContainer instance
   */
  static async mountFiles(
    instanceId: string,
    files: FileSystemTree
  ): Promise<void> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    await webContainer.mount(files)
  }
  /**
   * Start a terminal session in a WebContainer
   */
  static async startTerminal(
    instanceId: string,
    projectId: string,
    userId: string,
    config: TerminalConfig = { cols: 80, rows: 24 },
    command?: string
  ): Promise<{ sessionId: string; process: WebContainerProcess }> {
    if (!this.isBrowser()) {
      throw new Error('Terminal can only be started in browser environment')
    }
    
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    // Start shell process
    const process = await webContainer.spawn('jsh', command ? ['-c', command] : [], {
      terminal: config,
    })

    // Create database record
    const [session] = await db
      .insert(terminalSessions)
      .values({
        webContainerId: instanceId,
        projectId,
        userId,
        command: command || '',
        terminalSize: config,
        status: 'running',
        processId: `${Date.now()}-${Math.random()}`, // Generate unique process ID
      })
      .returning()

    // Store process in memory
    this.processes.set(session.id, process)

    return { sessionId: session.id, process }
  }

  /**
   * Get a terminal process
   */
  static getTerminalProcess(sessionId: string): WebContainerProcess | null {
    return this.processes.get(sessionId) || null
  }

  /**
   * Execute a command in a WebContainer
   */
  static async executeCommand(
    instanceId: string,
    command: string,
    args: string[] = [],
    workingDirectory?: string
  ): Promise<WebContainerProcess> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    const process = await webContainer.spawn(command, args, {
      cwd: workingDirectory,
    })

    return process
  }
  /**
   * Read file from WebContainer
   */
  static async readFile(
    instanceId: string,
    path: string,
    encoding: 'utf8' | 'binary' = 'utf8'
  ): Promise<string> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }    const fileContent = await webContainer.fs.readFile(path, encoding as any)
    return typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent)
  }

  /**
   * Write file to WebContainer
   */
  static async writeFile(
    instanceId: string,
    path: string,
    content: string,
    encoding: BufferEncoding = 'utf8'
  ): Promise<void> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    await webContainer.fs.writeFile(path, content, encoding)
  }
  /**
   * Create directory in WebContainer
   */
  static async mkdir(
    instanceId: string,
    path: string,
    recursive: boolean = false
  ): Promise<void> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    if (recursive) {
      await webContainer.fs.mkdir(path, { recursive: true })
    } else {
      await webContainer.fs.mkdir(path)
    }
  }

  /**
   * Remove file or directory from WebContainer
   */
  static async remove(
    instanceId: string,
    path: string,
    options?: { recursive?: boolean }
  ): Promise<void> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    await webContainer.fs.rm(path, options)
  }

  /**
   * List directory contents
   */
  static async readdir(
    instanceId: string,
    path: string
  ): Promise<string[]> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    const files = await webContainer.fs.readdir(path)
    return files
  }

  /**
   * Watch file system changes
   */
  static async startFileWatcher(
    instanceId: string,
    projectId: string,
    watchPath: string,
    options: { recursive?: boolean; encoding?: BufferEncoding } = {}
  ): Promise<string> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      throw new Error('WebContainer instance not found')
    }

    // Create database record
    const [watcher] = await db
      .insert(fileWatchers)
      .values({
        webContainerId: instanceId,
        projectId,
        watchPath,
        isRecursive: options.recursive || false,
        encoding: options.encoding || 'utf8',
      })
      .returning()

    // Start watching (Note: WebContainer API doesn't have built-in file watching,
    // this would need to be implemented with polling or external tools)
    // For now, we just return the watcher ID for future implementation
    
    return watcher.id
  }

  /**
   * Stop file watcher
   */
  static async stopFileWatcher(watcherId: string): Promise<void> {
    await db
      .update(fileWatchers)
      .set({ isActive: false })
      .where(eq(fileWatchers.id, watcherId))
  }
  /**
   * Get container URL for preview
   */
  static async getPreviewUrl(instanceId: string, port: number = 3000): Promise<string | null> {
    const webContainer = await this.getInstance(instanceId)
    if (!webContainer) {
      return null
    }    // For now, return a placeholder URL since WebContainer API structure may vary
    const url = null // Will be implemented when the actual WebContainer is running
    
    // Update database with the port information
    await db
      .update(webContainerInstances)
      .set({ 
        port,
        containerUrl: url,
        lastActivity: new Date()
      })
      .where(eq(webContainerInstances.id, instanceId))

    return url
  }

  /**
   * Terminate a WebContainer instance
   */
  static async terminateContainer(instanceId: string): Promise<void> {
    const webContainer = this.instances.get(instanceId)
    if (webContainer) {
      await webContainer.teardown()
      this.instances.delete(instanceId)
    }

    // Update database
    await db
      .update(webContainerInstances)
      .set({ 
        status: 'terminated',
        terminatedAt: new Date()
      })
      .where(eq(webContainerInstances.id, instanceId))    // Clean up terminal sessions
    await db
      .update(terminalSessions)
      .set({ 
        status: 'stopped',
        endedAt: new Date()
      })
      .where(eq(terminalSessions.webContainerId, instanceId))

    // Remove processes from memory
    const sessions = await db
      .select()
      .from(terminalSessions)
      .where(eq(terminalSessions.webContainerId, instanceId))

    for (const session of sessions) {
      this.processes.delete(session.id)
    }
  }

  /**
   * Clean up inactive containers
   */
  static async cleanupInactiveContainers(inactiveThresholdMs: number = 30 * 60 * 1000): Promise<void> {
    const cutoffTime = new Date(Date.now() - inactiveThresholdMs)
      const inactiveInstances = await db
      .select()
      .from(webContainerInstances)
      .where(
        and(
          eq(webContainerInstances.status, 'ready'),
          // lastActivity < cutoffTime would need a custom SQL expression in Drizzle
        )
      )

    for (const instance of inactiveInstances) {
      if (instance.lastActivity && instance.lastActivity < cutoffTime) {
        await this.terminateContainer(instance.id)
      }
    }
  }
}
