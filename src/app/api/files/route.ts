import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import { projectFiles } from '@/db/schemas'
import { eq, and } from 'drizzle-orm'
import { FileStorageService } from '@/lib/file-storage'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const projectId = searchParams.get('projectId')

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    // Get file metadata
    const file = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId))
      .limit(1)

    if (file.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileRecord = file[0]

    // Get file content based on storage type
    let content = ''
    switch (fileRecord.storageType) {
      case 'filesystem':
        if (fileRecord.storageKey) {
          content = await FileStorageService.getFile(fileRecord.storageKey)
        }
        break
      case 'database':
      default:
        content = fileRecord.content || ''
        break
    }

    return NextResponse.json({
      id: fileRecord.id,
      path: fileRecord.path,
      content,
      language: fileRecord.language,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      isDirectory: fileRecord.isDirectory,
      isBinary: fileRecord.isBinary,
      storageType: fileRecord.storageType,
      updatedAt: fileRecord.updatedAt
    })
  } catch (error) {
    console.error('Failed to get file:', error)
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, path, content, language, mimeType, isDirectory = false } = await request.json()

    if (!projectId || !path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate file size and checksum
    const size = Buffer.byteLength(content || '', 'utf-8')
    const checksum = createHash('sha256').update(content || '').digest('hex')

    // Determine storage strategy based on file size
    const maxDbSize = 100 * 1024 // 100KB
    const useExternalStorage = size > maxDbSize

    let storageKey = null
    let storageType = 'database'
    let fileContent = content

    if (useExternalStorage && !isDirectory) {
      // Store in filesystem
      const { storageKey: key } = await FileStorageService.storeFile(
        projectId,
        path,
        content || ''
      )
      storageKey = key
      storageType = 'filesystem'
      fileContent = '' // Don't store in DB if using external storage
    }

    // Create file record
    const [fileRecord] = await db.insert(projectFiles).values({
      projectId,
      path,
      content: fileContent,
      storageKey,
      storageType,
      language,
      mimeType,
      size,
      checksum,
      isDirectory,
      isBinary: mimeType?.startsWith('application/') || mimeType?.startsWith('image/'),
      lastModifiedBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    return NextResponse.json({
      id: fileRecord.id,
      path: fileRecord.path,
      size: fileRecord.size,
      storageType: fileRecord.storageType,
      message: 'File created successfully'
    })
  } catch (error) {
    console.error('Failed to create file:', error)
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, content } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    // Get existing file
    const existingFile = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId))
      .limit(1)

    if (existingFile.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const file = existingFile[0]

    // Calculate new size and checksum
    const size = Buffer.byteLength(content || '', 'utf-8')
    const checksum = createHash('sha256').update(content || '').digest('hex')

    // Update content based on storage type
    if (file.storageType === 'filesystem' && file.storageKey) {
      // Update external file
      await FileStorageService.updateFile(file.storageKey, content || '')
      
      // Update database metadata only
      await db
        .update(projectFiles)
        .set({
          size,
          checksum,
          lastModifiedBy: session.user.id,
          updatedAt: new Date()
        })
        .where(eq(projectFiles.id, fileId))
    } else {
      // Update database content
      await db
        .update(projectFiles)
        .set({
          content,
          size,
          checksum,
          lastModifiedBy: session.user.id,
          updatedAt: new Date()
        })
        .where(eq(projectFiles.id, fileId))
    }

    return NextResponse.json({
      id: fileId,
      size,
      message: 'File updated successfully'
    })
  } catch (error) {
    console.error('Failed to update file:', error)
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    // Get file info for cleanup
    const file = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId))
      .limit(1)

    if (file.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileRecord = file[0]

    // Delete external file if exists
    if (fileRecord.storageType === 'filesystem' && fileRecord.storageKey) {
      await FileStorageService.deleteFile(fileRecord.storageKey)
    }

    // Delete database record
    await db.delete(projectFiles).where(eq(projectFiles.id, fileId))

    return NextResponse.json({
      id: fileId,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
