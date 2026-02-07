import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ApiKeyRepository } from "../../application/repositories/api-key-repository";
import { ApiKey } from "../../domain/entities/api-key";
import { Scope } from "../../domain/entities/scope";
import type * as schema from "@/shared/infrastructure/db/drizzle/schemas/schema";
import { apiKeys, apiScopes, apiKeyScopes } from "@/shared/infrastructure/db/drizzle/schemas";
import { eq, and } from "drizzle-orm";
import { ApiKeyMapper } from "@/shared/infrastructure/db/drizzle/mappers/api-key-mappers";

export class ApiKeyDrizzleRepository implements ApiKeyRepository {
    constructor(public readonly drizzleConnection: NodePgDatabase<typeof schema>) { }

    async save(apiKey: ApiKey, name?: string): Promise<ApiKey> {
        const data = ApiKeyMapper.toInsert(apiKey, name);

        const [returningData] = await this.drizzleConnection
            .insert(apiKeys)
            .values(data)
            .returning();

        // Load scopes if any
        const scopes = await this.findScopesByApiKeyId(returningData.id);

        return ApiKeyMapper.toDomain(returningData, scopes);
    }

    async findById(id: string): Promise<ApiKey | null> {
        const [row] = await this.drizzleConnection
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.id, id));

        if (!row) {
            return null;
        }

        const scopes = await this.findScopesByApiKeyId(id);
        return ApiKeyMapper.toDomain(row, scopes);
    }

    async findByHash(hash: string): Promise<ApiKey | null> {
        const [row] = await this.drizzleConnection
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.keyHash, hash));

        if (!row) {
            return null;
        }

        const scopes = await this.findScopesByApiKeyId(row.id);
        return ApiKeyMapper.toDomain(row, scopes);
    }

    async findByOwnerId(ownerId: string): Promise<ApiKey[]> {
        const rows = await this.drizzleConnection
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.ownerId, ownerId));

        const apiKeysList: ApiKey[] = [];

        for (const row of rows) {
            const scopes = await this.findScopesByApiKeyId(row.id);
            apiKeysList.push(ApiKeyMapper.toDomain(row, scopes));
        }

        return apiKeysList;
    }

    async update(apiKey: ApiKey): Promise<ApiKey> {
        const data = ApiKeyMapper.toUpdate(apiKey);

        const [updatedRow] = await this.drizzleConnection
            .update(apiKeys)
            .set(data)
            .where(eq(apiKeys.id, apiKey.id))
            .returning();

        if (!updatedRow) {
            throw new Error(`Failed to update API key ${apiKey.id}`);
        }

        const scopes = await this.findScopesByApiKeyId(apiKey.id);
        return ApiKeyMapper.toDomain(updatedRow, scopes);
    }

    async revoke(id: string): Promise<void> {
        await this.drizzleConnection
            .update(apiKeys)
            .set({ status: 'revoked' })
            .where(eq(apiKeys.id, id));
    }

    async findScopesByApiKeyId(apiKeyId: string): Promise<Scope[]> {
        const rows = await this.drizzleConnection
            .select({
                scopeName: apiScopes.name,
            })
            .from(apiKeyScopes)
            .innerJoin(apiScopes, eq(apiKeyScopes.scopeId, apiScopes.id))
            .where(eq(apiKeyScopes.apiKeyId, apiKeyId));

        return rows.map(row => new Scope(row.scopeName));
    }

    async addScopeToApiKey(apiKeyId: string, scopeId: string): Promise<void> {
        // Check if scope already exists
        const [existing] = await this.drizzleConnection
            .select()
            .from(apiKeyScopes)
            .where(
                and(
                    eq(apiKeyScopes.apiKeyId, apiKeyId),
                    eq(apiKeyScopes.scopeId, scopeId)
                )
            );

        if (existing) {
            return; // Already exists
        }

        await this.drizzleConnection
            .insert(apiKeyScopes)
            .values({
                apiKeyId,
                scopeId,
            });
    }

    async removeScopeFromApiKey(apiKeyId: string, scopeId: string): Promise<void> {
        await this.drizzleConnection
            .delete(apiKeyScopes)
            .where(
                and(
                    eq(apiKeyScopes.apiKeyId, apiKeyId),
                    eq(apiKeyScopes.scopeId, scopeId)
                )
            );
    }
}

