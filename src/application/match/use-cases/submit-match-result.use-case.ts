import { MatchEntity } from '../../../domain/match/match.entity';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { ITournamentEventsPort } from '../../shared/ports/tournament-events.port';

export class SubmitMatchResultUseCase {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly events?: ITournamentEventsPort,
  ) {}

  async execute(
    matchId: string,
    winnerId: string,
    score: string,
  ): Promise<MatchEntity> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundDomainException('Match not found');
    }
    match.submitResult(winnerId, score);
    const saved = await this.matchRepository.save(match);
    this.events?.notifyMatchUpdated(saved.tournamentId, {
      id: saved.id,
      round: saved.round,
      status: saved.status,
      winnerId: saved.winnerId,
      score: saved.score,
    });
    return saved;
  }
}
