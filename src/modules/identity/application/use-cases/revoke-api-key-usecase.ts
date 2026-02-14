import type { ApiKeyRepository } from '../repositories/api-key-repository';
import { ApiKeyNotFoundError } from '../../domain/errors/api-key-not-found.error';

export interface RevokeApiKeyInput {
  apiKeyId: string;
}

export interface RevokeApiKeyOutput {
  id: string;
  status: 'revoked';
}

export class RevokeApiKeyUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async execute(input: RevokeApiKeyInput): Promise<RevokeApiKeyOutput> {
    const apiKey = await this.apiKeyRepository.findById(input.apiKeyId);

    if (!apiKey) {
      throw new ApiKeyNotFoundError(input.apiKeyId);
    }

    await this.apiKeyRepository.revoke(input.apiKeyId);

    return {
      id: input.apiKeyId,
      status: 'revoked',
    };
  }
}
