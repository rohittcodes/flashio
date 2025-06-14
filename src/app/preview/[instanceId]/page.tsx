'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { WebContainer } from '@webcontainer/api'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ExternalLink, AlertCircle } from 'lucide-react'

interface PreviewPageState {
  webContainer: WebContainer | null
  previewUrl: string | null
  port: number | null
  isLoading: boolean
  error: string | null
  isServerReady: boolean
}

export default function PreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const instanceId = params.instanceId as string
  const port = searchParams.get('port')

  const [state, setState] = useState<PreviewPageState>({
    webContainer: null,
    previewUrl: null,
    port: port ? parseInt(port) : null,
    isLoading: true,
    error: null,
    isServerReady: false
  })

  useEffect(() => {
    if (!instanceId) {
      setState(prev => ({ ...prev, error: 'Invalid instance ID', isLoading: false }))
      return
    }

    initializePreview()
  }, [instanceId])

  const initializePreview = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Check if WebContainer instance exists in the database
      const response = await fetch(`/api/webcontainer/${instanceId}`)
      if (!response.ok) {
        throw new Error('WebContainer instance not found')
      }

      const { instance } = await response.json()
      
      if (instance.status !== 'ready') {
        throw new Error('WebContainer instance is not ready')
      }

      // Try to get the current preview URL from the database
      if (instance.containerUrl) {
        setState(prev => ({
          ...prev,
          previewUrl: instance.containerUrl,
          port: instance.port,
          isServerReady: true,
          isLoading: false
        }))
        return
      }

      // If no preview URL in database, we need to connect to the WebContainer
      // This would typically require the WebContainer to be running in the same browser session
      setState(prev => ({
        ...prev,
        error: 'Preview not available. Please start the development server in the IDE.',
        isLoading: false
      }))

    } catch (error) {
      console.error('Failed to initialize preview:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load preview',
        isLoading: false
      }))
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleOpenInNewTab = () => {
    if (state.previewUrl) {
      window.open(state.previewUrl, '_blank')
    }
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Preview Not Available
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.error}
          </p>
          <div className="space-x-3">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => window.close()} variant="ghost">
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!state.isServerReady || !state.previewUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Server Not Running
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The development server is not currently running. Please start your server in the IDE to see the preview.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Preview - Port {state.port}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {state.previewUrl}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCcw className="w-4 h-4" />
          </Button>
          
          <Button onClick={handleOpenInNewTab} variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1">
        <iframe
          src={state.previewUrl}
          className="w-full h-full border-0"
          title="WebContainer Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    </div>
  )
}
