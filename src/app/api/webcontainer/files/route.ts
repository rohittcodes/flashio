import { NextRequest, NextResponse } from 'next/server'
import { WebContainerService } from '@/lib/webcontainer'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const path = searchParams.get('path')

    if (!instanceId || !path) {
      return NextResponse.json(
        { error: 'Missing instanceId or path' },
        { status: 400 }
      )
    }

    // Read file from WebContainer
    const content = await WebContainerService.readFile(instanceId, path)

    return NextResponse.json({
      path,
      content,
      encoding: 'utf8'
    })
  } catch (error) {
    console.error('Failed to read file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instanceId, path, content, encoding = 'utf8' } = await request.json()

    if (!instanceId || !path || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Write file to WebContainer
    await WebContainerService.writeFile(instanceId, path, content, encoding as BufferEncoding)

    return NextResponse.json({
      path,
      message: 'File written successfully'
    })
  } catch (error) {
    console.error('Failed to write file:', error)
    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const path = searchParams.get('path')
    const recursive = searchParams.get('recursive') === 'true'

    if (!instanceId || !path) {
      return NextResponse.json(
        { error: 'Missing instanceId or path' },
        { status: 400 }
      )
    }

    // Remove file/directory from WebContainer
    await WebContainerService.remove(instanceId, path, { recursive })

    return NextResponse.json({
      path,
      message: 'File/directory removed successfully'
    })
  } catch (error) {
    console.error('Failed to remove file:', error)
    return NextResponse.json(
      { error: 'Failed to remove file' },
      { status: 500 }
    )
  }
}
