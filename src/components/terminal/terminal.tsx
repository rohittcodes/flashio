'use client'

import { useEffect, useRef, useState } from 'react'
import { WebContainerProcess } from '@webcontainer/api'

interface TerminalComponentProps {
  sessionId: string
  webContainerId: string
  projectId: string
  onProcessCreated?: (process: WebContainerProcess) => void
  onTerminalReady?: (terminal: any) => void
  className?: string
}

export function TerminalComponent({
  sessionId,
  webContainerId,
  projectId,
  onProcessCreated,
  onTerminalReady,
  className = ''
}: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminal = useRef<any>(null)
  const fitAddon = useRef<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !terminalRef.current || terminal.current) return

    let mounted = true

    const initTerminal = async () => {
      try {
        setStatus('Loading XTerm...')
        
        // Dynamic imports
        const { Terminal } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')
        
        if (!mounted) return

        setStatus('Creating terminal...')

        // Create terminal instance
        terminal.current = new Terminal({
          theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#ffffff',
          },
          fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          cursorBlink: true,
          convertEol: true,
          rows: 24,
          cols: 80,
        })

        // Create fit addon
        fitAddon.current = new FitAddon()
        terminal.current.loadAddon(fitAddon.current)

        if (!terminalRef.current || !mounted) return

        // Open terminal
        terminal.current.open(terminalRef.current)
        
        // Fit to container
        setTimeout(() => {
          if (fitAddon.current && mounted) {
            fitAddon.current.fit()
          }
        }, 100)

        // Write welcome message
        terminal.current.write('\r\n\x1b[32m✓ Terminal Ready\x1b[0m\r\n')
        terminal.current.write('\x1b[90mConnecting to WebContainer...\x1b[0m\r\n')

        setStatus('Connecting to WebContainer...')

        // Wait for WebContainer
        await waitForWebContainer()
        
        if (!mounted) return
        
        // Connect to shell
        await connectToShell()

      } catch (error) {
        console.error('Terminal initialization failed:', error)
        setStatus('Failed to initialize')
        
        if (terminalRef.current && mounted) {
          terminalRef.current.innerHTML = `
            <div style="color: #ff5555; font-family: monospace; padding: 20px;">
              <div>✗ Terminal failed to initialize</div>
              <div style="color: #999; margin-top: 10px;">Error: ${error}</div>
            </div>
          `
        }
      }
    }

    const waitForWebContainer = async () => {
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts && mounted) {
        if (typeof window !== 'undefined' && (window as any).webContainerInstance) {
          return
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      throw new Error('WebContainer not available')
    }

    const connectToShell = async () => {
      if (!terminal.current || !mounted) return

      try {
        // Start terminal session via API
        const response = await fetch('/api/terminal/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webContainerId,
            projectId,
            sessionId,
            terminalSize: {
              cols: terminal.current.cols,
              rows: terminal.current.rows
            }
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to start terminal session')
        }

        const webContainer = (window as any).webContainerInstance
        
        terminal.current.write('\r\n\x1b[32m✓ WebContainer connected\x1b[0m\r\n')
        terminal.current.write('\x1b[90mStarting shell...\x1b[0m\r\n')

        const shellProcess = await webContainer.spawn('jsh', [], {
          terminal: {
            cols: terminal.current.cols,
            rows: terminal.current.rows,
          },
        })

        // Handle output
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminal.current && mounted) {
                terminal.current.write(data)
              }
            },
          })
        )

        // Handle input
        const writer = shellProcess.input.getWriter()
        terminal.current.onData((data: string) => {
          if (writer && mounted) {
            writer.write(data)
          }
        })

        setIsConnected(true)
        setStatus('Connected')

        if (onTerminalReady) {
          onTerminalReady(terminal.current)
        }

      } catch (error) {
        console.error('Failed to connect to shell:', error)
        terminal.current.write('\r\n\x1b[31mFailed to connect to shell\x1b[0m\r\n')
        setStatus('Connection failed')
      }
    }

    initTerminal()

    return () => {
      mounted = false
      if (terminal.current) {
        terminal.current.dispose()
        terminal.current = null
      }
    }
  }, [isMounted, sessionId, webContainerId, projectId])

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.clear()
    }
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Loading terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`terminal-container ${className}`}>
      <div className="terminal-header bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span className="text-xs text-gray-400">{status}</span>
          <button
            onClick={clearTerminal}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div 
        ref={terminalRef} 
        className="terminal-content bg-gray-900 flex-1 h-full text-white p-2 overflow-hidden"
      />
    </div>
  )
}

export default TerminalComponent
