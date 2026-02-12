// identity/domain/entities/scope.ts
export class Scope {
  constructor(public readonly value: string) {
    if (!value || !value.includes(':')) {
      throw new Error('Invalid scope format');
    }
  }

  equals(other: Scope): boolean {
    return this.value === other.value;
  }
}
