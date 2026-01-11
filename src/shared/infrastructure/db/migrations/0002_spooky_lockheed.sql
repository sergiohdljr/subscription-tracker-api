ALTER TYPE "public"."subscription_status" ADD VALUE 'trial';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" timestamp;