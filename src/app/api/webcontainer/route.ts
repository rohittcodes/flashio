import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/schema'
import { webContainerInstances, projects } from '@/db/schemas'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, options = {} } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      )
    }

    // Check if container already exists for this project/user
    const existingInstance = await db
      .select()
      .from(webContainerInstances)
      .where(
        and(
          eq(webContainerInstances.projectId, projectId),
          eq(webContainerInstances.userId, session.user.id),
          eq(webContainerInstances.status, 'ready')
        )
      )
      .limit(1)

    if (existingInstance.length > 0) {
      return NextResponse.json({
        instanceId: existingInstance[0].id,
        status: 'existing',
        message: 'Using existing WebContainer instance'
      })
    }

    // Check if project exists, if not create it
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (existingProject.length === 0) {
      // Create the project first
      await db.insert(projects).values({
        id: projectId,
        name: `Project ${projectId}`,
        description: 'Auto-created project for WebContainer',
        userId: session.user.id,
        status: 'draft',
        visibility: 'private'
      })
    }

    // Create new database record for WebContainer instance
    const instanceId = randomUUID()
    await db.insert(webContainerInstances).values({
      id: instanceId,
      projectId,
      userId: session.user.id,
      status: 'booting',
      createdAt: new Date(),
      lastActivity: new Date(),
      bootOptions: options
    })

    return NextResponse.json({
      instanceId,
      status: 'created',
      message: 'WebContainer instance record created successfully'
    })
  } catch (error) {
    console.error('Failed to create WebContainer instance record:', error)
    return NextResponse.json(
      { error: 'Failed to create WebContainer instance' },
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
    const instanceId = searchParams.get('instanceId')

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Missing instanceId' },
        { status: 400 }
      )
    }

    // Get WebContainer instance from database
    const instance = await db
      .select()
      .from(webContainerInstances)
      .where(eq(webContainerInstances.id, instanceId))
      .limit(1)
    
    if (instance.length === 0) {
      return NextResponse.json(
        { error: 'WebContainer instance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      instanceId,
      status: instance[0].status,
      message: 'WebContainer instance found',
      instance: instance[0]
    })
  } catch (error) {
    console.error('Failed to get WebContainer instance:', error)
    return NextResponse.json(
      { error: 'Failed to get WebContainer instance' },
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

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Missing instanceId' },
        { status: 400 }
      )
    }

    // Update WebContainer instance status in database
    await db
      .update(webContainerInstances)
      .set({ 
        status: 'terminated',
        terminatedAt: new Date()
      })
      .where(eq(webContainerInstances.id, instanceId))

    return NextResponse.json({
      instanceId,
      status: 'terminated',
      message: 'WebContainer instance terminated successfully'
    })
  } catch (error) {
    console.error('Failed to terminate WebContainer:', error)
    return NextResponse.json(
      { error: 'Failed to terminate WebContainer' },
      { status: 500 }
    )
  }
}
