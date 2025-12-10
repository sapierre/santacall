CREATE TYPE "public"."santacall_conversation_status" AS ENUM('scheduled', 'active', 'completed', 'missed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."santacall_order_status" AS ENUM('pending', 'paid', 'processing', 'ready', 'delivered', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."santacall_order_type" AS ENUM('video', 'call');--> statement-breakpoint
CREATE TYPE "public"."santacall_video_job_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "santacall_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tavus_conversation_id" text,
	"status" "santacall_conversation_status" DEFAULT 'scheduled' NOT NULL,
	"room_url" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "santacall_conversation_tavusConversationId_unique" UNIQUE("tavus_conversation_id")
);
--> statement-breakpoint
CREATE TABLE "santacall_order" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"order_type" "santacall_order_type" NOT NULL,
	"status" "santacall_order_status" DEFAULT 'pending' NOT NULL,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"child_name" text NOT NULL,
	"child_age" integer NOT NULL,
	"interests" text,
	"special_message" text,
	"scheduled_at" timestamp with time zone,
	"timezone" text,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"amount_paid" integer,
	"currency" text,
	"delivery_url" text,
	"delivery_token" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "santacall_order_orderNumber_unique" UNIQUE("order_number"),
	CONSTRAINT "santacall_order_stripePaymentIntentId_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "santacall_video_job" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"tavus_video_id" text,
	"status" "santacall_video_job_status" DEFAULT 'queued' NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "santacall_video_job_tavusVideoId_unique" UNIQUE("tavus_video_id")
);
--> statement-breakpoint
ALTER TABLE "santacall_conversation" ADD CONSTRAINT "santacall_conversation_order_id_santacall_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."santacall_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "santacall_video_job" ADD CONSTRAINT "santacall_video_job_order_id_santacall_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."santacall_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "santacall_conversation_order_idx" ON "santacall_conversation" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "santacall_conversation_status_idx" ON "santacall_conversation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "santacall_conversation_scheduled_idx" ON "santacall_conversation" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "santacall_conversation_tavus_idx" ON "santacall_conversation" USING btree ("tavus_conversation_id");--> statement-breakpoint
CREATE INDEX "santacall_order_email_idx" ON "santacall_order" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "santacall_order_status_idx" ON "santacall_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "santacall_order_type_idx" ON "santacall_order" USING btree ("order_type");--> statement-breakpoint
CREATE INDEX "santacall_order_scheduled_idx" ON "santacall_order" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "santacall_order_stripe_session_idx" ON "santacall_order" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "santacall_order_payment_intent_idx" ON "santacall_order" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "santacall_video_job_order_idx" ON "santacall_video_job" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "santacall_video_job_status_idx" ON "santacall_video_job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "santacall_video_job_tavus_idx" ON "santacall_video_job" USING btree ("tavus_video_id");