import fs from 'fs/promises'
import path from 'path'
import { createHash } from 'crypto'

export class FileStorageService {
  private static baseDir = path.join(process.cwd(), 'storage', 'files')

  /**
   * Initialize the storage directory
   */
  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize file storage directory:', error)
    }
  }

  /**
   * Store a file in the filesystem
   */
  static async storeFile(
    projectId: string, 
    filePath: string, 
    content: string
  ): Promise<{ storageKey: string }> {
    try {
      // Create a unique storage key
      const storageKey = this.generateStorageKey(projectId, filePath)
      const fullPath = path.join(this.baseDir, storageKey)
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      
      // Write file
      await fs.writeFile(fullPath, content, 'utf-8')
      
      return { storageKey }
    } catch (error) {
      console.error('Failed to store file:', error)
      throw new Error(`Failed to store file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Retrieve a file from the filesystem
   */
  static async getFile(storageKey: string): Promise<string> {
    try {
      const fullPath = path.join(this.baseDir, storageKey)
      return await fs.readFile(fullPath, 'utf-8')
    } catch (error) {
      console.error('Failed to get file:', error)
      throw new Error(`Failed to get file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update an existing file in the filesystem
   */
  static async updateFile(storageKey: string, content: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseDir, storageKey)
      await fs.writeFile(fullPath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to update file:', error)
      throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from the filesystem
   */
  static async deleteFile(storageKey: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseDir, storageKey)
      await fs.unlink(fullPath)
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a file exists
   */
  static async fileExists(storageKey: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, storageKey)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(storageKey: string): Promise<{ size: number; mtime: Date }> {
    try {
      const fullPath = path.join(this.baseDir, storageKey)
      const stats = await fs.stat(fullPath)
      return {
        size: stats.size,
        mtime: stats.mtime
      }
    } catch (error) {
      console.error('Failed to get file stats:', error)
      throw new Error(`Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List all files for a project
   */
  static async listProjectFiles(projectId: string): Promise<string[]> {
    try {
      const projectDir = path.join(this.baseDir, projectId)
      const files: string[] = []
      
      const readDir = async (dir: string, prefix = ''): Promise<void> => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true })
          
          for (const entry of entries) {
            const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
            
            if (entry.isDirectory()) {
              await readDir(path.join(dir, entry.name), relativePath)
            } else {
              files.push(relativePath)
            }
          }
        } catch (error) {
          // Directory might not exist, which is fine
        }
      }
      
      await readDir(projectDir)
      return files
    } catch (error) {
      console.error('Failed to list project files:', error)
      return []
    }
  }

  /**
   * Generate a storage key for a file
   */
  private static generateStorageKey(projectId: string, filePath: string): string {
    // Clean the file path to prevent directory traversal
    const cleanPath = filePath.replace(/\.\./g, '').replace(/^\/+/, '')
    return `${projectId}/${cleanPath}`
  }

  /**
   * Generate a hash for file content (for integrity checking)
   */
  static generateFileHash(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Cleanup old files (utility method)
   */
  static async cleanupOldFiles(olderThanDays = 30): Promise<number> {
    let cleanedCount = 0
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)

    try {
      const walkDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          
          if (entry.isDirectory()) {
            await walkDir(fullPath)
            // Remove empty directories
            try {
              await fs.rmdir(fullPath)
            } catch {
              // Directory not empty, which is fine
            }
          } else {
            const stats = await fs.stat(fullPath)
            if (stats.mtime.getTime() < cutoffTime) {
              await fs.unlink(fullPath)
              cleanedCount++
            }
          }
        }
      }

      await walkDir(this.baseDir)
    } catch (error) {
      console.error('Failed to cleanup old files:', error)
    }

    return cleanedCount
  }
}

export default FileStorageService
