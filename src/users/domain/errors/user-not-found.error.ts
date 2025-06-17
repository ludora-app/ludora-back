export class UserNotFoundDomainError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}
