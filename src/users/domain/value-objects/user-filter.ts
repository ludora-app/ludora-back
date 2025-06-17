export class UserFilter {
  constructor(
    public readonly name?: string,
    public readonly limit?: number,
    public readonly cursor?: string,
  ) {}
}
