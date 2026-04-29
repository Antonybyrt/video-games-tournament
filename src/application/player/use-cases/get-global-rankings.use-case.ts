import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { PlayerStatsDto } from '../dtos/player-stats.dto';

export class GetGlobalRankingsUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(): Promise<PlayerStatsDto[]> {
    const rows = await this.playerRepository.findRankings();

    return rows
      .map((row) => {
        const losses = row.totalMatches - row.wins;
        const winRate = row.totalMatches > 0 ? row.wins / row.totalMatches : 0;
        return {
          playerId: row.player.id,
          totalMatches: row.totalMatches,
          wins: row.wins,
          losses,
          winRate,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }
}
