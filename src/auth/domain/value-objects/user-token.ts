export class UserToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly deviceId: string | null,
    public readonly createdAt: Date,
  ) {}
}
