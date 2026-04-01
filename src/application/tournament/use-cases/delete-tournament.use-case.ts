import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class DeleteTournamentUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  async execute(id: string): Promise<void> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }
    await this.tournamentRepository.delete(id);
  }
}
