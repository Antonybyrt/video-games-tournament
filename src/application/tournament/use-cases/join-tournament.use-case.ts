import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class JoinTournamentUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  async execute(tournamentId: string, playerId: string): Promise<void> {
    const tournament =
      await this.tournamentRepository.findByIdWithPlayers(tournamentId);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }

    const enrolled = await this.tournamentRepository.isPlayerEnrolled(
      tournamentId,
      playerId,
    );
    if (enrolled) {
      throw new ConflictDomainException('Player already enrolled');
    }

    const currentCount =
      await this.tournamentRepository.countPlayers(tournamentId);
    if (!tournament.canJoin(currentCount)) {
      throw new BusinessRuleDomainException(
        'Tournament is full or not accepting registrations',
      );
    }

    await this.tournamentRepository.addPlayer(tournamentId, playerId);
  }
}
