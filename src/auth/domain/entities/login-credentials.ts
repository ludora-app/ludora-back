export class LoginCredentials {
  private constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly deviceId?: string,
  ) {}

  static create(email: string, password: string, deviceId?: string): LoginCredentials {
    return new LoginCredentials(email.toLowerCase(), password, deviceId);
  }
}
