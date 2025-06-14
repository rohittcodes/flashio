import { NextRequest } from 'next/server'
import { WebContainerService } from '@/lib/webcontainer'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const processId = searchParams.get('processId')

    if (!sessionId) {
      return new Response('Missing sessionId', { status: 400 })
    }

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Get the terminal process
        const process = WebContainerService.getTerminalProcess(sessionId)
        if (!process) {
          controller.enqueue(`data: ${JSON.stringify({ error: 'Terminal session not found' })}\\n\\n`)
          controller.close()
          return
        }

        // Set up output streaming
        const reader = process.output.getReader()
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              // Send output to client
              const data = JSON.stringify({ output: value })
              controller.enqueue(`data: ${data}\\n\\n`)
            }
          } catch (error) {
            console.error('Terminal output stream error:', error)
            controller.enqueue(`data: ${JSON.stringify({ error: 'Stream error' })}\\n\\n`)
          } finally {
            reader.releaseLock()
            controller.close()
          }
        }

        pump()

        // Handle cleanup when client disconnects
        request.signal.addEventListener('abort', () => {
          reader.releaseLock()
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('Failed to set up terminal output stream:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
