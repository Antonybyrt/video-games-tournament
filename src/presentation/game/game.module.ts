import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateGameUseCase } from '../../application/game/use-cases/create-game.use-case';
import { ListGamesUseCase } from '../../application/game/use-cases/list-games.use-case';
import {
  GAME_REPOSITORY,
  IGameRepository,
} from '../../domain/game/game.repository.interface';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { GameTypeormEntity } from '../../infrastructure/repositories/game/game.typeorm-entity';
import { GameTypeormRepository } from '../../infrastructure/repositories/game/game.typeorm-repository';
import { GameController } from './game.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameTypeormEntity]),
    AuthInfrastructureModule,
  ],
  controllers: [GameController],
  providers: [
    { provide: GAME_REPOSITORY, useClass: GameTypeormRepository },
    {
      provide: ListGamesUseCase,
      useFactory: (repo: IGameRepository) => new ListGamesUseCase(repo),
      inject: [GAME_REPOSITORY],
    },
    {
      provide: CreateGameUseCase,
      useFactory: (repo: IGameRepository) => new CreateGameUseCase(repo),
      inject: [GAME_REPOSITORY],
    },
  ],
})
export class GameModule {}
