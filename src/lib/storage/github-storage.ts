import { Octokit } from '@octokit/rest'

export interface GitHubRepo {
  name: string
  url: string
  fullName: string
  cloneUrl: string
  isPrivate: boolean
}

export interface GitHubFileResult {
  url: string
  sha: string
  path: string
  downloadUrl?: string
}

export interface GitHubSyncOptions {
  repoName: string
  description?: string
  isPrivate?: boolean
  autoCommit?: boolean
  commitMessage?: string
}

export class GitHubStorageService {
  private octokit: Octokit | null = null

  constructor(accessToken?: string) {
    if (accessToken) {
      this.octokit = new Octokit({
        auth: accessToken,
      })
    }
  }

  /**
   * Initialize with access token
   */
  initialize(accessToken: string): void {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  /**
   * Check if GitHub is authenticated
   */
  isAuthenticated(): boolean {
    return this.octokit !== null
  }
  /**
   * Save file to GitHub repository
   */
  async saveFile(
    repoOwner: string,
    repoName: string,
    filePath: string,
    content: string,
    commitMessage?: string
  ): Promise<GitHubFileResult> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      // Check if file exists to get current SHA
      let sha: string | undefined
      try {
        const existingFile = await this.octokit.repos.getContent({
          owner: repoOwner,
          repo: repoName,
          path: filePath,
        })

        if ('sha' in existingFile.data) {
          sha = existingFile.data.sha
        }
      } catch (error) {
        // File doesn't exist, which is fine for new files
      }

      // Create or update file
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: repoOwner,
        repo: repoName,
        path: filePath,
        message: commitMessage || `Update ${filePath}`,
        content: Buffer.from(content).toString('base64'),
        sha, // Include SHA if updating existing file
      })

      return {
        url: response.data.content?.html_url || '',
        sha: response.data.content?.sha || '',
        path: filePath,
        downloadUrl: response.data.content?.download_url,
      }
    } catch (error) {
      console.error('Failed to save file to GitHub:', error)
      throw new Error(`GitHub save failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  /**
   * Get file content from GitHub
   */
  async getFile(repoOwner: string, repoName: string, filePath: string): Promise<string> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      const response = await this.octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: filePath,
      })

      if ('content' in response.data) {
        // Decode base64 content
        return Buffer.from(response.data.content, 'base64').toString('utf-8')
      }

      throw new Error('File content not found')
    } catch (error) {
      console.error('Failed to get file from GitHub:', error)
      throw new Error(`GitHub file retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  /**
   * Create a new GitHub repository
   */
  async createRepository(
    name: string,
    description: string = '',
    isPrivate: boolean = true
  ): Promise<GitHubRepo> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      })

      return {
        name: response.data.name,
        url: response.data.html_url,
        fullName: response.data.full_name,
        cloneUrl: response.data.clone_url,
        isPrivate: response.data.private,
      }
    } catch (error) {
      console.error('Failed to create GitHub repository:', error)
      throw new Error(`GitHub repository creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  /**
   * Upload multiple files to repository
   */
  async uploadFilesToRepo(
    repoOwner: string,
    repoName: string,
    files: Array<{ path: string; content: string }>,
    commitMessage: string = 'Upload project files'
  ): Promise<GitHubFileResult[]> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    const results: GitHubFileResult[] = []

    for (const file of files) {
      try {
        const result = await this.saveFile(
          repoOwner,
          repoName,
          file.path,
          file.content,
          `${commitMessage}: ${file.path}`
        )
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload ${file.path}:`, error)
        // Continue with other files even if one fails
      }
    }

    return results
  }

  /**
   * Get repository information
   */
  async getRepository(repoOwner: string, repoName: string): Promise<GitHubRepo> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      const response = await this.octokit.repos.get({
        owner: repoOwner,
        repo: repoName,
      })

      return {
        name: response.data.name,
        url: response.data.html_url,
        fullName: response.data.full_name,
        cloneUrl: response.data.clone_url,
        isPrivate: response.data.private,
      }
    } catch (error) {
      console.error('Failed to get repository info:', error)
      throw new Error(`GitHub repository retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(): Promise<GitHubRepo[]> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      })

      return response.data.map(repo => ({
        name: repo.name,
        url: repo.html_url,
        fullName: repo.full_name,
        cloneUrl: repo.clone_url,
        isPrivate: repo.private,
      }))
    } catch (error) {
      console.error('Failed to list repositories:', error)
      throw new Error(`GitHub repository listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get authenticated user information
   */
  async getUser(): Promise<{ login: string; name: string; email: string; avatar_url: string }> {
    if (!this.octokit) {
      throw new Error('GitHub not authenticated')
    }

    try {
      const response = await this.octokit.users.getAuthenticated()
      return {
        login: response.data.login,
        name: response.data.name || '',
        email: response.data.email || '',
        avatar_url: response.data.avatar_url,
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw new Error(`GitHub user retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
