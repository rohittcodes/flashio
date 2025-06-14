'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

  const handleEnableSync = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enable-sync',
          projectId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enable GitHub sync')
      }

      setSyncStatus('success')
    } catch (err) {
      setError('Failed to enable GitHub sync')
      setSyncStatus('error')
      console.error('GitHub sync error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncProject = async () => {
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
          autoCommit: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync project to GitHub')
      }

      const result = await response.json()
      setRepoUrl(result.repoUrl)
      setSyncStatus('success')
      
      if (onSyncComplete) {
        onSyncComplete(result.repoUrl)
      }
    } catch (err) {
      setError('Failed to sync project to GitHub')
      setSyncStatus('error')
      console.error('GitHub sync error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Sync your project to GitHub for backup and collaboration. Your files are always stored locally first.
        </p>
      </div>

      {syncStatus === 'idle' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Repository Name</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="flashio-project-name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Project description"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="private-repo"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="private-repo" className="text-sm">
              Make repository private
            </label>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleEnableSync}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Enabling...' : 'Enable GitHub Sync'}
            </Button>
            
            <Button
              onClick={handleSyncProject}
              disabled={isLoading || !repoName.trim()}
            >
              {isLoading ? 'Syncing...' : 'Sync to GitHub'}
            </Button>
          </div>
        </div>
      )}

      {syncStatus === 'syncing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Syncing your project to GitHub...</p>
        </div>
      )}

      {syncStatus === 'success' && repoUrl && (
        <div className="text-center py-8 bg-green-50 rounded-lg">
          <div className="text-green-600 text-2xl mb-2">✓</div>
          <p className="text-sm text-green-700 mb-4">Successfully synced to GitHub!</p>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Repository
          </a>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="text-center py-8 bg-red-50 rounded-lg">
          <div className="text-red-600 text-2xl mb-2">✗</div>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button
            onClick={() => setSyncStatus('idle')}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500 border-t pt-4">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>All files are stored locally first (no data loss)</li>
          <li>GitHub sync is optional and provides cloud backup</li>
          <li>You can work offline - sync happens when you're ready</li>
          <li>Failed GitHub operations don't affect local development</li>
        </ul>
      </div>
    </div>
  )
}
