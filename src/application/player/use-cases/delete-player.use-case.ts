import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';

export class DeletePlayerUseCase {
  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly tournamentRepository: ITournamentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new NotFoundDomainException('Player not found');
    }

    const tournaments = await this.tournamentRepository.findByPlayerId(id);
    const isInActiveTournament = tournaments.some(
      (t) => t.status !== TournamentStatus.COMPLETED,
    );
    if (isInActiveTournament) {
      throw new BusinessRuleDomainException(
        'Player cannot be deleted while enrolled in an active tournament',
      );
    }

    await this.playerRepository.delete(id);
  }
}
