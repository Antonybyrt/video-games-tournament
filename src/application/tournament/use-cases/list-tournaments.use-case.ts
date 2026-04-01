import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';

export class ListTournamentsUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  execute(status?: TournamentStatus): Promise<TournamentEntity[]> {
    return this.tournamentRepository.findAll(status);
  }
}
