# GitHub Integration Implementation Guide

## Overview
This hybrid storage solution provides:
- **Local-first storage** (never lose work)
- **Optional GitHub sync** (cloud backup + collaboration)
- **Graceful degradation** (works offline)

## Implementation Steps

### 1. Configure GitHub OAuth (auth.ts)
Add the `repo` scope to your GitHub OAuth configuration:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo' // Add 'repo' scope for repository access
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    }
  }
}
```

### 2. Complete GitHub Storage Service

```typescript
// src/lib/storage/github-storage.ts - Add real implementation
export class GitHubStorageService {
  private async getAccessToken(userId: string): Promise<string> {
    // Get user's GitHub access token from session/database
    const session = await getServerSession(authOptions)
    return session?.accessToken as string
  }

  async createRepository(name: string, description: string, isPrivate: boolean, userId: string) {
    const token = await this.getAccessToken(userId)
    
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const repo = await response.json()
    return {
      name: repo.name,
      url: repo.html_url,
      fullName: repo.full_name
    }
  }
}
```

### 3. Environment Variables
Add to your `.env.local`:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# File Storage
FILE_STORAGE_DIR=./file-storage
```

### 4. Database Schema Updates
The projects schema already includes the necessary fields:

```sql
-- Projects table includes:
gitRepoUrl TEXT -- GitHub repository URL
storageType TEXT -- 'local', 'github', 'hybrid'
githubUrl TEXT -- GitHub file URL
githubSha TEXT -- Git commit SHA
lastGithubSync TIMESTAMP -- Last sync time
```

## Usage Example

```typescript
// In your IDE component
import { GitHubSync } from '@/components/storage/github-sync'

function IDEComponent({ projectId }: { projectId: string }) {
  const [showGitHubSync, setShowGitHubSync] = useState(false)

  return (
    <div>
      {/* Your IDE content */}
      
      <button onClick={() => setShowGitHubSync(true)}>
        Sync to GitHub
      </button>
      
      {showGitHubSync && (
        <GitHubSync 
          projectId={projectId}
          onSyncComplete={(repoUrl) => {
            console.log('Synced to:', repoUrl)
            setShowGitHubSync(false)
          }}
        />
      )}
    </div>
  )
}
```

## Benefits

1. **Never lose work**: Local storage is primary
2. **Optional cloud backup**: GitHub sync when you want it
3. **Offline capable**: Works without internet
4. **Version control**: Automatic git commits
5. **Collaboration**: Share via GitHub
6. **Cost effective**: GitHub gives 1GB free per repo

## Error Handling

- If local storage fails → Try GitHub as fallback
- If GitHub fails → Keep working locally
- If both fail → Show error, data preserved in memory
- Auto-retry failed syncs when connection restored

## Security

- GitHub tokens stored securely in session
- Private repos by default
- User controls what gets synced
- Local files never uploaded without explicit consent

This provides the perfect balance of reliability, functionality, and cost-effectiveness!
