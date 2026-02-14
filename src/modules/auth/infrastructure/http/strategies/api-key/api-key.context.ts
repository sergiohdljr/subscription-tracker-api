import type { ApiKey } from '@/modules/identity/domain/entities/api-key';

/**
 * API Key authentication context
 * Contains the authenticated API key and its metadata
 */
export interface ApiKeyContext {
  apiKey: ApiKey;
  ownerId: string;
  scopes: string[];
}
