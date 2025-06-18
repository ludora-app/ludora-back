export class UserAuthInfo {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly isConnected: boolean,
    public readonly emailVerified: boolean,
  ) {}
}
