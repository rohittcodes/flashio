ALTER TABLE "project_files" ADD COLUMN "storageKey" text;--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "storageType" varchar(20) DEFAULT 'database';--> statement-breakpoint
ALTER TABLE "project_files" ADD COLUMN "storageUrl" text;