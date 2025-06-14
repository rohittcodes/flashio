'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface XTermWrapperProps {
  sessionId: string
  webContainerId: string
  projectId: string
  onTerminalReady?: (terminal: Terminal) => void
  className?: string
}

export default function XTermWrapper({
  sessionId,
  webContainerId,
  projectId,
  onTerminalReady,
  className = ''
}: XTermWrapperProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminal = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!terminalRef.current || typeof window === 'undefined') return

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
    terminal.current.loadAddon(webLinksAddon)

    // Open terminal in DOM element
    terminal.current.open(terminalRef.current)
    
    // Fit terminal to container
    fitAddon.current.fit()

    // Display welcome message
    displayWelcomeMessage(terminal.current)

    // Initialize terminal session
    initializeTerminal()

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
  }, [sessionId, webContainerId, projectId])

  const displayWelcomeMessage = (term: Terminal) => {
    const flashIoArt = [
      "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄",
      "█  ▄████▄   █████▄  █████▄ ▄█████▄ █ █    █      ▄█████▄     █",
      "█ █▀    ▀█  █    █  █    █ █▀    █ █ █    █      █     █     █",
      "█ █      █  █    █  █    █ █        █    █       █     █     █",
      "█ █▄    ▄█  █    █  █    █ █▄    █  █   █        █     █     █",
      "█  ▀████▀   █████▀  █████▀ ▀█████▀  █  █          ▀███▀      █",
      "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"
    ];

    term.write('\r\n');
    
    // Write ASCII art in blue
    flashIoArt.forEach(line => {
      term.write('\x1b[34m' + line + '\x1b[0m\r\n');
    });
    
    term.write('\r\n');
    term.write('\x1b[32m✓ Flash.io Terminal Ready\x1b[0m\r\n');
    term.write('\x1b[90mConnecting to project environment...\x1b[0m\r\n\r\n');
  };

  const initializeTerminal = async () => {
    if (!terminal.current) return

    try {
      // Start terminal session via API
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
      
      // Set up bidirectional communication
      setupTerminalIO(processId)
      setIsConnected(true)

    } catch (error) {
      console.error('Failed to initialize terminal:', error)
      if (terminal.current) {
        terminal.current.write('\\r\\n\\x1b[31mFailed to connect to terminal\\x1b[0m\\r\\n')
      }
    }
  }

  const setupTerminalIO = (processId: string) => {
    if (!terminal.current) return

    // Handle user input
    terminal.current.onData((data: string) => {
      // Send input to backend
      fetch('/api/terminal/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          processId,
          data
        }),
      }).catch(console.error)
    })

    // Set up server-sent events for output
    const eventSource = new EventSource(`/api/terminal/output?sessionId=${sessionId}&processId=${processId}`)
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.output && terminal.current) {
        terminal.current.write(data.output)
      }
    }

    eventSource.onerror = () => {
      console.error('Terminal output stream error')
      setIsConnected(false)
    }

    // Store event source reference for cleanup
    ;(terminal.current as any).eventSource = eventSource
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
