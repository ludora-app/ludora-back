import { randomUUID } from 'crypto';

export class UserId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  static fromString(value: string): UserId {
    if (!UserId.isValid(value)) {
      throw new Error(`UUID invalide: ${value}`);
    }
    return new UserId(value);
  }

  static isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
