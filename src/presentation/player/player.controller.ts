import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { PlayerStatsDto } from '../../application/player/dtos/player-stats.dto';
import { PlayerResponseDto } from '../../application/player/dtos/player-response.dto';
import { DeletePlayerUseCase } from '../../application/player/use-cases/delete-player.use-case';
import { GetGlobalRankingsUseCase } from '../../application/player/use-cases/get-global-rankings.use-case';
import { GetPlayerStatsUseCase } from '../../application/player/use-cases/get-player-stats.use-case';
import { GetPlayerTournamentsUseCase } from '../../application/player/use-cases/get-player-tournaments.use-case';
import { GetPlayerUseCase } from '../../application/player/use-cases/get-player.use-case';
import { ListPlayersUseCase } from '../../application/player/use-cases/list-players.use-case';
import { TournamentResponseDto } from '../../application/tournament/dtos/tournament-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
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
    private readonly deletePlayerUseCase: DeletePlayerUseCase,
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

  @Delete(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.deletePlayerUseCase.execute(id);
    return { deleted: true };
  }
}
