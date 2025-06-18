export class RegisterCredentials {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstname: string,
    public readonly lastname?: string,
    public readonly birthdate?: string,
    public readonly phone?: string,
    public readonly sex?: string,
    public readonly imageUrl?: string,
    public readonly bio?: string,
    public readonly provider?: string,
    public readonly type?: string,
  ) {
    this.provider = 'LUDORA';
    this.type = 'USER';
  }
}
