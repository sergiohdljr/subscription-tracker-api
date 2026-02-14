export class InsufficientScopeError extends Error {
  constructor(scope: string) {
    super(`Insufficient scope: required '${scope}'`);
    this.name = 'InsufficientScopeError';
  }
}
