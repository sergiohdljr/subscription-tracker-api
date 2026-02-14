import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema';

export const apiKeyStatus = pgEnum('api_key_status', ['active', 'revoked'] as const);

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'set null' }),
  status: apiKeyStatus('status').notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
});

export const apiScopes = pgTable('api_scopes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),
});

export const apiKeyScopes = pgTable(
  'api_key_scopes',
  {
    apiKeyId: uuid('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    scopeId: uuid('scope_id')
      .notNull()
      .references(() => apiScopes.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: {
      primaryKey: [table.apiKeyId, table.scopeId],
    },
  })
);
