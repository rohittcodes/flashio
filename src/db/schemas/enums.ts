import { pgEnum } from "drizzle-orm/pg-core"

// Core project and file management enums
export const projectStatusEnum = pgEnum('project_status', ['draft', 'building', 'built', 'error', 'archived'])
export const projectVisibilityEnum = pgEnum('project_visibility', ['private', 'public', 'team'])
export const buildTaskStatusEnum = pgEnum('build_task_status', ['pending', 'in_progress', 'completed', 'failed'])
export const buildTaskTypeEnum = pgEnum('build_task_type', ['file_creation', 'code_generation', 'dependency_install', 'build', 'test', 'deploy'])
export const activityTypeEnum = pgEnum('activity_type', ['project_created', 'file_created', 'file_updated', 'file_deleted', 'comment_added', 'build_started', 'build_completed', 'collaborator_added'])

// Collaboration enums
export const collaboratorRoleEnum = pgEnum('collaborator_role', ['owner', 'editor', 'viewer', 'reviewer'])

// WebContainer and IDE enums
export const webContainerStatusEnum = pgEnum('webcontainer_status', ['booting', 'ready', 'error', 'terminated'])
export const terminalStatusEnum = pgEnum('terminal_status', ['running', 'stopped', 'error'])
export const fileWatcherEventEnum = pgEnum('file_watcher_event', ['change', 'rename', 'create', 'delete'])
