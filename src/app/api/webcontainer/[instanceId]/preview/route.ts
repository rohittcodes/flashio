import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { webContainerInstances } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  try {
    const { instanceId } = params
    const { searchParams } = new URL(request.url)
    const port = searchParams.get('port')

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      )
    }

    // Get the WebContainer instance from database
    const instances = await db
      .select()
      .from(webContainerInstances)
      .where(eq(webContainerInstances.id, instanceId))
      .limit(1)

    if (instances.length === 0) {
      return NextResponse.json(
        { error: 'WebContainer instance not found' },
        { status: 404 }
      )
    }

    const instance = instances[0]

    if (instance.status !== 'ready') {
      return NextResponse.json(
        { error: 'WebContainer instance is not ready' },
        { status: 400 }
      )
    }

    // Generate preview URL based on the port
    // WebContainer URLs are typically in the format: https://[subdomain].webcontainer.io
    // For now, we'll return the stored URL or generate a mock URL
    const previewUrl = instance.containerUrl || 
      (port ? `http://localhost:${port}` : `http://localhost:${instance.port || 3000}`)

    return NextResponse.json({
      url: previewUrl,
      port: instance.port || (port ? parseInt(port) : 3000),
      status: 'ready'
    })
  } catch (error) {
    console.error('Error getting preview URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { instanceId: string } }
) {
  try {
    const { instanceId } = params
    const { port, url } = await request.json()

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      )
    }

    // Update the WebContainer instance with the preview URL
    await db
      .update(webContainerInstances)
      .set({
        port: port,
        containerUrl: url,
        lastActivity: new Date()
      })
      .where(eq(webContainerInstances.id, instanceId))

    return NextResponse.json({
      success: true,
      url,
      port
    })
  } catch (error) {
    console.error('Error updating preview URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
