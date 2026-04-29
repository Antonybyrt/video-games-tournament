import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PlayerStatsDto } from '../../application/player/dtos/player-stats.dto';
import { PlayerResponseDto } from '../../application/player/dtos/player-response.dto';
import { GetGlobalRankingsUseCase } from '../../application/player/use-cases/get-global-rankings.use-case';
import { GetPlayerStatsUseCase } from '../../application/player/use-cases/get-player-stats.use-case';
import { GetPlayerTournamentsUseCase } from '../../application/player/use-cases/get-player-tournaments.use-case';
import { GetPlayerUseCase } from '../../application/player/use-cases/get-player.use-case';
import { ListPlayersUseCase } from '../../application/player/use-cases/list-players.use-case';
import { TournamentResponseDto } from '../../application/tournament/dtos/tournament-response.dto';
import { TournamentMapper } from '../tournament/mappers/tournament.mapper';
import { PlayerMapper } from './mappers/player.mapper';

@Controller('players')
export class PlayerController {
  constructor(
    private readonly listPlayersUseCase: ListPlayersUseCase,
    private readonly getPlayerUseCase: GetPlayerUseCase,
    private readonly getPlayerTournamentsUseCase: GetPlayerTournamentsUseCase,
    private readonly getPlayerStatsUseCase: GetPlayerStatsUseCase,
    private readonly getGlobalRankingsUseCase: GetGlobalRankingsUseCase,
  ) {}

  @Get('rankings')
  async getRankings(): Promise<PlayerStatsDto[]> {
    return this.getGlobalRankingsUseCase.execute();
  }

  @Get()
  async findAll(): Promise<PlayerResponseDto[]> {
    const players = await this.listPlayersUseCase.execute();
    return players.map((p) => PlayerMapper.toResponseDto(p));
  }

  @Get(':id/stats')
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayerStatsDto> {
    return this.getPlayerStatsUseCase.execute(id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlayerResponseDto> {
    const player = await this.getPlayerUseCase.execute(id);
    return PlayerMapper.toResponseDto(player);
  }

  @Get(':id/tournaments')
  async findTournaments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentResponseDto[]> {
    const tournaments = await this.getPlayerTournamentsUseCase.execute(id);
    return tournaments.map((t) => TournamentMapper.toResponseDto(t));
  }
}
