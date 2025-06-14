import { FileStorageService } from '../file-storage'
import { GitHubStorageService } from './github-storage'
import { db } from '@/db/drizzle'
import { projectFiles } from '@/db/schemas'
import { eq, and } from 'drizzle-orm'

export type StorageProvider = 'local' | 'github' | 'hybrid'

export interface StorageConfig {
  primaryProvider: StorageProvider
  enableBackup: boolean
  githubSync: boolean
  autoCommit: boolean
}

export interface FileMetadata {
  projectId: string
  fileName: string
  filePath: string
  content: string
  userId: string
}

export class StorageManager {
  private githubStorage: GitHubStorageService | null = null
  
  constructor(private config: StorageConfig = {
    primaryProvider: 'hybrid',
    enableBackup: true,
    githubSync: false,
    autoCommit: false
  }) {
    // Initialize local storage directory
    FileStorageService.init()
    
    // Initialize GitHub storage if enabled
    if (config.githubSync) {
      this.githubStorage = new GitHubStorageService()
    }
  }

  /**
   * Save file with hybrid strategy
   */
  async saveFile(metadata: FileMetadata): Promise<{
    localSuccess: boolean
    githubSuccess: boolean
    fileId: string
  }> {
    const results = {
      localSuccess: false,
      githubSuccess: false,
      fileId: ''
    }

    try {      // 1. Always save locally first (primary backup)
      const localResult = await FileStorageService.storeFile(
        metadata.projectId,
        metadata.filePath,
        metadata.content
      )
      
      results.localSuccess = true
      results.fileId = localResult.storageKey      // 2. Update database record
      await this.updateFileRecord(metadata, 'local', localResult.storageKey)

      // 3. Optionally sync to GitHub
      if (this.config.githubSync && this.githubStorage) {
        try {
          const githubResult = await this.githubStorage.saveFile(
            metadata.projectId,
            metadata.fileName,
            metadata.content,
            metadata.userId
          )
          
          results.githubSuccess = true
          
          // Update database to indicate GitHub sync
          await this.updateFileRecord(metadata, 'hybrid', localResult.storageKey, {
            githubUrl: githubResult.url,
            githubSha: githubResult.sha,
            lastGithubSync: new Date()
          })
          
        } catch (githubError) {
          console.warn('GitHub sync failed, keeping local copy:', githubError)
          // File is still saved locally, so this isn't a critical failure
        }
      }

    } catch (localError) {
      console.error('Local storage failed:', localError)
      
      // Fallback: try GitHub only if local fails
      if (this.githubStorage) {
        try {
          const githubResult = await this.githubStorage.saveFile(
            metadata.projectId,
            metadata.fileName,
            metadata.content,
            metadata.userId
          )
          
          results.githubSuccess = true
          results.fileId = githubResult.sha // Use SHA as file ID
          
          await this.updateFileRecord(metadata, 'github', '', {
            githubUrl: githubResult.url,
            githubSha: githubResult.sha
          })
          
        } catch (githubError) {
          throw new Error(`Both local and GitHub storage failed: Local: ${localError}, GitHub: ${githubError}`)
        }
      } else {
        throw localError
      }
    }

    return results
  }

