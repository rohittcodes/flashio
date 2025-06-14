import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/schema'
import { projectFiles } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { FileStorageService } from '@/lib/file-storage'
import { WebContainerService } from '@/lib/webcontainer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, projectId } = await request.json()

    if (!instanceId || !projectId) {
      return NextResponse.json(
        { error: 'Missing instanceId or projectId' },
        { status: 400 }
      )
    }

    // Get all project files from database
    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(projectFiles.path)

    const loadedFiles = []
    let successCount = 0
    let errorCount = 0

    // Load each file into WebContainer
    for (const file of files) {
      try {
        let content = ''

        // Get file content based on storage type
        switch (file.storageType) {
          case 'filesystem':
            if (file.storageKey) {
              content = await FileStorageService.getFile(file.storageKey)
            }
            break
          case 'database':
          default:
            content = file.content || ''
            break
        }

        // Write file to WebContainer
        await WebContainerService.writeFile(instanceId, file.path, content)

        loadedFiles.push({
          path: file.path,
          size: file.size,
          language: file.language,
          loaded: true
        })
        successCount++
      } catch (error) {
        console.error(`Failed to load file ${file.path} into WebContainer:`, error)
        loadedFiles.push({
          path: file.path,
          size: file.size,
          language: file.language,
          loaded: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: 'Project files loaded into WebContainer',
      totalFiles: files.length,
      successCount,
      errorCount,
      files: loadedFiles
    })
  } catch (error) {
    console.error('Failed to load project files into WebContainer:', error)
    return NextResponse.json(
      { error: 'Failed to load project files' },
      { status: 500 }
    )
  }
}
