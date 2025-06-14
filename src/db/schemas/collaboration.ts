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
import { projects, projectFiles } from "./projects"
import { collaboratorRoleEnum } from "./enums"

// Collaboration Tables
export const projectCollaborators = pgTable("project_collaborators", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: collaboratorRoleEnum("role").notNull(),
  permissions: jsonb("permissions").$type<{
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManagePermissions: boolean;
  }>().default({
    canRead: true,
    canWrite: false,
    canDelete: false,
    canInvite: false,
    canManagePermissions: false,
  }),
  invitedBy: text("invitedBy").references(() => users.id),
  invitedAt: timestamp("invitedAt", { mode: "date" }).defaultNow(),
  acceptedAt: timestamp("acceptedAt", { mode: "date" }),
}, (table) => ({
  projectIdIdx: index("project_collaborators_project_id_idx").on(table.projectId),
  userIdIdx: index("project_collaborators_user_id_idx").on(table.userId),
  projectUserUnique: index("project_collaborators_project_user_unique").on(table.projectId, table.userId),
})) as PgTableWithColumns<any>

// Real-time Collaboration Sessions
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  socketId: text("socketId"), // WebSocket connection ID
  cursor: jsonb("cursor").$type<{
    fileId?: string;
    line: number;
    column: number;
  }>(),
  selection: jsonb("selection").$type<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>(),
  isActive: boolean("isActive").default(true),
  lastActivity: timestamp("lastActivity", { mode: "date" }).defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("collaboration_sessions_project_id_idx").on(table.projectId),
  userIdIdx: index("collaboration_sessions_user_id_idx").on(table.userId),
  isActiveIdx: index("collaboration_sessions_is_active_idx").on(table.isActive),
}))

// Live Collaboration Cursors (for CodeMirror)
export const collaborativeCursors = pgTable("collaborative_cursors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId")
    .notNull()
    .references(() => collaborationSessions.id, { onDelete: "cascade" }),
  fileId: text("fileId")
    .notNull()
    .references(() => projectFiles.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  position: jsonb("position").$type<{
    line: number;
    col: number;
  }>().notNull(),
  selection: jsonb("selection").$type<{
    anchor: { line: number; col: number };
    head: { line: number; col: number };
  }>(),
  color: varchar("color", { length: 7 }).default('#3b82f6'), // Hex color for cursor
  userName: varchar("userName", { length: 255 }),
  isVisible: boolean("isVisible").default(true),
  lastUpdate: timestamp("lastUpdate", { mode: "date" }).defaultNow(),
}, (table) => ({
  sessionFileIdx: index("collaborative_cursors_session_file_idx").on(table.sessionId, table.fileId),
  userIdIdx: index("collaborative_cursors_user_id_idx").on(table.userId),
  isVisibleIdx: index("collaborative_cursors_is_visible_idx").on(table.isVisible),
}))

// Comments and Code Reviews
export const comments = pgTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fileId: text("fileId").references(() => projectFiles.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  lineNumber: integer("lineNumber"), // For inline comments
  parentId: text("parentId").references(() => comments.id), // For threaded comments
  isResolved: boolean("isResolved").default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
}) as PgTableWithColumns<any>
