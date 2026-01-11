CREATE TYPE "public"."current_subscription_status" AS ENUM('active', 'inactive', 'trial');--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "current_subscription_status" "current_subscription_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."subscription_status";