  /**
   * Load file with fallback strategy
   */
  async loadFile(projectId: string, fileName: string, userId: string): Promise<{
    content: string
    source: 'local' | 'github'
    metadata: any
  }> {
    // Get file record from database
    const [fileRecord] = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, projectId),
          eq(projectFiles.name, fileName),
          eq(projectFiles.userId, userId)
        )
      )
      .limit(1)

    if (!fileRecord) {
      throw new Error('File not found')
    }    // Try local first
    if (fileRecord.storageLocation) {
      try {
        const content = await FileStorageService.getFile(
          fileRecord.storageLocation
        )
        return {
          content,
          source: 'local',
          metadata: fileRecord
        }
      } catch (localError) {
        console.warn('Local file load failed:', localError)
      }
    }

    // Fallback to GitHub
    if (fileRecord.githubUrl && this.githubStorage) {
      try {
        const content = await this.githubStorage.getFile(
          fileRecord.githubUrl,
          userId
        )
        return {
          content,
          source: 'github',
          metadata: fileRecord
        }
      } catch (githubError) {
        console.error('GitHub file load failed:', githubError)
      }
    }

    throw new Error('File not accessible from any storage provider')
  }

  /**
   * Sync project to GitHub (create repository)
   */
  async syncProjectToGitHub(projectId: string, userId: string, options: {
    repoName: string
    description?: string
    isPrivate?: boolean
    autoCommit?: boolean
  }): Promise<{
    repoUrl: string
    syncedFiles: number
  }> {
    if (!this.githubStorage) {
      throw new Error('GitHub storage not configured')
    }

    // Get all project files
    const files = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, projectId),
          eq(projectFiles.userId, userId)
        )
      )

    // Create GitHub repository
    const repo = await this.githubStorage.createRepository(
      options.repoName,
      options.description || 'Project created with FlashIO',
      options.isPrivate || false,
      userId
    )

    let syncedFiles = 0

    // Upload all files to GitHub
    for (const file of files) {
      try {        // Load file content (prefer local)
        let content = ''
        if (file.storageLocation) {
          content = await FileStorageService.getFile(file.storageLocation)
        }

        if (content) {
          await this.githubStorage.uploadFileToRepo(
            repo.name,
            file.path,
            content,
            `Add ${file.name}`,
            userId
          )

          // Update database record
          await db
            .update(projectFiles)
            .set({
              storageType: 'hybrid',
              githubUrl: `${repo.url}/blob/main/${file.path}`,
              lastGithubSync: new Date()
            })
            .where(eq(projectFiles.id, file.id))

          syncedFiles++
        }
      } catch (error) {
        console.error(`Failed to sync file ${file.name}:`, error)
      }
    }

    return {
      repoUrl: repo.url,
      syncedFiles
    }
  }

  /**
   * Enable GitHub sync for existing project
   */
  async enableGitHubSync(projectId: string, userId: string): Promise<void> {
    this.config.githubSync = true
    
    if (!this.githubStorage) {
      this.githubStorage = new GitHubStorageService()
    }

    // Optionally sync existing files
    if (this.config.autoCommit) {
      await this.syncProjectToGitHub(projectId, userId, {
        repoName: `flashio-project-${projectId}`,
        description: 'FlashIO project with GitHub sync enabled',
        isPrivate: true,
        autoCommit: true
      })
    }
  }

  /**
   * Update file record in database
   */
  private async updateFileRecord(
    metadata: FileMetadata,
    storageType: 'local' | 'github' | 'hybrid',
    localPath: string,
    githubData?: {
      githubUrl?: string
      githubSha?: string
      lastGithubSync?: Date
    }
  ): Promise<void> {
    const updateData: any = {
      storageType,
      storageLocation: localPath,
      updatedAt: new Date()
    }

    if (githubData) {
      Object.assign(updateData, githubData)
    }

    // Check if file record exists
    const [existing] = await db
      .select()
      .from(projectFiles)
      .where(
        and(
          eq(projectFiles.projectId, metadata.projectId),
          eq(projectFiles.name, metadata.fileName),
          eq(projectFiles.userId, metadata.userId)
        )
      )
      .limit(1)

    if (existing) {
      await db
        .update(projectFiles)
        .set(updateData)
        .where(eq(projectFiles.id, existing.id))
    } else {
      await db
        .insert(projectFiles)
        .values({
          ...updateData,
          projectId: metadata.projectId,
          name: metadata.fileName,
          path: metadata.filePath,
          userId: metadata.userId,
          size: metadata.content.length,
          mimeType: this.getMimeType(metadata.fileName)
        })
    }
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'jsx': 'application/javascript',
      'tsx': 'application/typescript',
      'json': 'application/json',
      'html': 'text/html',
      'css': 'text/css',
      'md': 'text/markdown',
      'txt': 'text/plain'
    }
    return mimeTypes[ext || ''] || 'text/plain'
  }
}
