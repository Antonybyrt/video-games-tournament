import { MatchEntity } from '../../../domain/match/match.entity';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class SubmitMatchResultUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

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
    return this.matchRepository.save(match);
  }
}
