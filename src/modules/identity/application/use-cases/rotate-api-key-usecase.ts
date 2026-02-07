import { ApiKeyRepository } from "../repositories/api-key-repository";
import { ApiKey } from "../../domain/entities/api-key";
import { ApiKeyHash } from "../../domain/value-objects/api-key-hash";
import { Scope } from "../../domain/entities/scope";
import { ApiKeyNotFoundError } from "../../domain/errors/api-key-not-found.error";
import { ApiKeyRevokedError } from "../../domain/errors/api-key-revoked.error";
import { randomUUID } from "crypto";

export interface RotateApiKeyInput {
    apiKeyId: string;
    name?: string;
    expiresAt?: Date | null;
    keepScopes?: boolean; // If true, copy scopes from old key
}

export interface RotateApiKeyOutput {
    oldKeyId: string;
    newKeyId: string;
    apiKey: string; // Plain text API key (only shown once)
    name: string;
    hash: string;
    ownerId: string;
    expiresAt: Date | null;
    scopes: string[];
    createdAt: Date;
}

export class RotateApiKeyUseCase {
    constructor(
        private readonly apiKeyRepository: ApiKeyRepository
    ) { }

    async execute(input: RotateApiKeyInput): Promise<RotateApiKeyOutput> {
        // Find the old API key
        const oldApiKey = await this.apiKeyRepository.findById(input.apiKeyId);

        if (!oldApiKey) {
            throw new ApiKeyNotFoundError(input.apiKeyId);
        }

        // Check if old key is already revoked
        if (oldApiKey.getStatus() === 'revoked') {
            throw new ApiKeyRevokedError();
        }

        // Generate a new API key
        const plainApiKey = `sk_live_${randomUUID().replace(/-/g, '')}`;
        const hash = ApiKeyHash.fromPlain(plainApiKey);

        // Get scopes from old key if keepScopes is true
        const scopes = input.keepScopes !== false
            ? oldApiKey.getScopes()
            : [];

        // Create new API key entity
        const newApiKey = new ApiKey(
            randomUUID(),
            hash.toString(),
            oldApiKey.owner,
            'active',
            input.expiresAt !== undefined ? input.expiresAt : oldApiKey.getExpiresAt(),
            new Date(),
            null
        );

        // Add scopes to new key
        scopes.forEach(scope => newApiKey.addScope(scope));

        // Save new key
        const savedApiKey = await this.apiKeyRepository.save(
            newApiKey,
            input.name || `Rotated from ${input.apiKeyId}`
        );

        // Revoke old key
        await this.apiKeyRepository.revoke(input.apiKeyId);

        return {
            oldKeyId: input.apiKeyId,
            newKeyId: savedApiKey.id,
            apiKey: plainApiKey,
            name: input.name || `Rotated from ${input.apiKeyId}`,
            hash: savedApiKey.hash,
            ownerId: savedApiKey.owner,
            expiresAt: savedApiKey.getExpiresAt(),
            scopes: savedApiKey.getScopes().map(s => s.value),
            createdAt: savedApiKey.getCreatedAt()
        };
    }
}

