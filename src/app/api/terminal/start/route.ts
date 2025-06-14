import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import { terminalSessions } from '@/db/schemas'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { webContainerId, projectId, sessionId, terminalSize } = await request.json()

    if (!webContainerId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }    // Create terminal session record
    const terminalSessionId = sessionId || randomUUID()
    const processId = `${Date.now()}-${Math.random()}`
    
    await db.insert(terminalSessions).values({
      id: terminalSessionId,
      webContainerId: webContainerId,
      projectId,
      userId: session.user.id,
      processId,
      status: 'running',
      terminalSize: { 
        cols: terminalSize?.cols || 80, 
        rows: terminalSize?.rows || 24 
      },
      createdAt: new Date()
    })

    return NextResponse.json({
      sessionId: terminalSessionId,
      processId
    })
  } catch (error) {
    console.error('Failed to start terminal:', error)
    return NextResponse.json(
      { error: 'Failed to start terminal session' },
      { status: 500 }
    )
  }
}
