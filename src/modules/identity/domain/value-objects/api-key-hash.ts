import { createHash } from 'crypto';

export class ApiKeyHash {
  private constructor(private readonly value: string) {}

  static fromPlain(apiKey: string): ApiKeyHash {
    if (!apiKey || apiKey.length < 32) {
      throw new Error('Invalid API key');
    }

    const hash = createHash('sha256').update(apiKey).digest('hex');

    return new ApiKeyHash(hash);
  }

  static fromHash(hash: string): ApiKeyHash {
    return new ApiKeyHash(hash);
  }

  equals(other: ApiKeyHash): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
