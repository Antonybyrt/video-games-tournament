import { DomainException } from './domain.exception';

export class ConflictDomainException extends DomainException {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
