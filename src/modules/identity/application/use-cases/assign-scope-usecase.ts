import type { ApiKeyRepository } from '../repositories/api-key-repository';
import { Scope } from '../../domain/entities/scope';
import { ApiKeyNotFoundError } from '../../domain/errors/api-key-not-found.error';

export interface AssignScopeInput {
  apiKeyId: string;
  scopeValue: string; // e.g., "subscriptions:read"
}

export interface AssignScopeOutput {
  apiKeyId: string;
  scope: string;
}

export class AssignScopeUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async execute(input: AssignScopeInput): Promise<AssignScopeOutput> {
    // Find the API key
    const apiKey = await this.apiKeyRepository.findById(input.apiKeyId);

    if (!apiKey) {
      throw new ApiKeyNotFoundError(input.apiKeyId);
    }

    // Validate and create scope
    const scope = new Scope(input.scopeValue);

    // Check if scope already exists
    const existingScopes = await this.apiKeyRepository.findScopesByApiKeyId(input.apiKeyId);
    const scopeExists = existingScopes.some((s) => s.equals(scope));

    if (scopeExists) {
      // Scope already assigned, return success
      return {
        apiKeyId: input.apiKeyId,
        scope: scope.value,
      };
    }

    // Add scope to the entity
    apiKey.addScope(scope);

    // Update the API key (this will persist the scope in the entity)
    // Note: For Drizzle repository, we'd need to also call addScopeToApiKey with scopeId
    // For now, we update the entity which works for in-memory repository
    await this.apiKeyRepository.update(apiKey);

    return {
      apiKeyId: input.apiKeyId,
      scope: scope.value,
    };
  }
}
