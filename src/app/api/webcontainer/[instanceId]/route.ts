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

    return NextResponse.json({
      instance: {
        id: instance.id,
        projectId: instance.projectId,
        status: instance.status,
        port: instance.port,
        containerUrl: instance.containerUrl,
        lastActivity: instance.lastActivity,
        createdAt: instance.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching WebContainer instance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
