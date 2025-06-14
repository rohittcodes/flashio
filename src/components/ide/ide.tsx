'use client'

import { useState, useEffect, useRef } from 'react'
import { CodeEditor } from '@/components/editor/code-editor'
import { TerminalComponent } from '@/components/terminal/terminal'
import { WebContainerProcess } from '@webcontainer/api'
import { Button } from '@/components/ui/button'
import { GitHubSync } from '@/components/storage/github-sync'
import { Settings, Cloud, Database, Save, Github, RefreshCw } from 'lucide-react'
import { webContainerManager } from '@/lib/webcontainer-manager'

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
  const [sidebarTab, setSidebarTab] = useState<'files' | 'storage' | 'settings'>('files')
  const [storageStatus, setStorageStatus] = useState({
    s3: false,
    github: false,
    local: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  // Initialize WebContainer and load initial files
  useEffect(() => {
    initializeIDE()
    
    // Clean up function to handle component unmount
    return () => {
      // We don't tear down WebContainer here as it might be needed by other components
      // Explicit teardown would be handled by a "Close Project" action
    }
  }, [projectId])
  
  const handleRetry = () => {
    // Reset the WebContainer manager to force a fresh start
    if (typeof window !== 'undefined') {
      webContainerManager.reset();
    }
    setError(null);
    setRetryCount(prev => prev + 1);
    initializeIDE();
  }

  const initializeIDE = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if project needs bootstrapping
      const bootstrapCheck = await fetch(`/api/projects/bootstrap?projectId=${projectId}`)
      if (bootstrapCheck.ok) {
        const { needsBootstrap } = await bootstrapCheck.json()
        if (needsBootstrap) {
          console.log('🚀 Project needs bootstrapping, creating default files...')
          
          // Bootstrap the project with default files
          const bootstrapResponse = await fetch('/api/projects/bootstrap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              projectType: 'node', // Default to Node.js project
            }),
          })

          if (bootstrapResponse.ok) {
            const bootstrapResult = await bootstrapResponse.json()
            console.log('✅ Project bootstrapped successfully:', bootstrapResult)
          } else {
            console.warn('⚠️ Failed to bootstrap project, continuing with existing files')
          }
        } else {
          console.log('📁 Project already has files, skipping bootstrap')
        }
      }

      // Create WebContainer instance record
      const containerResponse = await fetch('/api/webcontainer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
      setWebContainerId(instanceId)
      
      // Boot WebContainer client-side using our manager
      if (typeof window !== 'undefined') {
        try {
          // First, check if we already have a WebContainer instance globally
          let webContainer = (window as any).webContainerInstance;
          
          if (webContainer) {
            console.log('📌 Using existing global WebContainer instance');
          } else {
            // Try to get a WebContainer instance through our manager
            console.log('🔄 Getting WebContainer instance via manager...');
            try {
              webContainer = await webContainerManager.getWebContainer(projectId, {
                coep: 'require-corp',
              });
              console.log('✅ WebContainer instance created through manager');
            } catch (error) {
              console.error('⚠️ Failed to get WebContainer through manager:', error);
              
              // If we're hitting the "Only a single WebContainer" error, it means
              // something else in the app is already creating a WebContainer
              if (error instanceof Error && error.message.includes('Only a single WebContainer instance can be booted')) {
                console.log('⚠️ Another WebContainer exists but is not accessible. Trying to recover...');
                
                // Wait for any potential initialization to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Check again for global instance
                webContainer = (window as any).webContainerInstance;
                
                if (!webContainer) {
                  throw new Error('Cannot access existing WebContainer instance. Please refresh the page.');
                } else {
                  console.log('✅ Recovered existing WebContainer instance');
                }
              } else {
                throw error; // Re-throw other errors
              }
            }
          }
          
          // Make sure the WebContainer instance is accessible globally
          (window as any).webContainerInstance = webContainer;
          (window as any).webContainerInstanceId = instanceId;
          
          // Load project files into WebContainer
          await loadProjectFilesIntoWebContainer(webContainer, projectId);
          
          setIsWebContainerReady(true);
        } catch (error) {
          console.error('❌ Failed to initialize WebContainer:', error);
          setError(`WebContainer initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          if (error instanceof Error && error.message.includes('Only a single WebContainer instance can be booted')) {
            setError('Only one WebContainer instance can run at a time. Please close all other IDE tabs and refresh the page.');
          } else if (error instanceof Error && error.message.includes('Cannot access existing WebContainer')) {
            setError('A WebContainer instance exists but cannot be accessed. Please refresh the page to reset.');
          }
        }
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
      }      setIsWebContainerReady(true)
    } catch (error) {
      console.error('Failed to initialize IDE:', error)
      setError('Failed to initialize development environment')
    } finally {
      setIsLoading(false)
    }
  }
  // Load project files from database into WebContainer
  const loadProjectFilesIntoWebContainer = async (webContainer: any, projectId: string) => {
    try {
      console.log(`🔍 Fetching files for project: ${projectId}`)
      
      // Get project files from our API
      const response = await fetch(`/api/files?projectId=${projectId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Failed to fetch project files (${response.status}):`, errorText)
        
        // If it's a 500 error, the project might not exist yet
        if (response.status === 500) {
          console.log('Project might not exist yet or have no files. This is normal for new projects.')
        }
        return
      }

      const files = await response.json()
      console.log(`📂 Found ${files.length} files for project ${projectId}:`, files.map((f: any) => f.path))

      if (files.length === 0) {
        console.log('📁 No files found for this project')
        return
      }

      let loadedCount = 0
        // Load each file into WebContainer
      for (const file of files) {
        try {
          // Skip directories - they'll be created automatically when files are written
          if (file.isDirectory) {
            console.log(`Skipping directory: ${file.path}`)
            continue
          }

          // Get file content
          const fileResponse = await fetch(`/api/files?fileId=${file.id}`)
          if (fileResponse.ok) {
            const { content } = await fileResponse.json()
            
            // Ensure directory exists before writing file
            const dirPath = file.path.split('/').slice(0, -1).join('/')
            if (dirPath) {
              try {
                await webContainer.fs.mkdir(dirPath, { recursive: true })
              } catch (error) {
                // Directory might already exist, that's okay
              }
            }
            
            // Write to WebContainer filesystem
            await webContainer.fs.writeFile(file.path, content || '', 'utf8')
            loadedCount++
            console.log(`✅ Loaded file: ${file.path} (${content?.length || 0} chars)`)
          }
        } catch (error) {
          console.error(`❌ Failed to load file ${file.path}:`, error)
        }
      }      console.log(`Successfully loaded ${loadedCount}/${files.length} files into WebContainer`)

      // Set the first file as active if no initial files provided
      if (initialFiles.length === 0 && files.length > 0) {
        setActiveFile(files[0].path)
      }
    } catch (error) {
      console.error('Failed to load project files into WebContainer:', error)
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
      // Get the WebContainer instance from window
      const webContainer = (window as any).webContainerInstance
      if (!webContainer) {
        throw new Error('WebContainer instance not found')
      }

      // Read file from WebContainer directly (client-side)
      const content = await webContainer.fs.readFile(path, 'utf8')
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
    if (!webContainerId) {
      console.error('No WebContainer ID available for saving')
      return
    }

    setIsSaving(true)
    try {
      console.log(`💾 Saving file: ${path}`)      // Get the WebContainer instance from window
      const webContainer = (window as any).webContainerInstance
      if (!webContainer) {
        throw new Error('WebContainer instance not found')
      }

      // Ensure directory exists before writing file
      const dirPath = path.split('/').slice(0, -1).join('/')
      if (dirPath) {
        try {
          await webContainer.fs.mkdir(dirPath, { recursive: true })
        } catch (error) {
          // Directory might already exist, that's okay
          console.log(`Directory ${dirPath} already exists or created`)
        }
      }

      // Save to WebContainer directly (client-side)
      await webContainer.fs.writeFile(path, content, 'utf8')
      console.log('✅ Saved to WebContainer successfully')

      // Save to database - check if file exists first
      let fileId: string | null = null
      
      // Get all project files to find this file
      const filesResponse = await fetch(`/api/files?projectId=${projectId}`)
      if (filesResponse.ok) {
        const files = await filesResponse.json()
        const existingFile = files.find((f: any) => f.path === path)
        if (existingFile) {
          fileId = existingFile.id
        }
      }

      if (fileId) {
        // Update existing file
        const updateResponse = await fetch('/api/files', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            content,
          }),
        })

        if (!updateResponse.ok) {
          const error = await updateResponse.text()
          console.error('Failed to update file in database:', error)
          throw new Error(`Failed to update file: ${error}`)
        }

        console.log('✅ Updated file in database successfully')
      } else {
        // Create new file
        const createResponse = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            path,
            content,
            language: getLanguageFromPath(path),
          }),
        })

        if (!createResponse.ok) {
          const error = await createResponse.text()
          console.error('Failed to create file in database:', error)
          throw new Error(`Failed to create file: ${error}`)
        }

        console.log('✅ Created new file in database successfully')
      }      // Update file state in UI
      setOpenFiles(prev =>
        prev.map(file =>
          file.path === path
            ? { ...file, content, isModified: false }
            : file
        )
      )

      console.log(`💾 File ${path} saved successfully`)
    } catch (error) {
      console.error('Failed to save file:', error)
      setError(`Failed to save file: ${path}`)
    } finally {
      setIsSaving(false)
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save current file
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (activeFile) {
          const activeFileData = openFiles.find(f => f.path === activeFile)
          if (activeFileData) {
            saveFile(activeFileData.path, activeFileData.content)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, openFiles])

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
        <div className="text-center max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg">
          <div className="text-red-500 text-xl mb-4 flex items-center justify-center gap-2">
            <span className="text-3xl">⚠️</span> Error
          </div>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Return to Dashboard
            </Button>
          </div>
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
      <div className="main-content flex-1 flex">
        {/* Storage/GitHub Sync Sidebar */}
        <div className="storage-sidebar w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Sidebar tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setSidebarTab('files')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                sidebarTab === 'files' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-750'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setSidebarTab('storage')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                sidebarTab === 'storage' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-750'
              }`}
            >
              Storage
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'files' && (
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Open Files</h3>
                {openFiles.length > 0 ? (
                  <div className="space-y-1">
                    {openFiles.map((file) => (
                      <div
                        key={file.path}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                          activeFile === file.path 
                            ? 'bg-blue-600' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setActiveFile(file.path)}
                      >
                        <span className="truncate">
                          {file.path.split('/').pop()}
                          {file.isModified && (
                            <span className="ml-1 text-orange-400">•</span>
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            closeFile(file.path)
                          }}
                          className="ml-2 text-gray-400 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No files open</p>
                )}
              </div>
            )}

            {sidebarTab === 'storage' && (
              <div className="p-3 space-y-4">
                {/* Storage Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Storage Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Database className="h-3 w-3" />
                      <span>Local Database</span>
                      {storageStatus.local ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Cloud className="h-3 w-3" />
                      <span>S3 Storage</span>
                      {storageStatus.s3 ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Github className="h-3 w-3" />
                      <span>GitHub Sync</span>
                      {storageStatus.github ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-400">○</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* GitHub Sync Component */}
                <div className="border-t border-gray-700 pt-4">
                  <GitHubSync 
                    projectId={projectId}
                    onSyncComplete={(repoUrl) => {
                      setStorageStatus(prev => ({ ...prev, github: true }))
                      console.log('Project synced to:', repoUrl)
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>        {/* Editor panel */}
        <div className="editor-panel flex-1 flex flex-col">
          {isSaving && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 text-sm">
              💾 Saving file...
            </div>
          )}
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
