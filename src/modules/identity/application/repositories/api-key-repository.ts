import { ApiKey } from "../../domain/entities/api-key";
import { Scope } from "../../domain/entities/scope";

export interface ApiKeyRepository {
    save(apiKey: ApiKey, name?: string): Promise<ApiKey>;
    findById(id: string): Promise<ApiKey | null>;
    findByHash(hash: string): Promise<ApiKey | null>;
    findByOwnerId(ownerId: string): Promise<ApiKey[]>;
    update(apiKey: ApiKey): Promise<ApiKey>;
    revoke(id: string): Promise<void>;
    findScopesByApiKeyId(apiKeyId: string): Promise<Scope[]>;
    addScopeToApiKey(apiKeyId: string, scopeId: string): Promise<void>;
    removeScopeFromApiKey(apiKeyId: string, scopeId: string): Promise<void>;
}

