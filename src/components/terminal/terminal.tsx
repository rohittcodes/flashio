'use client'

import { useEffect, useRef, useState } from 'react'
import { WebContainerProcess } from '@webcontainer/api'
import { Terminal } from '@xterm/xterm'

interface TerminalComponentProps {
  sessionId: string
  webContainerId: string
  projectId: string
  onProcessCreated?: (process: WebContainerProcess) => void
  onTerminalReady?: (terminal: Terminal) => void
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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    <ClientOnlyTerminal
      sessionId={sessionId}
      webContainerId={webContainerId}
      projectId={projectId}
      onTerminalReady={onTerminalReady}
      className={className}
    />
  )
}

function ClientOnlyTerminal({
  sessionId,
  webContainerId,
  projectId,
  onTerminalReady,
  className = ''
}: {
  sessionId: string
  webContainerId: string
  projectId: string
  onTerminalReady?: (terminal: Terminal) => void
  className?: string
}) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminal = useRef<Terminal | null>(null)
  const fitAddon = useRef<any | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!terminalRef.current || typeof window === 'undefined') return

    const initTerminal = async () => {
      try {        // Dynamic imports to avoid SSR issues
        const { Terminal } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')
        const { WebLinksAddon } = await import('@xterm/addon-web-links')

        // Initialize terminal
        terminal.current = new Terminal({
          theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#ffffff',
            cursorAccent: '#000000',
            selectionBackground: '#ffffff30',
            black: '#000000',
            red: '#ff5555',
            green: '#50fa7b',
            yellow: '#f1fa8c',
            blue: '#bd93f9',
            magenta: '#ff79c6',
            cyan: '#8be9fd',
            white: '#bfbfbf',
            brightBlack: '#4d4d4d',
            brightRed: '#ff6e67',
            brightGreen: '#5af78e',
            brightYellow: '#f4f99d',
            brightBlue: '#caa9fa',
            brightMagenta: '#ff92d0',
            brightCyan: '#9aedfe',
            brightWhite: '#e6e6e6'
          },
          fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          cursorBlink: true,
          allowTransparency: true,
          convertEol: true,
          rows: 24,
          cols: 80
        })

        // Add addons
        fitAddon.current = new FitAddon()
        const webLinksAddon = new WebLinksAddon()
        
        terminal.current.loadAddon(fitAddon.current)
        terminal.current.loadAddon(webLinksAddon)        // Open terminal in DOM element
        if (terminalRef.current) {
          terminal.current.open(terminalRef.current)
        }
        
        // Fit terminal to container
        fitAddon.current.fit()

        // Initialize terminal session
        await initializeTerminal()

        // Notify parent component
        if (onTerminalReady) {
          onTerminalReady(terminal.current)
        }

        // Handle window resize
        const handleResize = () => {
          if (fitAddon.current) {
            fitAddon.current.fit()
          }
        }
        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (terminal.current) {
            terminal.current.dispose()
          }
        }
      } catch (error) {
        console.error('Failed to initialize terminal:', error)
      }
    }

    initTerminal()
  }, [sessionId, webContainerId, projectId])
  const initializeTerminal = async () => {
    if (!terminal.current) return

    try {
      // Start terminal session via API (creates database record)
      const response = await fetch('/api/terminal/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      const { processId } = await response.json()
      
      // Start shell process using client-side WebContainer
      if (typeof window !== 'undefined' && (window as any).webContainerInstance) {
        const webContainer = (window as any).webContainerInstance
        const shellProcess = await webContainer.spawn('jsh', {
          terminal: {
            cols: terminal.current.cols,
            rows: terminal.current.rows,
          },
        })

        // Store process reference for cleanup
        ;(terminal.current as any).shellProcess = shellProcess

        // Set up output stream
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminal.current) {
                terminal.current.write(data)
              }
            },
          })        )

        // Set up input stream
        const writer = shellProcess.input.getWriter()
        ;(terminal.current as any).processWriter = writer

        // Handle user input
        terminal.current.onData((data: string) => {
          // Send input directly to WebContainer process
          if (writer) {
            writer.write(data)
          }
        })

        setIsConnected(true)
      } else {
        throw new Error('WebContainer not available')
      }

    } catch (error) {
      console.error('Failed to initialize terminal:', error)
      if (terminal.current) {
        terminal.current.write('\\r\\n\\x1b[31mFailed to connect to terminal\\x1b[0m\\r\\n')
      }
    }
  }

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.clear()
    }
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
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
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
        className="terminal-content bg-gray-900 flex-1"
        style={{ height: '400px' }}
      />
    </div>
  )
}

export default TerminalComponent
