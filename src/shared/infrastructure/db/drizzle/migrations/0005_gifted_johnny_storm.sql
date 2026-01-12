ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."billing_cycle";--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" SET DATA TYPE "public"."billing_cycle" USING "billing_cycle"::"public"."billing_cycle";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::text;--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'INACTIVE', 'TRIAL');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE "public"."subscription_status" USING "status"::"public"."subscription_status";