import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateGameDto } from '../../application/game/dtos/create-game.dto';
import { GameResponseDto } from '../../application/game/dtos/game-response.dto';
import { CreateGameUseCase } from '../../application/game/use-cases/create-game.use-case';
import { ListGamesUseCase } from '../../application/game/use-cases/list-games.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../infrastructure/auth/roles.guard';
import { GameMapper } from './mappers/game.mapper';

@Controller('games')
export class GameController {
  constructor(
    private readonly listGamesUseCase: ListGamesUseCase,
    private readonly createGameUseCase: CreateGameUseCase,
  ) {}

  @Get()
  async findAll(): Promise<GameResponseDto[]> {
    const games = await this.listGamesUseCase.execute();
    return games.map((g) => GameMapper.toResponseDto(g));
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateGameDto): Promise<GameResponseDto> {
    const game = await this.createGameUseCase.execute(dto);
    return GameMapper.toResponseDto(game);
  }
}
