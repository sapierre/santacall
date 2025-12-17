ALTER TABLE "santacall_conversation" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "santacall_order" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "santacall_video_job" ALTER COLUMN "updated_at" SET DEFAULT now();