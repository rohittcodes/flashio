import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import { projectFiles } from '@/db/schemas'
import { eq, and, sql } from 'drizzle-orm'
import { FileStorageService } from '@/lib/file-storage'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const projectId = searchParams.get('projectId')    // If only projectId is provided, return all files for the project
    if (projectId && !fileId) {
      try {        const files = await db
          .select({
            id: projectFiles.id,
            path: projectFiles.path,
            language: projectFiles.language,
            size: projectFiles.size,
            mimeType: projectFiles.mimeType,
            isDirectory: projectFiles.isDirectory,
            isBinary: projectFiles.isBinary,
            createdAt: projectFiles.createdAt,
            updatedAt: projectFiles.updatedAt
          })
          .from(projectFiles)
          .where(eq(projectFiles.projectId, projectId))
          .orderBy(projectFiles.path)

        console.log(`Found ${files.length} files for project ${projectId}`)
        return NextResponse.json(files)
      } catch (error) {
        console.error('Failed to fetch project files:', error)
        return NextResponse.json({ error: 'Failed to fetch project files' }, { status: 500 })
      }
    }

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

    const fileRecord = file[0]    // Get file content (simplified for existing schema)
    const content = fileRecord.content || ''

    return NextResponse.json({
      id: fileRecord.id,
      path: fileRecord.path,
      content,
      language: fileRecord.language,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      isDirectory: fileRecord.isDirectory,
      isBinary: fileRecord.isBinary,
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
    const checksum = createHash('sha256').update(content || '').digest('hex')    // Determine storage strategy based on file size
    const maxDbSize = 100 * 1024 // 100KB
    const useExternalStorage = size > maxDbSize
    
    // Create file record using raw SQL to avoid schema issues
    const fileId = crypto.randomUUID()
    const now = new Date()
    const isBinary = mimeType?.startsWith('application/') || mimeType?.startsWith('image/') || false
      await db.execute(sql`
      INSERT INTO project_files (
        id, "projectId", path, content, language, "mimeType", size, checksum, 
        "isDirectory", "isBinary", "lastModifiedBy", "createdAt", "updatedAt"
      ) VALUES (
        ${fileId}, ${projectId}, ${path}, ${content || ''}, ${language || null}, ${mimeType || null}, 
        ${size}, ${checksum}, ${isDirectory}, ${isBinary}, 
        ${session.user.id}, ${now}, ${now}
      )
    `)
      const fileRecord = {
      id: fileId,
      projectId,
      path,
      content: content || '',
      language,
      mimeType,
      size,
      checksum,
      isDirectory,
      isBinary,
      lastModifiedBy: session.user.id,
      createdAt: now,
      updatedAt: now
    }

    return NextResponse.json({
      id: fileRecord.id,
      path: fileRecord.path,
      size: fileRecord.size,
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

    const file = existingFile[0]    // Calculate new size and checksum
    const size = Buffer.byteLength(content || '', 'utf-8')
    const checksum = createHash('sha256').update(content || '').digest('hex')

    // Update database content (simplified for existing schema)
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
    }    // Delete database record (simplified for existing schema)
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
