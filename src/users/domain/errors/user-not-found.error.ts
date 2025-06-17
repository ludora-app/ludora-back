export class UserNotFoundDomainError extends Error {
  constructor(resource?: string) {
    super(`User [${resource}] not found`);
    this.name = 'UserNotFoundError';
  }
}
