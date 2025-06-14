import {
  boolean,
  timestamp,
  pgTable,
  text,
  integer,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core"
import type { PgTableWithColumns } from "drizzle-orm/pg-core"
import { users } from "../schema"
import { projectStatusEnum, projectVisibilityEnum, buildTaskStatusEnum, buildTaskTypeEnum } from "./enums"

// Core Project Tables
export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  prompt: text("prompt"), // Original AI prompt
  status: projectStatusEnum("status").default('draft').notNull(),
  visibility: projectVisibilityEnum("visibility").default('private').notNull(),
  thumbnail: text("thumbnail"), // URL to project thumbnail
  techStack: jsonb("techStack").$type<string[]>().default([]), // Array of technologies
  tags: jsonb("tags").$type<string[]>().default([]), // Project tags
  template: boolean("template").default(false), // Is this a template?
  sourceProjectId: text("sourceProjectId").references(() => projects.id), // For duplicated projects
  gitRepoUrl: text("gitRepoUrl"), // Git repository URL
  deploymentUrl: text("deploymentUrl"), // Live deployment URL
  buildHealth: integer("buildHealth").default(100), // 0-100 build health score
  linesOfCode: integer("linesOfCode").default(0),
  complexity: integer("complexity").default(0), // 1-10 complexity score
  estimatedTime: integer("estimatedTime"), // Estimated build time in minutes
  actualTime: integer("actualTime"), // Actual build time in minutes
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  lastAccessedAt: timestamp("lastAccessedAt", { mode: "date" }).defaultNow(),
  archivedAt: timestamp("archivedAt", { mode: "date" }),
}, (table) => ({
  userIdIdx: index("projects_user_id_idx").on(table.userId),
  statusIdx: index("projects_status_idx").on(table.status),
  createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
})) as PgTableWithColumns<any>

// Project Files (Enhanced for WebContainer)
export const projectFiles = pgTable("project_files", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),  path: text("path").notNull(), // File path relative to project root
  content: text("content").default(''), // For small files or cache
  binaryContent: text("binaryContent"), // For binary files (base64 encoded)
  storageKey: text("storageKey"), // External storage reference (file path, S3 key, etc.)
  storageType: varchar("storageType", { length: 20 }).default('database'), // 'database', 'filesystem', 's3', 'github'
  storageUrl: text("storageUrl"), // Full URL for external storage
  language: varchar("language", { length: 50 }), // Programming language
  mimeType: varchar("mimeType", { length: 100 }), // MIME type
  encoding: varchar("encoding", { length: 20 }).default('utf8'), // File encoding
  size: integer("size").default(0), // File size in bytes
  checksum: varchar("checksum", { length: 64 }), // SHA-256 hash for change detection
  isDirectory: boolean("isDirectory").default(false),
  isSymlink: boolean("isSymlink").default(false),
  symlinkTarget: text("symlinkTarget"), // Target path for symlinks
  permissions: varchar("permissions", { length: 10 }).default('644'), // Unix-style permissions
  isExecutable: boolean("isExecutable").default(false),
  isHidden: boolean("isHidden").default(false),
  isBinary: boolean("isBinary").default(false),
  lineCount: integer("lineCount").default(0),
  parentId: text("parentId").references(() => projectFiles.id), // For directory structure
  webContainerPath: text("webContainerPath"), // Actual path in WebContainer filesystem
  lastModifiedBy: text("lastModifiedBy").references(() => users.id),
  isWatched: boolean("isWatched").default(false), // Is file being watched for changes
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  lastAccessedAt: timestamp("lastAccessedAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("project_files_project_id_idx").on(table.projectId),
  pathIdx: index("project_files_path_idx").on(table.path),
  parentIdIdx: index("project_files_parent_id_idx").on(table.parentId),
  languageIdx: index("project_files_language_idx").on(table.language),
  isDirectoryIdx: index("project_files_is_directory_idx").on(table.isDirectory),
  webContainerPathIdx: index("project_files_webcontainer_path_idx").on(table.webContainerPath),
  isWatchedIdx: index("project_files_is_watched_idx").on(table.isWatched),
})) as PgTableWithColumns<any>

// Build Tasks (for the 3-column progress view)
export const buildTasks = pgTable("build_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: buildTaskTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: buildTaskStatusEnum("status").default('pending').notNull(),
  priority: integer("priority").default(0), // Higher number = higher priority
  progress: integer("progress").default(0), // 0-100
  estimatedDuration: integer("estimatedDuration"), // in seconds
  actualDuration: integer("actualDuration"), // in seconds
  dependencies: jsonb("dependencies").$type<string[]>().default([]), // Array of task IDs
  result: jsonb("result").$type<Record<string, any>>().default({}), // Task result data
  logs: text("logs").default(''), // Task execution logs
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  startedAt: timestamp("startedAt", { mode: "date" }),
  completedAt: timestamp("completedAt", { mode: "date" }),
}, (table) => ({
  projectIdIdx: index("build_tasks_project_id_idx").on(table.projectId),
  statusIdx: index("build_tasks_status_idx").on(table.status),
  priorityIdx: index("build_tasks_priority_idx").on(table.priority),
}))

// Project Templates
export const projectTemplates = pgTable("project_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  prompt: text("prompt").notNull(), // Template prompt
  techStack: jsonb("techStack").$type<string[]>().default([]),
  structure: jsonb("structure").$type<Record<string, any>>().default({}), // File structure template
  isPublic: boolean("isPublic").default(false),
  usageCount: integer("usageCount").default(0),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  categoryIdx: index("project_templates_category_idx").on(table.category),
  isPublicIdx: index("project_templates_is_public_idx").on(table.isPublic),
  createdByIdx: index("project_templates_created_by_idx").on(table.createdBy),
}))
