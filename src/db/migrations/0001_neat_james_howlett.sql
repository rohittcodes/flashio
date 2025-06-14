CREATE TYPE "public"."activity_type" AS ENUM('project_created', 'file_created', 'file_updated', 'file_deleted', 'comment_added', 'build_started', 'build_completed', 'collaborator_added');--> statement-breakpoint
CREATE TYPE "public"."build_task_status" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."build_task_type" AS ENUM('file_creation', 'code_generation', 'dependency_install', 'build', 'test', 'deploy');--> statement-breakpoint
CREATE TYPE "public"."collaborator_role" AS ENUM('owner', 'editor', 'viewer', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."file_watcher_event" AS ENUM('change', 'rename', 'create', 'delete');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'building', 'built', 'error', 'archived');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('private', 'public', 'team');--> statement-breakpoint
CREATE TYPE "public"."terminal_status" AS ENUM('running', 'stopped', 'error');--> statement-breakpoint
CREATE TYPE "public"."webcontainer_status" AS ENUM('booting', 'ready', 'error', 'terminated');--> statement-breakpoint
CREATE TABLE "build_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"type" "build_task_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "build_task_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0,
	"progress" integer DEFAULT 0,
	"estimatedDuration" integer,
	"actualDuration" integer,
	"dependencies" jsonb DEFAULT '[]'::jsonb,
	"result" jsonb DEFAULT '{}'::jsonb,
	"logs" text DEFAULT '',
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now(),
	"startedAt" timestamp,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"path" text NOT NULL,
	"content" text DEFAULT '',
	"binaryContent" text,
	"language" varchar(50),
	"mimeType" varchar(100),
	"encoding" varchar(20) DEFAULT 'utf8',
	"size" integer DEFAULT 0,
	"checksum" varchar(64),
	"isDirectory" boolean DEFAULT false,
	"isSymlink" boolean DEFAULT false,
	"symlinkTarget" text,
	"permissions" varchar(10) DEFAULT '644',
	"isExecutable" boolean DEFAULT false,
	"isHidden" boolean DEFAULT false,
	"isBinary" boolean DEFAULT false,
	"lineCount" integer DEFAULT 0,
	"parentId" text,
	"webContainerPath" text,
	"lastModifiedBy" text,
	"isWatched" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"lastAccessedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"prompt" text NOT NULL,
	"techStack" jsonb DEFAULT '[]'::jsonb,
	"structure" jsonb DEFAULT '{}'::jsonb,
	"isPublic" boolean DEFAULT false,
	"usageCount" integer DEFAULT 0,
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"prompt" text,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"visibility" "project_visibility" DEFAULT 'private' NOT NULL,
	"thumbnail" text,
	"techStack" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"template" boolean DEFAULT false,
	"sourceProjectId" text,
	"gitRepoUrl" text,
	"deploymentUrl" text,
	"buildHealth" integer DEFAULT 100,
	"linesOfCode" integer DEFAULT 0,
	"complexity" integer DEFAULT 0,
	"estimatedTime" integer,
	"actualTime" integer,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"lastAccessedAt" timestamp DEFAULT now(),
	"archivedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "collaboration_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"socketId" text,
	"cursor" jsonb,
	"selection" jsonb,
	"isActive" boolean DEFAULT true,
	"lastActivity" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collaborative_cursors" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"fileId" text NOT NULL,
	"userId" text NOT NULL,
	"position" jsonb NOT NULL,
	"selection" jsonb,
	"color" varchar(7) DEFAULT '#3b82f6',
	"userName" varchar(255),
	"isVisible" boolean DEFAULT true,
	"lastUpdate" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"fileId" text,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"lineNumber" integer,
	"parentId" text,
	"isResolved" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_collaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"role" "collaborator_role" NOT NULL,
	"permissions" jsonb DEFAULT '{"canRead":true,"canWrite":false,"canDelete":false,"canInvite":false,"canManagePermissions":false}'::jsonb,
	"invitedBy" text,
	"invitedAt" timestamp DEFAULT now(),
	"acceptedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "file_watcher_events" (
	"id" text PRIMARY KEY NOT NULL,
	"watcherId" text NOT NULL,
	"projectId" text NOT NULL,
	"event" "file_watcher_event" NOT NULL,
	"filename" text NOT NULL,
	"fullPath" text NOT NULL,
	"previousPath" text,
	"fileSize" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "file_watchers" (
	"id" text PRIMARY KEY NOT NULL,
	"webContainerId" text NOT NULL,
	"projectId" text NOT NULL,
	"watchPath" text NOT NULL,
	"isRecursive" boolean DEFAULT false,
	"encoding" varchar(20) DEFAULT 'utf8',
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terminal_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"webContainerId" text NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"title" varchar(255) DEFAULT 'Terminal',
	"command" text,
	"workingDirectory" text DEFAULT '/',
	"status" "terminal_status" DEFAULT 'running' NOT NULL,
	"processId" text,
	"terminalSize" jsonb DEFAULT '{"cols":80,"rows":24}'::jsonb,
	"output" text DEFAULT '',
	"exitCode" integer,
	"createdAt" timestamp DEFAULT now(),
	"lastActivity" timestamp DEFAULT now(),
	"endedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "webcontainer_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"status" "webcontainer_status" DEFAULT 'booting' NOT NULL,
	"workdirName" varchar(255),
	"containerUrl" text,
	"port" integer,
	"openPorts" jsonb DEFAULT '[]'::jsonb,
	"environmentVars" jsonb DEFAULT '{}'::jsonb,
	"bootOptions" jsonb DEFAULT '{}'::jsonb,
	"lastActivity" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now(),
	"terminatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "code_completions" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"fileId" text,
	"language" varchar(50) NOT NULL,
	"context" text NOT NULL,
	"position" jsonb NOT NULL,
	"completions" jsonb DEFAULT '[]'::jsonb,
	"triggerKind" varchar(50),
	"cacheExpiry" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "editor_states" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"fileId" text NOT NULL,
	"userId" text NOT NULL,
	"cursorPosition" jsonb DEFAULT '{"line":0,"col":0}'::jsonb,
	"selection" jsonb,
	"viewport" jsonb DEFAULT '{"from":0,"to":0}'::jsonb,
	"foldedRanges" jsonb DEFAULT '[]'::jsonb,
	"scrollPosition" jsonb DEFAULT '{"top":0,"left":0}'::jsonb,
	"editorExtensions" jsonb DEFAULT '[]'::jsonb,
	"theme" varchar(50) DEFAULT 'default',
	"fontSize" integer DEFAULT 14,
	"tabSize" integer DEFAULT 2,
	"lineWrapping" boolean DEFAULT false,
	"lineNumbers" boolean DEFAULT true,
	"isActive" boolean DEFAULT true,
	"lastActivity" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"userId" text NOT NULL,
	"type" "activity_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text,
	"userId" text NOT NULL,
	"title" varchar(255),
	"context" jsonb DEFAULT '{}'::jsonb,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0,
	"edits" integer DEFAULT 0,
	"builds" integer DEFAULT 0,
	"collaborators" integer DEFAULT 0,
	"apiCalls" integer DEFAULT 0,
	"buildTime" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "build_tasks" ADD CONSTRAINT "build_tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_parentId_project_files_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."project_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_lastModifiedBy_user_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_sourceProjectId_projects_id_fk" FOREIGN KEY ("sourceProjectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborative_cursors" ADD CONSTRAINT "collaborative_cursors_sessionId_collaboration_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborative_cursors" ADD CONSTRAINT "collaborative_cursors_fileId_project_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."project_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborative_cursors" ADD CONSTRAINT "collaborative_cursors_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_fileId_project_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."project_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_comments_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_invitedBy_user_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_watcher_events" ADD CONSTRAINT "file_watcher_events_watcherId_file_watchers_id_fk" FOREIGN KEY ("watcherId") REFERENCES "public"."file_watchers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_watcher_events" ADD CONSTRAINT "file_watcher_events_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_watchers" ADD CONSTRAINT "file_watchers_webContainerId_webcontainer_instances_id_fk" FOREIGN KEY ("webContainerId") REFERENCES "public"."webcontainer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_watchers" ADD CONSTRAINT "file_watchers_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_sessions" ADD CONSTRAINT "terminal_sessions_webContainerId_webcontainer_instances_id_fk" FOREIGN KEY ("webContainerId") REFERENCES "public"."webcontainer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_sessions" ADD CONSTRAINT "terminal_sessions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_sessions" ADD CONSTRAINT "terminal_sessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webcontainer_instances" ADD CONSTRAINT "webcontainer_instances_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webcontainer_instances" ADD CONSTRAINT "webcontainer_instances_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_completions" ADD CONSTRAINT "code_completions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_completions" ADD CONSTRAINT "code_completions_fileId_project_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."project_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_states" ADD CONSTRAINT "editor_states_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_states" ADD CONSTRAINT "editor_states_fileId_project_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."project_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_states" ADD CONSTRAINT "editor_states_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_sessionId_ai_chat_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_analytics" ADD CONSTRAINT "project_analytics_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_tasks_project_id_idx" ON "build_tasks" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "build_tasks_status_idx" ON "build_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "build_tasks_priority_idx" ON "build_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "project_files_project_id_idx" ON "project_files" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_files_path_idx" ON "project_files" USING btree ("path");--> statement-breakpoint
CREATE INDEX "project_files_parent_id_idx" ON "project_files" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "project_files_language_idx" ON "project_files" USING btree ("language");--> statement-breakpoint
CREATE INDEX "project_files_is_directory_idx" ON "project_files" USING btree ("isDirectory");--> statement-breakpoint
CREATE INDEX "project_files_webcontainer_path_idx" ON "project_files" USING btree ("webContainerPath");--> statement-breakpoint
CREATE INDEX "project_files_is_watched_idx" ON "project_files" USING btree ("isWatched");--> statement-breakpoint
CREATE INDEX "project_templates_category_idx" ON "project_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "project_templates_is_public_idx" ON "project_templates" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX "project_templates_created_by_idx" ON "project_templates" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "collaboration_sessions_project_id_idx" ON "collaboration_sessions" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "collaboration_sessions_user_id_idx" ON "collaboration_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "collaboration_sessions_is_active_idx" ON "collaboration_sessions" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "collaborative_cursors_session_file_idx" ON "collaborative_cursors" USING btree ("sessionId","fileId");--> statement-breakpoint
CREATE INDEX "collaborative_cursors_user_id_idx" ON "collaborative_cursors" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "collaborative_cursors_is_visible_idx" ON "collaborative_cursors" USING btree ("isVisible");--> statement-breakpoint
CREATE INDEX "project_collaborators_project_id_idx" ON "project_collaborators" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_collaborators_user_id_idx" ON "project_collaborators" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "project_collaborators_project_user_unique" ON "project_collaborators" USING btree ("projectId","userId");--> statement-breakpoint
CREATE INDEX "file_watcher_events_watcher_id_idx" ON "file_watcher_events" USING btree ("watcherId");--> statement-breakpoint
CREATE INDEX "file_watcher_events_project_id_idx" ON "file_watcher_events" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "file_watcher_events_event_idx" ON "file_watcher_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "file_watcher_events_created_at_idx" ON "file_watcher_events" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "file_watchers_webcontainer_id_idx" ON "file_watchers" USING btree ("webContainerId");--> statement-breakpoint
CREATE INDEX "file_watchers_project_id_idx" ON "file_watchers" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "file_watchers_watch_path_idx" ON "file_watchers" USING btree ("watchPath");--> statement-breakpoint
CREATE INDEX "terminal_sessions_webcontainer_id_idx" ON "terminal_sessions" USING btree ("webContainerId");--> statement-breakpoint
CREATE INDEX "terminal_sessions_project_id_idx" ON "terminal_sessions" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "terminal_sessions_user_id_idx" ON "terminal_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "terminal_sessions_status_idx" ON "terminal_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webcontainer_instances_project_id_idx" ON "webcontainer_instances" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "webcontainer_instances_user_id_idx" ON "webcontainer_instances" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "webcontainer_instances_status_idx" ON "webcontainer_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "code_completions_project_id_idx" ON "code_completions" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "code_completions_file_id_idx" ON "code_completions" USING btree ("fileId");--> statement-breakpoint
CREATE INDEX "code_completions_language_idx" ON "code_completions" USING btree ("language");--> statement-breakpoint
CREATE INDEX "code_completions_cache_expiry_idx" ON "code_completions" USING btree ("cacheExpiry");--> statement-breakpoint
CREATE INDEX "editor_states_project_file_idx" ON "editor_states" USING btree ("projectId","fileId");--> statement-breakpoint
CREATE INDEX "editor_states_user_id_idx" ON "editor_states" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "editor_states_is_active_idx" ON "editor_states" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "activities_project_id_idx" ON "activities" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "activities_user_id_idx" ON "activities" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "activities" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "ai_chat_messages_session_id_idx" ON "ai_chat_messages" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "ai_chat_messages_created_at_idx" ON "ai_chat_messages" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "ai_chat_sessions_project_id_idx" ON "ai_chat_sessions" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "ai_chat_sessions_user_id_idx" ON "ai_chat_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "project_analytics_project_id_idx" ON "project_analytics" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_analytics_date_idx" ON "project_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "project_analytics_project_date_unique" ON "project_analytics" USING btree ("projectId","date");