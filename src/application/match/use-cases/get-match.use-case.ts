import { MatchEntity } from '../../../domain/match/match.entity';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class GetMatchUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(matchId: string): Promise<MatchEntity> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundDomainException('Match not found');
    }
    return match;
  }
}
