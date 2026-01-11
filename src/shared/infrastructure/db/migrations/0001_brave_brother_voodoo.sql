CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive');--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "active" TO "status";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cycle" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "currency" varchar(3) DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_billing_date" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "renewal_notified_at" timestamp;