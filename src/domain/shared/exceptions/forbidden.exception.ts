import { DomainException } from './domain.exception';

export class ForbiddenDomainException extends DomainException {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}
