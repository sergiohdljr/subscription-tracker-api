CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'trial');--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "status" "subscription_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "current_subscription_status";--> statement-breakpoint
DROP TYPE "public"."current_subscription_status";