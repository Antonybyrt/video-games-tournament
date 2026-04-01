import { BusinessRuleDomainException } from '../../shared/exceptions/business-rule.exception';

export class TournamentNameVO {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 100) {
      throw new BusinessRuleDomainException(
        'Tournament name must be between 3 and 100 characters',
      );
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: TournamentNameVO): boolean {
    return this._value === other._value;
  }
}
