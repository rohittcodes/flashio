export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: TechStack[];
  lastModified: Date;
  collaborators: Collaborator[];
  status: ProjectStatus;
  favorite: boolean;
  tags: string[];
  thumbnail?: string;
  buildHealth: BuildHealth;
  gitInfo?: GitInfo;
}

export type ProjectStatus = 'active' | 'archived' | 'completed' | 'draft';
export type BuildHealth = 'healthy' | 'warning' | 'error' | 'unknown';

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
}

export interface TechStack {
  name: string;
  icon: string;
}

export interface GitInfo {
  repository: string;
  branch: string;
  lastCommit: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
}
