CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"userId" text NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "terminal_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"instanceId" uuid NOT NULL,
	"command" text NOT NULL,
	"output" text,
	"status" text NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "webcontainer_instances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"projectId" uuid NOT NULL,
	"status" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_sessions" ADD CONSTRAINT "terminal_sessions_instanceId_webcontainer_instances_id_fk" FOREIGN KEY ("instanceId") REFERENCES "public"."webcontainer_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webcontainer_instances" ADD CONSTRAINT "webcontainer_instances_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;