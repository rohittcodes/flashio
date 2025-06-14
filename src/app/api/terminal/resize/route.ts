import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/schema'
import { terminalSessions } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, cols, rows } = await request.json()

    if (!sessionId || !cols || !rows) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Update terminal session size in database
    await db
      .update(terminalSessions)
      .set({
        terminalSize: { cols, rows },
        lastActivity: new Date()
      })
      .where(eq(terminalSessions.id, sessionId))

    return NextResponse.json({
      sessionId,
      cols,
      rows,
      message: 'Terminal resized successfully'
    })
  } catch (error) {
    console.error('Failed to resize terminal:', error)
    return NextResponse.json(
      { error: 'Failed to resize terminal' },
      { status: 500 }
    )
  }
}
