'use client'

import { useState, useEffect, useRef } from 'react'
import { reloadPreview } from '@webcontainer/api'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ExternalLink, AlertCircle } from 'lucide-react'

interface PreviewProps {
  webContainerInstanceId: string | null
  className?: string
}

interface PreviewState {
  url: string | null
  port: number | null
  isLoading: boolean
  error: string | null
  isServerReady: boolean
}

export function Preview({ webContainerInstanceId, className = '' }: PreviewProps) {
  const [previewState, setPreviewState] = useState<PreviewState>({
    url: null,
    port: null,
    isLoading: false,
    error: null,
    isServerReady: false
  })
  const iframeRef = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    if (!webContainerInstanceId || typeof window === 'undefined') {
      return
    }

    const webContainer = (window as any).webContainerInstance
    if (!webContainer) {
      setPreviewState(prev => ({
        ...prev,
        error: 'WebContainer instance not available'
      }))
      return
    }

    console.log('🔍 Setting up preview listeners...')    // Listen for server-ready events
    const unsubscribeServerReady = webContainer.on('server-ready', (port: number, url: string) => {
      console.log(`🚀 Server ready on port ${port}:`, url)
      
      // Use the URL provided in the event
      setPreviewState(prev => ({
        ...prev,
        url,
        port,
        isServerReady: true,
        error: null,
        isLoading: false
      }))
    })    // Listen for port events (open/close)
    const unsubscribePort = webContainer.on('port', (port: number, type: 'open' | 'close', url: string) => {
      console.log(`📡 Port ${port} ${type}:`, url)
      
      if (type === 'open' && url) {
        setPreviewState(prev => ({
          ...prev,
          url,
          port,
          isServerReady: true,
          error: null
        }))
      } else if (type === 'close' && port === previewState.port) {
        setPreviewState(prev => ({
          ...prev,
          isServerReady: false,
          error: 'Server stopped'
        }))
      }
    })

    // Listen for errors
    const unsubscribeError = webContainer.on('error', (error: { message: string }) => {
      console.error('❌ WebContainer error:', error)
      setPreviewState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }))
    })

    // Listen for preview messages (errors from the preview iframe)
    const unsubscribePreviewMessage = webContainer.on('preview-message', (message: any) => {
      console.log('📨 Preview message:', message)
      // Handle preview errors if needed
      if (message.type === 'UncaughtException' || message.type === 'UnhandledRejection') {
        console.error('Preview error:', message.message)
      }
    })

    // Try to manually detect servers after a delay
    const checkTimer = setTimeout(() => {
      console.log('🔍 Manual server check - trying to detect running servers...')
      // Try to access WebContainer's internal state to find running servers
      manualServerCheck(webContainer)
    }, 3000)

    // Cleanup function
    return () => {
      unsubscribeServerReady()
      unsubscribePort()
      unsubscribeError()
      unsubscribePreviewMessage()
      clearTimeout(checkTimer)
    }
  }, [webContainerInstanceId, previewState.port])  // Manual server detection - simplified since events already provide URLs
  const manualServerCheck = async (webContainer: any) => {
    console.log('🔍 Manual server check completed. Listening for WebContainer events for server detection.')
    console.log('ℹ️ If a server is running, it should be detected automatically via WebContainer events.')
    console.log('💡 Make sure to start your server with "npm start", "npm run dev", or similar command.')
  }

  const handleRefresh = async () => {
    if (!iframeRef.current) return

    setPreviewState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Use WebContainer's reload function if available
      await reloadPreview(iframeRef.current)
    } catch (error) {
      console.error('Failed to reload preview:', error)
      // Fallback to manual reload
      if (iframeRef.current && previewState.url) {
        iframeRef.current.src = previewState.url
      }
    }
    
    setPreviewState(prev => ({ ...prev, isLoading: false }))
  }

  const handleOpenInNewTab = () => {
    if (previewState.url) {
      window.open(previewState.url, '_blank')
    }
  }

  const handleIframeLoad = () => {
    setPreviewState(prev => ({ ...prev, isLoading: false }))
  }

  const handleIframeError = () => {
    setPreviewState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Failed to load preview'
    }))
  }

  if (!webContainerInstanceId) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>WebContainer not initialized</p>
        </div>
      </div>
    )
  }

  if (!previewState.isServerReady && !previewState.error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Waiting for server to start...</p>
          <p className="text-sm mt-2">Run a development server to see your preview</p>
        </div>
      </div>
    )
  }

  if (previewState.error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center text-red-500 dark:text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium">Preview Error</p>
          <p className="text-sm mt-2">{previewState.error}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Server running on port {previewState.port}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={previewState.isLoading}
          >
            <RefreshCcw className={`w-4 h-4 ${previewState.isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            onClick={handleOpenInNewTab}
            variant="ghost"
            size="sm"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 relative">
        {previewState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={previewState.url || ''}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  )
}
