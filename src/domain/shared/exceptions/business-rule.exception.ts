import { DomainException } from './domain.exception';

export class BusinessRuleDomainException extends DomainException {
  constructor(message: string) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION');
  }
}
