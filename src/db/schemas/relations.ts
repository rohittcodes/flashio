import { relations } from "drizzle-orm"

// Import all tables
import { users, accounts, sessions, verificationTokens, authenticators } from  "../schema"
import { projects, projectFiles, buildTasks, projectTemplates } from "./projects"
import { projectCollaborators, collaborationSessions, collaborativeCursors, comments } from "./collaboration"
import { webContainerInstances, terminalSessions, fileWatchers, fileWatcherEvents } from "./webcontainer"
import { editorStates, codeCompletions } from "./editor"
import { aiChatSessions, aiChatMessages, activities, projectAnalytics } from "./analytics"

// Auth Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  collaborations: many(projectCollaborators),
  aiChatSessions: many(aiChatSessions),
  comments: many(comments),
  activities: many(activities),
  templates: many(projectTemplates),
  webContainerInstances: many(webContainerInstances),
  terminalSessions: many(terminalSessions),
  editorStates: many(editorStates),
  collaborativeCursors: many(collaborativeCursors),
  modifiedFiles: many(projectFiles),
}))

// Project Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  sourceProject: one(projects, {
    fields: [projects.sourceProjectId],
    references: [projects.id],
  }),
  files: many(projectFiles),
  collaborators: many(projectCollaborators),
  buildTasks: many(buildTasks),
  aiChatSessions: many(aiChatSessions),
  comments: many(comments),
  activities: many(activities),
  analytics: many(projectAnalytics),
  webContainerInstances: many(webContainerInstances),
  terminalSessions: many(terminalSessions),
  editorStates: many(editorStates),
  fileWatchers: many(fileWatchers),
  fileWatcherEvents: many(fileWatcherEvents),
  codeCompletions: many(codeCompletions),
}))

export const projectFilesRelations = relations(projectFiles, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
  parent: one(projectFiles, {
    fields: [projectFiles.parentId],
    references: [projectFiles.id],
  }),
  lastModifiedByUser: one(users, {
    fields: [projectFiles.lastModifiedBy],
    references: [users.id],
  }),
  children: many(projectFiles),
  comments: many(comments),
  editorStates: many(editorStates),
  collaborativeCursors: many(collaborativeCursors),
  codeCompletions: many(codeCompletions),
}))

export const buildTasksRelations = relations(buildTasks, ({ one }) => ({
  project: one(projects, {
    fields: [buildTasks.projectId],
    references: [projects.id],
  }),
}))

export const projectTemplatesRelations = relations(projectTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [projectTemplates.createdBy],
    references: [users.id],
  }),
}))

// Collaboration Relations
export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [projectCollaborators.invitedBy],
    references: [users.id],
  }),
}))

export const collaborationSessionsRelations = relations(collaborationSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [collaborationSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [collaborationSessions.userId],
    references: [users.id],
  }),
  cursors: many(collaborativeCursors),
}))

export const collaborativeCursorsRelations = relations(collaborativeCursors, ({ one }) => ({
  session: one(collaborationSessions, {
    fields: [collaborativeCursors.sessionId],
    references: [collaborationSessions.id],
  }),
  file: one(projectFiles, {
    fields: [collaborativeCursors.fileId],
    references: [projectFiles.id],
  }),
  user: one(users, {
    fields: [collaborativeCursors.userId],
    references: [users.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  file: one(projectFiles, {
    fields: [comments.fileId],
    references: [projectFiles.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}))

// WebContainer Relations
export const webContainerInstancesRelations = relations(webContainerInstances, ({ one, many }) => ({
  project: one(projects, {
    fields: [webContainerInstances.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [webContainerInstances.userId],
    references: [users.id],
  }),
  terminalSessions: many(terminalSessions),
  fileWatchers: many(fileWatchers),
}))

export const terminalSessionsRelations = relations(terminalSessions, ({ one }) => ({
  webContainer: one(webContainerInstances, {
    fields: [terminalSessions.webContainerId],
    references: [webContainerInstances.id],
  }),
  project: one(projects, {
    fields: [terminalSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [terminalSessions.userId],
    references: [users.id],
  }),
}))

export const fileWatchersRelations = relations(fileWatchers, ({ one, many }) => ({
  webContainer: one(webContainerInstances, {
    fields: [fileWatchers.webContainerId],
    references: [webContainerInstances.id],
  }),
  project: one(projects, {
    fields: [fileWatchers.projectId],
    references: [projects.id],
  }),
  events: many(fileWatcherEvents),
}))

export const fileWatcherEventsRelations = relations(fileWatcherEvents, ({ one }) => ({
  watcher: one(fileWatchers, {
    fields: [fileWatcherEvents.watcherId],
    references: [fileWatchers.id],
  }),
  project: one(projects, {
    fields: [fileWatcherEvents.projectId],
    references: [projects.id],
  }),
}))

// Editor Relations
export const editorStatesRelations = relations(editorStates, ({ one }) => ({
  project: one(projects, {
    fields: [editorStates.projectId],
    references: [projects.id],
  }),
  file: one(projectFiles, {
    fields: [editorStates.fileId],
    references: [projectFiles.id],
  }),
  user: one(users, {
    fields: [editorStates.userId],
    references: [users.id],
  }),
}))

export const codeCompletionsRelations = relations(codeCompletions, ({ one }) => ({
  project: one(projects, {
    fields: [codeCompletions.projectId],
    references: [projects.id],
  }),
  file: one(projectFiles, {
    fields: [codeCompletions.fileId],
    references: [projectFiles.id],
  }),
}))

// Analytics Relations
export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [aiChatSessions.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
  messages: many(aiChatMessages),
}))

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}))

export const projectAnalyticsRelations = relations(projectAnalytics, ({ one }) => ({
  project: one(projects, {
    fields: [projectAnalytics.projectId],
    references: [projects.id],
  }),
}))
