import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MatchResponseDto } from '../../application/match/dtos/match-response.dto';
import { ListTournamentMatchesUseCase } from '../../application/match/use-cases/list-tournament-matches.use-case';
import { StartTournamentUseCase } from '../../application/match/use-cases/start-tournament.use-case';
import { TournamentResponseDto } from '../../application/tournament/dtos/tournament-response.dto';
import { CreateTournamentDto } from '../../application/tournament/dtos/create-tournament.dto';
import { UpdateTournamentDto } from '../../application/tournament/dtos/update-tournament.dto';
import { CreateTournamentUseCase } from '../../application/tournament/use-cases/create-tournament.use-case';
import { DeleteTournamentUseCase } from '../../application/tournament/use-cases/delete-tournament.use-case';
import { GetTournamentUseCase } from '../../application/tournament/use-cases/get-tournament.use-case';
import { JoinTournamentUseCase } from '../../application/tournament/use-cases/join-tournament.use-case';
import { ListTournamentsUseCase } from '../../application/tournament/use-cases/list-tournaments.use-case';
import { UpdateTournamentUseCase } from '../../application/tournament/use-cases/update-tournament.use-case';
import { TournamentStatus } from '../../domain/tournament/tournament-status.enum';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthenticatedUser } from '../../infrastructure/auth/authenticated-user.interface';
import { MatchMapper } from '../match/mappers/match.mapper';
import { TournamentMapper } from './mappers/tournament.mapper';

@Controller('tournaments')
export class TournamentController {
  constructor(
    private readonly listTournamentsUseCase: ListTournamentsUseCase,
    private readonly createTournamentUseCase: CreateTournamentUseCase,
    private readonly getTournamentUseCase: GetTournamentUseCase,
    private readonly updateTournamentUseCase: UpdateTournamentUseCase,
    private readonly deleteTournamentUseCase: DeleteTournamentUseCase,
    private readonly joinTournamentUseCase: JoinTournamentUseCase,
    private readonly listTournamentMatchesUseCase: ListTournamentMatchesUseCase,
    private readonly startTournamentUseCase: StartTournamentUseCase,
  ) {}

  @Get()
  async findAll(
    @Query('status', new ParseEnumPipe(TournamentStatus, { optional: true }))
    status?: TournamentStatus,
  ): Promise<TournamentResponseDto[]> {
    const tournaments = await this.listTournamentsUseCase.execute(status);
    return tournaments.map((t) => TournamentMapper.toResponseDto(t));
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.createTournamentUseCase.execute(dto);
    return TournamentMapper.toResponseDto(tournament);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.getTournamentUseCase.execute(id);
    return TournamentMapper.toResponseDto(tournament);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.updateTournamentUseCase.execute(id, dto);
    return TournamentMapper.toResponseDto(tournament);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.deleteTournamentUseCase.execute(id);
    return { deleted: true };
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async join(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: AuthenticatedUser },
  ): Promise<{ joined: boolean }> {
    await this.joinTournamentUseCase.execute(id, req.user.id);
    return { joined: true };
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async start(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchResponseDto[]> {
    const matches = await this.startTournamentUseCase.execute(id);
    return matches.map((m) => MatchMapper.toResponseDto(m));
  }

  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  async findMatches(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchResponseDto[]> {
    const matches = await this.listTournamentMatchesUseCase.execute(id);
    return matches.map((m) => MatchMapper.toResponseDto(m));
  }
}
