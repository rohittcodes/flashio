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
import { collaborationSessions } from "./collaboration"

// CodeMirror Editor States
export const editorStates = pgTable("editor_states", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fileId: text("fileId")
    .notNull()
    .references(() => projectFiles.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cursorPosition: jsonb("cursorPosition").$type<{
    line: number;
    col: number;
  }>().default({ line: 0, col: 0 }),
  selection: jsonb("selection").$type<{
    anchor: { line: number; col: number };
    head: { line: number; col: number };
  }>(),
  viewport: jsonb("viewport").$type<{
    from: number;
    to: number;
  }>().default({ from: 0, to: 0 }),
  foldedRanges: jsonb("foldedRanges").$type<{
    from: number;
    to: number;
  }[]>().default([]),
  scrollPosition: jsonb("scrollPosition").$type<{
    top: number;
    left: number;
  }>().default({ top: 0, left: 0 }),
  editorExtensions: jsonb("editorExtensions").$type<string[]>().default([]), // Active CodeMirror extensions
  theme: varchar("theme", { length: 50 }).default('default'),
  fontSize: integer("fontSize").default(14),
  tabSize: integer("tabSize").default(2),
  lineWrapping: boolean("lineWrapping").default(false),
  lineNumbers: boolean("lineNumbers").default(true),
  isActive: boolean("isActive").default(true),
  lastActivity: timestamp("lastActivity", { mode: "date" }).defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectFileIdx: index("editor_states_project_file_idx").on(table.projectId, table.fileId),
  userIdIdx: index("editor_states_user_id_idx").on(table.userId),
  isActiveIdx: index("editor_states_is_active_idx").on(table.isActive),
}))

// Code Completion/IntelliSense Cache
export const codeCompletions = pgTable("code_completions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("projectId")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fileId: text("fileId")
    .references(() => projectFiles.id, { onDelete: "cascade" }),
  language: varchar("language", { length: 50 }).notNull(),
  context: text("context").notNull(), // Code context for completion
  position: jsonb("position").$type<{
    line: number;
    col: number;
  }>().notNull(),
  completions: jsonb("completions").$type<{
    label: string;
    kind: string;
    detail?: string;
    documentation?: string;
    insertText: string;
  }[]>().default([]),
  triggerKind: varchar("triggerKind", { length: 50 }), // 'invoke', 'trigger', 'content-change'
  cacheExpiry: timestamp("cacheExpiry", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("code_completions_project_id_idx").on(table.projectId),
  fileIdIdx: index("code_completions_file_id_idx").on(table.fileId),
  languageIdx: index("code_completions_language_idx").on(table.language),
  cacheExpiryIdx: index("code_completions_cache_expiry_idx").on(table.cacheExpiry),
}))
