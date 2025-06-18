export abstract class TokenRepository {
  abstract sign(payload: any): string;
  abstract deleteTokenById(id: string): Promise<void>;
  abstract getTokensForUser(userId: string): Promise<any[]>;
  abstract saveToken(userId: string, token: string, deviceId?: string): Promise<void>;
}
