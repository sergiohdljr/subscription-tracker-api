CREATE TYPE "public"."billing_cycle" AS ENUM('weekly', 'monthly', 'yearly');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" SET DEFAULT 'monthly'::"public"."billing_cycle";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" SET DATA TYPE "public"."billing_cycle" USING "billing_cycle"::"public"."billing_cycle";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "active" boolean DEFAULT true NOT NULL;