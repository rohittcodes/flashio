import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { StorageManager } from '@/lib/storage/storage-manager'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, projectId, ...params } = await request.json()

    const storageManager = new StorageManager({
      primaryProvider: 'hybrid',
      enableBackup: true,
      githubSync: true,
      autoCommit: false
    })

    switch (action) {
      case 'enable-sync':
        await storageManager.enableGitHubSync(projectId, session.user.id)
        return NextResponse.json({ 
          success: true, 
          message: 'GitHub sync enabled' 
        })

      case 'sync-project':
        const result = await storageManager.syncProjectToGitHub(
          projectId, 
          session.user.id,
          {
            repoName: params.repoName || `flashio-project-${projectId}`,
            description: params.description,
            isPrivate: params.isPrivate !== false, // Default to private
            autoCommit: params.autoCommit || false
          }
        )
        return NextResponse.json({
          success: true,
          repoUrl: result.repoUrl,
          syncedFiles: result.syncedFiles
        })

      case 'save-file':
        const saveResult = await storageManager.saveFile({
          projectId,
          fileName: params.fileName,
          filePath: params.filePath,
          content: params.content,
          userId: session.user.id
        })
        return NextResponse.json({
          success: true,
          fileId: saveResult.fileId,
          localSuccess: saveResult.localSuccess,
          githubSuccess: saveResult.githubSuccess
        })

      case 'load-file':
        const loadResult = await storageManager.loadFile(
          projectId,
          params.fileName,
          session.user.id
        )
        return NextResponse.json({
          success: true,
          content: loadResult.content,
          source: loadResult.source
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Storage operation failed:', error)
    return NextResponse.json(
      { error: 'Storage operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const fileName = searchParams.get('fileName')

    if (!projectId || !fileName) {
      return NextResponse.json({ 
        error: 'Missing projectId or fileName' 
      }, { status: 400 })
    }

    const storageManager = new StorageManager({
      primaryProvider: 'hybrid',
      enableBackup: true,
      githubSync: true,
      autoCommit: false
    })

    const result = await storageManager.loadFile(
      projectId,
      fileName,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      content: result.content,
      source: result.source,
      metadata: result.metadata
    })

  } catch (error) {
    console.error('Failed to load file:', error)
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    )
  }
}
