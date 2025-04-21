import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false, name: 'isStrongPassword' })
export class IsStrongPassword implements ValidatorConstraintInterface {
  validate(password: string) {
    if (typeof password !== 'string') {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialCharacter;
    return isValid;
  }

  defaultMessage() {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}
