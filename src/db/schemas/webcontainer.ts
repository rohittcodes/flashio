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
import { users } from "./auth"
import { projects, projectFiles } from "./projects"
import { webContainerStatusEnum, terminalStatusEnum, fileWatcherEventEnum } from "./enums"

// WebContainer Instances
export const webContainerInstances = pgTable("webcontainer_instances", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: webContainerStatusEnum("status").default('booting').notNull(),
  workdirName: varchar("workdirName", { length: 255 }),
  containerUrl: text("containerUrl"), // URL to access the WebContainer
  port: integer("port"), // Main port for the application
  openPorts: jsonb("openPorts").$type<{
    port: number;
    url: string;
    type: 'open' | 'close';
  }[]>().default([]), // Track open/closed ports
  environmentVars: jsonb("environmentVars").$type<Record<string, string>>().default({}),
  bootOptions: jsonb("bootOptions").$type<{
    coep?: 'require-corp' | 'credentialless' | 'none';
    workdirName?: string;
    forwardPreviewErrors?: boolean | 'exceptions-only';
  }>().default({}),
  lastActivity: timestamp("lastActivity", { mode: "date" }).defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  terminatedAt: timestamp("terminatedAt", { mode: "date" }),
}, (table) => ({
  projectIdIdx: index("webcontainer_instances_project_id_idx").on(table.projectId),
  userIdIdx: index("webcontainer_instances_user_id_idx").on(table.userId),
  statusIdx: index("webcontainer_instances_status_idx").on(table.status),
}))

// Terminal Sessions (for WebContainer processes)
export const terminalSessions = pgTable("terminal_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  webContainerId: text("webContainerId")
    .notNull()
    .references(() => webContainerInstances.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default('Terminal'),
  command: text("command"), // Last executed command
  workingDirectory: text("workingDirectory").default('/'),
  status: terminalStatusEnum("status").default('running').notNull(),
  processId: text("processId"), // WebContainer process ID
  terminalSize: jsonb("terminalSize").$type<{
    cols: number;
    rows: number;
  }>().default({ cols: 80, rows: 24 }),
  output: text("output").default(''), // Terminal output history
  exitCode: integer("exitCode"), // Process exit code
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  lastActivity: timestamp("lastActivity", { mode: "date" }).defaultNow(),
  endedAt: timestamp("endedAt", { mode: "date" }),
}, (table) => ({
  webContainerIdIdx: index("terminal_sessions_webcontainer_id_idx").on(table.webContainerId),
  projectIdIdx: index("terminal_sessions_project_id_idx").on(table.projectId),
  userIdIdx: index("terminal_sessions_user_id_idx").on(table.userId),
  statusIdx: index("terminal_sessions_status_idx").on(table.status),
}))

// File System Watchers (for WebContainer file watching)
export const fileWatchers = pgTable("file_watchers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  webContainerId: text("webContainerId")
    .notNull()
    .references(() => webContainerInstances.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  watchPath: text("watchPath").notNull(), // Path being watched
  isRecursive: boolean("isRecursive").default(false),
  encoding: varchar("encoding", { length: 20 }).default('utf8'),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  webContainerIdIdx: index("file_watchers_webcontainer_id_idx").on(table.webContainerId),
  projectIdIdx: index("file_watchers_project_id_idx").on(table.projectId),
  watchPathIdx: index("file_watchers_watch_path_idx").on(table.watchPath),
}))

// File Watcher Events
export const fileWatcherEvents = pgTable("file_watcher_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  watcherId: text("watcherId")
    .notNull()
    .references(() => fileWatchers.id, { onDelete: "cascade" }),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  event: fileWatcherEventEnum("event").notNull(),
  filename: text("filename").notNull(),
  fullPath: text("fullPath").notNull(),
  previousPath: text("previousPath"), // For rename events
  fileSize: integer("fileSize"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  watcherIdIdx: index("file_watcher_events_watcher_id_idx").on(table.watcherId),
  projectIdIdx: index("file_watcher_events_project_id_idx").on(table.projectId),
  eventIdx: index("file_watcher_events_event_idx").on(table.event),
  createdAtIdx: index("file_watcher_events_created_at_idx").on(table.createdAt),
}))
