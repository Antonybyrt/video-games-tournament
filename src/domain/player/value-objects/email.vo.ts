import { BusinessRuleDomainException } from '../../shared/exceptions/business-rule.exception';

export class EmailVO {
  private readonly _value: string;

  constructor(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new BusinessRuleDomainException('Invalid email format');
    }
    this._value = value.toLowerCase();
  }

  get value(): string {
    return this._value;
  }

  equals(other: EmailVO): boolean {
    return this._value === other._value;
  }
}
