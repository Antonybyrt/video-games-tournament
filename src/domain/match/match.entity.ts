import { BusinessRuleDomainException } from '../shared/exceptions/business-rule.exception';
import { MatchStatus } from './match-status.enum';

export class MatchEntity {
  constructor(
    public readonly id: string,
    public readonly tournamentId: string,
    public readonly player1Id: string,
    public readonly player2Id: string,
    public status: MatchStatus,
    public readonly round: number,
    public score: string | null,
    public winnerId: string | null,
  ) {}

  submitResult(winnerId: string, score: string): void {
    if (this.status === MatchStatus.COMPLETED) {
      throw new BusinessRuleDomainException('Match is already completed');
    }
    if (winnerId !== this.player1Id && winnerId !== this.player2Id) {
      throw new BusinessRuleDomainException(
        'Winner must be one of the match players',
      );
    }
    this.status = MatchStatus.COMPLETED;
    this.winnerId = winnerId;
    this.score = score;
  }
}
