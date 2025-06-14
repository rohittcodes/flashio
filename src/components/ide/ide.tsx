'use client'

import { useState, useEffect, useRef } from 'react'
import { CodeEditor } from '@/components/editor/code-editor'
import { TerminalComponent } from '@/components/terminal/terminal'
import { WebContainerProcess } from '@webcontainer/api'
import { Button } from '@/components/ui/button'

interface IDEProps {
  projectId: string
  initialFiles?: { path: string; content: string; language?: string }[]
  className?: string
}

interface OpenFile {
  path: string
  content: string
  language: string
  isModified: boolean
}

export function IDE({ projectId, initialFiles = [], className = '' }: IDEProps) {
  const [webContainerId, setWebContainerId] = useState<string | null>(null)
  const [terminalSessionId, setTerminalSessionId] = useState<string | null>(null)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [isWebContainerReady, setIsWebContainerReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize WebContainer and load initial files
  useEffect(() => {
    initializeIDE()
  }, [projectId])
  const initializeIDE = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Create WebContainer instance record
      const containerResponse = await fetch('/api/webcontainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          projectId,
          options: {
            coep: 'require-corp' as const,
            workdirName: `project-${projectId}`,
          },
        }),
      })

      if (!containerResponse.ok) {
        throw new Error('Failed to create WebContainer instance')
      }

      const { instanceId } = await containerResponse.json()
      setWebContainerId(instanceId)      // Boot WebContainer client-side
      if (typeof window !== 'undefined') {
        const { WebContainer } = await import('@webcontainer/api')
        const webContainer = await WebContainer.boot({
          coep: 'require-corp',
          workdirName: `project-${projectId}`,
        })

        // Store the WebContainer instance globally for access by other components
        ;(window as any).webContainerInstance = webContainer
        ;(window as any).webContainerInstanceId = instanceId

        setIsWebContainerReady(true)
      }

      // Load initial files
      if (initialFiles.length > 0) {
        const files = initialFiles.map(file => ({
          ...file,
          language: file.language || getLanguageFromPath(file.path),
          isModified: false
        }))
        setOpenFiles(files)
        setActiveFile(files[0]?.path || null)
      }

      setIsWebContainerReady(true)
    } catch (error) {
      console.error('Failed to initialize IDE:', error)
      setError('Failed to initialize development environment')
    } finally {
      setIsLoading(false)
    }
  }

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js': return 'javascript'
      case 'ts': return 'typescript'
      case 'tsx': case 'jsx': return 'typescript'
      case 'html': return 'html'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'md': return 'markdown'
      default: return 'javascript'
    }
  }

  const openFile = async (path: string) => {
    if (!webContainerId) return

    // Check if file is already open
    const existingFile = openFiles.find(f => f.path === path)
    if (existingFile) {
      setActiveFile(path)
      return
    }

    try {
      // Read file from WebContainer
      const response = await fetch(`/api/webcontainer/files?instanceId=${webContainerId}&path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error('Failed to read file')
      }

      const { content } = await response.json()
      const newFile: OpenFile = {
        path,
        content,
        language: getLanguageFromPath(path),
        isModified: false
      }

      setOpenFiles(prev => [...prev, newFile])
      setActiveFile(path)
    } catch (error) {
      console.error('Failed to open file:', error)
      setError(`Failed to open file: ${path}`)
    }
  }

  const saveFile = async (path: string, content: string) => {
    if (!webContainerId) return

    try {
      const response = await fetch('/api/webcontainer/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId: webContainerId,
          path,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save file')
      }

      // Update file state
      setOpenFiles(prev =>
        prev.map(file =>
          file.path === path
            ? { ...file, content, isModified: false }
            : file
        )
      )
    } catch (error) {
      console.error('Failed to save file:', error)
      setError(`Failed to save file: ${path}`)
    }
  }

  const closeFile = (path: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== path))
    if (activeFile === path) {
      const remainingFiles = openFiles.filter(f => f.path !== path)
      setActiveFile(remainingFiles[0]?.path || null)
    }
  }

  const handleFileChange = (path: string, content: string) => {
    setOpenFiles(prev =>
      prev.map(file =>
        file.path === path
          ? { ...file, content, isModified: file.content !== content }
          : file
      )
    )
  }

  const createFile = async (path: string, content: string = '') => {
    if (!webContainerId) return

    try {
      await saveFile(path, content)
      await openFile(path)
    } catch (error) {
      console.error('Failed to create file:', error)
      setError(`Failed to create file: ${path}`)
    }
  }

  const runCommand = async (command: string) => {
    if (!webContainerId || !terminalSessionId) return

    try {
      await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: terminalSessionId,
          webContainerId,
          command,
        }),
      })
    } catch (error) {
      console.error('Failed to run command:', error)
    }
  }

  const activeFileData = openFiles.find(f => f.path === activeFile)
  if (isLoading) {
    return (
      <div className={`ide-container ${className} flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing development environment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`ide-container ${className} flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={initializeIDE}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`ide-container ${className} flex flex-col h-screen bg-gray-900 text-white`}>
      {/* Top toolbar */}
      <div className="toolbar bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">FlashIO IDE</h1>
          <div className={`w-2 h-2 rounded-full ${isWebContainerReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runCommand('npm install')}
            disabled={!isWebContainerReady}
          >
            Install Dependencies
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runCommand('npm run dev')}
            disabled={!isWebContainerReady}
          >
            Start Dev Server
          </Button>
        </div>
      </div>

      {/* File tabs */}
      {openFiles.length > 0 && (
        <div className="file-tabs bg-gray-800 border-b border-gray-700 flex overflow-x-auto">
          {openFiles.map((file) => (
            <div
              key={file.path}
              className={`file-tab px-4 py-2 border-r border-gray-700 cursor-pointer flex items-center space-x-2 ${
                activeFile === file.path ? 'bg-gray-700' : 'hover:bg-gray-750'
              }`}
              onClick={() => setActiveFile(file.path)}
            >
              <span className="text-sm">{file.path.split('/').pop()}</span>
              {file.isModified && <div className="w-1 h-1 rounded-full bg-orange-400"></div>}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeFile(file.path)
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main content area */}
      <div className="main-content flex-1 flex">
        {/* Editor panel */}
        <div className="editor-panel flex-1 flex flex-col">
          {activeFileData ? (
            <CodeEditor
              filePath={activeFileData.path}
              content={activeFileData.content}
              language={activeFileData.language as any}
              onChange={(content) => handleFileChange(activeFileData.path, content)}
              onSave={(content) => saveFile(activeFileData.path, content)}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No file open</p>
                <p className="text-sm">Open a file to start coding</p>
              </div>
            </div>
          )}
        </div>

        {/* Terminal panel */}
        <div className="terminal-panel w-1/2 border-l border-gray-700">
          {webContainerId && (
            <TerminalComponent
              sessionId={terminalSessionId || ''}
              webContainerId={webContainerId}
              projectId={projectId}
              onProcessCreated={(process) => {
                console.log('Terminal process created:', process)
              }}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default IDE
