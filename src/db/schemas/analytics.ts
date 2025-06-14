import {
  timestamp,
  pgTable,
  text,
  integer,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core"
import { users } from "./auth"
import { projects } from "./projects"
import { activityTypeEnum } from "./enums"

// AI Chat Sessions
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  context: jsonb("context").$type<Record<string, any>>().default({}), // AI context and memory
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("ai_chat_sessions_project_id_idx").on(table.projectId),
  userIdIdx: index("ai_chat_sessions_user_id_idx").on(table.userId),
}))

// AI Chat Messages
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("sessionId")
    .notNull()
    .references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // Additional message data
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  sessionIdIdx: index("ai_chat_messages_session_id_idx").on(table.sessionId),
  createdAtIdx: index("ai_chat_messages_created_at_idx").on(table.createdAt),
}))

// Activity Feed
export const activities = pgTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // Additional activity data
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("activities_project_id_idx").on(table.projectId),
  userIdIdx: index("activities_user_id_idx").on(table.userId),
  typeIdx: index("activities_type_idx").on(table.type),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
}))

// Project Analytics
export const projectAnalytics = pgTable("project_analytics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  views: integer("views").default(0),
  edits: integer("edits").default(0),
  builds: integer("builds").default(0),
  collaborators: integer("collaborators").default(0),
  apiCalls: integer("apiCalls").default(0),
  buildTime: integer("buildTime").default(0), // in seconds
}, (table) => ({
  projectIdIdx: index("project_analytics_project_id_idx").on(table.projectId),
  dateIdx: index("project_analytics_date_idx").on(table.date),
  projectDateUnique: index("project_analytics_project_date_unique").on(table.projectId, table.date),
}))
