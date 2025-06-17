import { Sex } from '../value-objects/sex';
import { Email } from '../value-objects/email';
import { Phone } from '../value-objects/phone';
import { UserId } from '../value-objects/user-id';
import { Provider } from '../value-objects/provider';
import { UserType } from '../value-objects/user-type';

export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private password: string,
    private firstname: string,
    private lastname: string,
    private birthdate: Date,
    private sex: Sex,
    private phone: Phone,
    private provider: Provider,
    private type: UserType,
    private createdAt: Date,
    private updatedAt: Date,
    private active = true,
    private emailVerified = false,
    private isConnected = false,
    private imageUrl?: string,
    private bio?: string,
    private stripeAccountId?: string,
  ) {}

  //* Factory pattern
  static create(params: {
    id: UserId;
    email: Email;
    password: string;
    firstname: string;
    lastname: string;
    birthdate: Date;
    sex: Sex;
    phone: Phone;
    provider: Provider;
    type: UserType;
    imageUrl?: string;
    bio?: string;
    stripeAccountId?: string;
  }): User {
    const now = new Date();

    return new User(
      params.id,
      params.email,
      params.password,
      params.firstname,
      params.lastname,
      params.birthdate,
      params.sex,
      params.phone,
      params.provider,
      params.type,
      now,
      now,
      true,
      false,
      false,
      params.imageUrl,
      params.bio,
      params.stripeAccountId,
    );
  }

  //* Business methods
  verifyEmail() {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  connect() {
    this.isConnected = true;
    this.updatedAt = new Date();
  }

  disconnect() {
    this.isConnected = false;
    this.updatedAt = new Date();
  }

  deactivate() {
    this.active = false;
    this.updatedAt = new Date();
  }

  updateProfile(data: { firstname?: string; lastname?: string; bio?: string; imageUrl?: string }) {
    if (data.firstname) this.firstname = data.firstname;
    if (data.lastname) this.lastname = data.lastname;
    if (data.bio) this.bio = data.bio;
    if (data.imageUrl) this.imageUrl = data.imageUrl;
    this.updatedAt = new Date();
  }

  //* Getters
  getId(): string {
    return this.id.getValue();
  }

  getEmail(): string {
    return this.email.getValue();
  }

  getProfile(): {
    firstname: string;
    lastname: string;
    imageUrl?: string;
    bio?: string;
  } {
    return {
      bio: this.bio,
      firstname: this.firstname,
      imageUrl: this.imageUrl,
      lastname: this.lastname,
    };
  }

  getBirthdate(): Date {
    return this.birthdate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getPassword(): string {
    return this.password;
  }

  getPhone(): string {
    return this.phone.getValue();
  }

  getProvider(): Provider {
    return this.provider;
  }

  getSex(): Sex {
    return this.sex;
  }

  getStripeAccountId(): string | undefined {
    return this.stripeAccountId;
  }

  getType(): UserType {
    return this.type;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
