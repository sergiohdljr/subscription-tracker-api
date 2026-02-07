import { Scope } from './scope';
import { ApiKeyExpiredError } from '../errors/api-key-expired.error';
import { ApiKeyRevokedError } from '../errors/api-key-revoked.error';
import { InsufficientScopeError } from '../errors/insufficient-scope.error';

export class ApiKey {
    private scopes: Scope[] = [];

    constructor(
        public readonly id: string,
        public readonly hash: string,
        public readonly owner: string,
        private status: "active" | "revoked",
        private readonly expiresAt: Date | null,
        private readonly createdAt: Date,
        private lastUsedAt: Date | null
    ) { }

    isActive(): boolean {
        return this.status === 'active';
    }

    isExpired(now: Date = new Date()): boolean {
        if (!this.expiresAt) return false;
        return now > this.expiresAt;
    }

    assertUsable(): void {
        if (this.status === 'revoked') {
            throw new ApiKeyRevokedError();
        }

        if (this.isExpired()) {
            throw new ApiKeyExpiredError();
        }
    }

    addScope(scope: Scope): void {
        if (this.scopes.some(s => s.equals(scope))) return;
        this.scopes.push(scope);
    }

    hasScope(required: Scope): boolean {
        return this.scopes.some(scope => scope.equals(required));
    }

    assertHasScope(required: Scope): void {
        if (!this.hasScope(required)) {
            throw new InsufficientScopeError(required.value);
        }
    }

    revoke(): void {
        this.status = 'revoked';
    }

    markAsUsed(at: Date = new Date()): void {
        this.lastUsedAt = at;
    }

    getScopes(): Scope[] {
        return [...this.scopes];
    }
}
