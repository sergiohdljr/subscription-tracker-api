import type { ApiKeyRepository } from '../repositories/api-key-repository';
import { ApiKey } from '../../domain/entities/api-key';
import { ApiKeyHash } from '../../domain/value-objects/api-key-hash';
import { Scope } from '../../domain/entities/scope';
import { randomUUID } from 'node:crypto';

export interface CreateApiKeyInput {
  ownerId: string;
  name?: string;
  expiresAt?: Date | null;
  scopes?: string[];
}

export interface CreateApiKeyOutput {
  id: string;
  apiKey: string; // Plain text API key (only shown once)
  name: string;
  hash: string;
  ownerId: string;
  expiresAt: Date | null;
  scopes: string[];
  createdAt: Date;
}

export class CreateApiKeyUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyOutput> {
    // Generate a random API key (format: sk_live_<random-uuid>)
    const plainApiKey = `sk_live_${randomUUID().replace(/-/g, '')}`;

    const hash = ApiKeyHash.fromPlain(plainApiKey);

    const scopes = (input.scopes || []).map((scopeValue) => new Scope(scopeValue));

    const apiKey = new ApiKey(
      randomUUID(),
      hash.toString(),
      input.ownerId,
      'active',
      input.expiresAt || null,
      new Date(),
      null
    );

    for (const scope of scopes) {
      apiKey.addScope(scope);
    }

    const savedApiKey = await this.apiKeyRepository.save(apiKey, input.name);

    return {
      id: savedApiKey.id,
      apiKey: plainApiKey, // Return plain text only once
      name: input.name || `API Key ${new Date().toISOString()}`,
      hash: savedApiKey.hash,
      ownerId: savedApiKey.owner,
      expiresAt: savedApiKey.getExpiresAt(),
      scopes: savedApiKey.getScopes().map((s) => s.value),
      createdAt: savedApiKey.getCreatedAt(),
    };
  }
}
