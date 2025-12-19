CREATE TYPE "public"."santacall_contact_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TABLE "santacall_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" "santacall_contact_status" DEFAULT 'new' NOT NULL,
	"admin_reply" text,
	"replied_at" timestamp with time zone,
	"replied_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "santacall_contact_email_idx" ON "santacall_contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "santacall_contact_status_idx" ON "santacall_contact" USING btree ("status");--> statement-breakpoint
CREATE INDEX "santacall_contact_created_idx" ON "santacall_contact" USING btree ("created_at");