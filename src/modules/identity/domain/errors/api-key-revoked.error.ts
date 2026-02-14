export class ApiKeyRevokedError extends Error {
  constructor() {
    super('API key has been revoked');
    this.name = 'ApiKeyRevokedError';
  }
}
