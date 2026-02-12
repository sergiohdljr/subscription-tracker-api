export class ApiKeyExpiredError extends Error {
  constructor() {
    super('API key has expired');
    this.name = 'ApiKeyExpiredError';
  }
}
