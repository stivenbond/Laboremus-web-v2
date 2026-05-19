CREATE TYPE "public"."document_status" AS ENUM('draft', 'in_review', 'approved', 'formatting', 'formatting_review', 'scheduled', 'published', 'rejected');--> statement-breakpoint
CREATE TABLE "document_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"versionId" text NOT NULL,
	"authorId" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"documentId" text NOT NULL,
	"content" text NOT NULL,
	"authorId" text NOT NULL,
	"lastSavedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_version" (
	"id" text PRIMARY KEY NOT NULL,
	"documentId" text NOT NULL,
	"versionNumber" serial NOT NULL,
	"content" text NOT NULL,
	"commitMessage" text,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"assignedWriterId" text,
	"assignedEditorId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_comment" ADD CONSTRAINT "document_comment_versionId_document_version_id_fk" FOREIGN KEY ("versionId") REFERENCES "public"."document_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_comment" ADD CONSTRAINT "document_comment_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_draft" ADD CONSTRAINT "document_draft_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_draft" ADD CONSTRAINT "document_draft_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_assignedWriterId_user_id_fk" FOREIGN KEY ("assignedWriterId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_assignedEditorId_user_id_fk" FOREIGN KEY ("assignedEditorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;