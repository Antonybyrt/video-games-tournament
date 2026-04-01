import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PlayerResponseDto } from '../../application/player/dtos/player-response.dto';
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
  ) {}

  @Get('rankings')
  getRankings(): [] {
    return [];
  }

  @Get()
  async findAll(): Promise<PlayerResponseDto[]> {
    const players = await this.listPlayersUseCase.execute();
    return players.map((p) => PlayerMapper.toResponseDto(p));
  }

  @Get(':id/stats')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStats(@Param('id', ParseUUIDPipe) _id: string): Record<string, never> {
    return {};
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
