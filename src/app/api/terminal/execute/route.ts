import { NextRequest, NextResponse } from 'next/server'
import { WebContainerService } from '@/lib/webcontainer'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, webContainerId, command } = await request.json()

    if (!sessionId || !webContainerId || !command) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Execute command in WebContainer
    const process = await WebContainerService.executeCommand(
      webContainerId,
      'bash',
      ['-c', command]
    )

    // Get process output
    const outputReader = process.output.getReader()
    const { value: output } = await outputReader.read()
    outputReader.releaseLock()

    return NextResponse.json({
      command,
      output: output || '',
      exitCode: await process.exit
    })
  } catch (error) {
    console.error('Failed to execute command:', error)
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}
