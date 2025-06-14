-- Add missing storage columns to project_files table
ALTER TABLE "project_files" ADD COLUMN "storageKey" text;
ALTER TABLE "project_files" ADD COLUMN "storageType" varchar(20) DEFAULT 'database';
ALTER TABLE "project_files" ADD COLUMN "storageUrl" text;
