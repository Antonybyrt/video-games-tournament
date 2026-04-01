import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class GetTournamentUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  async execute(id: string): Promise<TournamentEntity> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }
    return tournament;
  }
}
