import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { PlayerStatsDto } from '../dtos/player-stats.dto';

export class GetPlayerStatsUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(playerId: string): Promise<PlayerStatsDto> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new NotFoundDomainException('Player not found');
    }

    const { wins, totalMatches } =
      await this.playerRepository.findStats(playerId);

    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? wins / totalMatches : 0;

    return { playerId, totalMatches, wins, losses, winRate };
  }
}
