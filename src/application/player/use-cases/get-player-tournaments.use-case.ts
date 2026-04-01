import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class GetPlayerTournamentsUseCase {
  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly tournamentRepository: ITournamentRepository,
  ) {}

  async execute(playerId: string): Promise<TournamentEntity[]> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new NotFoundDomainException('Player not found');
    }
    return this.tournamentRepository.findByPlayerId(playerId);
  }
}
