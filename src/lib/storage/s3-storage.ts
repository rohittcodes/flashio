import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface S3Config {
  region: string
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
}

export interface S3FileMetadata {
  key: string
  content: string
  contentType: string
  projectId: string
  userId: string
  fileName: string
}

export interface S3FileResult {
  key: string
  url: string
  uploadedAt: string
  size: number
}

export class S3StorageService {
  private s3Client: S3Client
  private bucketName: string

  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucketName = config.bucketName
  }

  /**
   * Generate S3 key for file storage
   */
  private generateKey(userId: string, projectId: string, fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `projects/${userId}/${projectId}/${fileName}`
  }

  /**
   * Upload file to S3
   */
  async uploadFile(metadata: S3FileMetadata): Promise<S3FileResult> {
    const key = this.generateKey(metadata.userId, metadata.projectId, metadata.fileName)
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: metadata.content,
      ContentType: metadata.contentType || 'text/plain',
      Metadata: {
        projectId: metadata.projectId,
        userId: metadata.userId,
        fileName: metadata.fileName,
        uploadedAt: new Date().toISOString(),
      },
    })

    try {
      await this.s3Client.send(command)
      
      // Generate signed URL for access
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
      
      const signedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 })

      return {
        key,
        url: signedUrl,
        uploadedAt: new Date().toISOString(),
        size: Buffer.from(metadata.content).length,
      }
    } catch (error) {
      console.error('Failed to upload file to S3:', error)
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    try {
      const response = await this.s3Client.send(command)
      const body = response.Body
      
      if (!body) {
        throw new Error('File not found')
      }

      // Convert stream to string
      const chunks: Uint8Array[] = []
      const reader = body.transformToWebStream().getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const buffer = Buffer.concat(chunks)
      return buffer.toString('utf-8')
    } catch (error) {
      console.error('Failed to download file from S3:', error)
      throw new Error(`S3 download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    try {
      await this.s3Client.send(command)
      return true
    } catch (error) {
      console.error('Failed to delete file from S3:', error)
      return false
    }
  }

  /**
   * List files for a project
   */
  async listProjectFiles(userId: string, projectId: string): Promise<S3FileResult[]> {
    const prefix = `projects/${userId}/${projectId}/`
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    })

    try {
      const response = await this.s3Client.send(command)
      const objects = response.Contents || []

      const files: S3FileResult[] = []
      
      for (const object of objects) {
        if (object.Key) {
          const getCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: object.Key,
          })
          
          const signedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 })
          
          files.push({
            key: object.Key,
            url: signedUrl,
            uploadedAt: object.LastModified?.toISOString() || new Date().toISOString(),
            size: object.Size || 0,
          })
        }
      }

      return files
    } catch (error) {
      console.error('Failed to list project files:', error)
      throw new Error(`S3 list failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate presigned URL for direct upload
   */
  async generatePresignedUploadUrl(
    userId: string,
    projectId: string,
    fileName: string,
    contentType: string = 'text/plain',
    expiresIn: number = 3600
  ): Promise<string> {
    const key = this.generateKey(userId, projectId, fileName)
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    })

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Failed to generate presigned URL:', error)
      throw new Error(`Presigned URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file content type based on extension
   */
  private getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const contentTypes: Record<string, string> = {
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'jsx': 'application/javascript',
      'tsx': 'application/typescript',
      'html': 'text/html',
      'css': 'text/css',
      'json': 'application/json',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'php': 'text/x-php',
      'rb': 'text/x-ruby',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
    }

    return contentTypes[extension || ''] || 'text/plain'
  }
}

export default S3StorageService
