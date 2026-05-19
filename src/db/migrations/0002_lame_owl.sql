CREATE TYPE "public"."notification_type" AS ENUM('ASSIGNMENT', 'APPROVAL', 'REJECTION', 'REVIEW_REQUEST', 'PUBLISH', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"documentId" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "scheduledPublishAt" timestamp;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "publishedAt" timestamp;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_documentId_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;