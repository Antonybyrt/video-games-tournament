import { MatchEntity } from '../../../domain/match/match.entity';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';

export class ListTournamentMatchesUseCase {
  constructor(private readonly matchRepository: IMatchRepository) {}

  async execute(tournamentId: string): Promise<MatchEntity[]> {
    return this.matchRepository.findByTournamentId(tournamentId);
  }
}
