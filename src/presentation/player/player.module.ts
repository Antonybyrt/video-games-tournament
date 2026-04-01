import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetPlayerTournamentsUseCase } from '../../application/player/use-cases/get-player-tournaments.use-case';
import { GetPlayerUseCase } from '../../application/player/use-cases/get-player.use-case';
import { ListPlayersUseCase } from '../../application/player/use-cases/list-players.use-case';
import {
  IPlayerRepository,
  PLAYER_REPOSITORY,
} from '../../domain/player/player.repository.interface';
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
} from '../../domain/tournament/tournament.repository.interface';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { PlayerTypeormEntity } from '../../infrastructure/repositories/player/player.typeorm-entity';
import { TournamentTypeormEntity } from '../../infrastructure/repositories/tournament/tournament.typeorm-entity';
import { TournamentModule } from '../tournament/tournament.module';
import { PlayerController } from './player.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerTypeormEntity, TournamentTypeormEntity]),
    AuthInfrastructureModule,
    TournamentModule,
  ],
  controllers: [PlayerController],
  providers: [
    {
      provide: ListPlayersUseCase,
      useFactory: (repo: IPlayerRepository) => new ListPlayersUseCase(repo),
      inject: [PLAYER_REPOSITORY],
    },
    {
      provide: GetPlayerUseCase,
      useFactory: (repo: IPlayerRepository) => new GetPlayerUseCase(repo),
      inject: [PLAYER_REPOSITORY],
    },
    {
      provide: GetPlayerTournamentsUseCase,
      useFactory: (
        playerRepo: IPlayerRepository,
        tournamentRepo: ITournamentRepository,
      ) => new GetPlayerTournamentsUseCase(playerRepo, tournamentRepo),
      inject: [PLAYER_REPOSITORY, TOURNAMENT_REPOSITORY],
    },
  ],
})
export class PlayerModule {}
