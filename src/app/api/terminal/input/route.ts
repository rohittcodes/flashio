import { NextRequest, NextResponse } from 'next/server'
import { WebContainerService } from '@/lib/webcontainer'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, processId, data } = await request.json()

    if (!sessionId || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get the terminal process
    const process = WebContainerService.getTerminalProcess(sessionId)
    if (!process) {
      return NextResponse.json(
        { error: 'Terminal session not found' },
        { status: 404 }
      )
    }    // Write input to the process
    const writer = process.input.getWriter()
    await writer.write(data)
    writer.releaseLock()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send terminal input:', error)
    return NextResponse.json(
      { error: 'Failed to send input to terminal' },
      { status: 500 }
    )
  }
}
