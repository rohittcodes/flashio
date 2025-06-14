import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  json,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"
   
export const users = pgTable("user", {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    createdAt: timestamp("createdAt", { mode: "date" }).$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt", { mode: "date" }).$defaultFn(() => new Date()),
  })

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt", { mode: "date" }).$defaultFn(() => new Date()),
})

export const webcontainer_instances = pgTable("webcontainer_instances", {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    projectId: uuid("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt", { mode: "date" }).$defaultFn(() => new Date()),
})

export const terminal_sessions = pgTable("terminal_sessions", {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    instanceId: uuid("instanceId").notNull().references(() => webcontainer_instances.id, { onDelete: "cascade" }),
    command: text("command").notNull(),
    output: text("output"),
    status: text("status").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt", { mode: "date" }).$defaultFn(() => new Date()),
})
   
  export const accounts = pgTable(
    "account",
    {
      userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      type: text("type").$type<AdapterAccountType>().notNull(),
      provider: text("provider").notNull(),
      providerAccountId: text("providerAccountId").notNull(),
      refresh_token: text("refresh_token"),
      access_token: text("access_token"),
      expires_at: integer("expires_at"),
      token_type: text("token_type"),
      scope: text("scope"),
      id_token: text("id_token"),
      session_state: text("session_state"),
    },
    (self) => ({
      primaryKey: primaryKey({
        columns: [self.provider, self.providerAccountId],
      }),
    })
  )
   
  export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  })
   
  export const verificationTokens = pgTable(
    "verificationToken",
    {
      identifier: text("identifier").notNull(),
      token: text("token").notNull(),
      expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (self) => ({
      primaryKey: primaryKey({
        columns: [self.identifier, self.token],
      }),
    })
  )
   
  export const authenticators = pgTable(
    "authenticator",
    {
      credentialID: text("credentialID").notNull().unique(),
      userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      providerAccountId: text("providerAccountId").notNull(),
      credentialPublicKey: text("credentialPublicKey").notNull(),
      counter: integer("counter").notNull(),
      credentialDeviceType: text("credentialDeviceType").notNull(),
      credentialBackedUp: boolean("credentialBackedUp").notNull(),
      transports: text("transports"),
    },
    (self) => ({
      primaryKey: primaryKey({
        columns: [self.userId, self.credentialID],
      }),
    })
  )