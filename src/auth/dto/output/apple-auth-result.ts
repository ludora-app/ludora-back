export interface AppleAuthResult {
  appleUserId: string;
  email: string | null;
  isPrivateEmail: boolean;
  encryptedRefreshToken: string | null;
}
