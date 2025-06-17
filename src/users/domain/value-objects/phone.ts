export class Phone {
  private readonly value: string;

  constructor(phone: string) {
    if (!Phone.isValid(phone)) {
      throw new Error(`Numéro de téléphone invalide: ${phone}`);
    }
    this.value = phone;
  }

  static isValid(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{6,14}$/; // Format E.164 simplifié
    return phoneRegex.test(phone);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
