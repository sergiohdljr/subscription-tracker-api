import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../../../shared/infrastructure/db/connection-pool";

export const auth = betterAuth({
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    basePath: "/api/auth",
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    }
});
