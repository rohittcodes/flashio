'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Github, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface GitHubSyncProps {
  projectId: string
  onSyncComplete?: (repoUrl: string) => void
}

export function GitHubSync({ projectId, onSyncComplete }: GitHubSyncProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [repoUrl, setRepoUrl] = useState<string>('')
  const [repoName, setRepoName] = useState(`flashio-project-${projectId}`)
  const [description, setDescription] = useState('Project created with FlashIO')
  const [isPrivate, setIsPrivate] = useState(true)
  const [error, setError] = useState<string>('')
  const [syncDetails, setSyncDetails] = useState<{
    syncedFiles: number
    errors: string[]
  }>({ syncedFiles: 0, errors: [] })

  const handleSyncToGitHub = async () => {
    setIsLoading(true)
    setSyncStatus('syncing')
    setError('')
    
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-project',
          projectId,
          repoName,
          description,
          isPrivate,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync project')
      }

      if (result.success) {
        setSyncStatus('success')
        setRepoUrl(result.repoUrl)
        setSyncDetails({
          syncedFiles: result.syncedFiles || 0,
          errors: result.errors || []
        })
        onSyncComplete?.(result.repoUrl)
      } else {
        throw new Error('Sync was not successful')
      }
    } catch (err) {
      setSyncStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const resetSync = () => {
    setSyncStatus('idle')
    setRepoUrl('')
    setError('')
    setSyncDetails({ syncedFiles: 0, errors: [] })
  }

  const renderSyncStatus = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing to GitHub...</span>
          </div>
        )
      case 'success':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Successfully synced to GitHub!</span>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Repository:</strong>{' '}
                <a 
                  href={repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {repoUrl}
                </a>
              </p>
              <p className="text-sm text-green-800 mt-1">
                <strong>Files synced:</strong> {syncDetails.syncedFiles}
              </p>
              {syncDetails.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-amber-700 font-medium">Warnings:</p>
                  <ul className="text-xs text-amber-600 mt-1 space-y-1">
                    {syncDetails.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button 
              onClick={resetSync}
              variant="outline"
              size="sm"
            >
              Sync Again
            </Button>
          </div>
        )
      case 'error':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Sync failed</span>
            </div>
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <Button 
              onClick={resetSync}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name
                </label>
                <input
                  id="repoName"
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-awesome-project"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A brief description of your project"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
                  Make repository private
                </label>
              </div>
            </div>

            <Button 
              onClick={handleSyncToGitHub}
              disabled={isLoading || !repoName.trim()}
              className="w-full"
            >
              <Github className="h-4 w-4 mr-2" />
              {isLoading ? 'Syncing...' : 'Sync to GitHub'}
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Github className="h-5 w-5" />
        <h3 className="text-lg font-semibold">GitHub Sync</h3>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        Sync your project files to a GitHub repository for version control and sharing.
      </div>

      {renderSyncStatus()}
    </div>
  )
}
