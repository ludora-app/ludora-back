export abstract class PasswordHasherPort {
  abstract hash(password: string): Promise<string>;
  abstract compare(hashedPassword: string, password: string): Promise<boolean>;
}
