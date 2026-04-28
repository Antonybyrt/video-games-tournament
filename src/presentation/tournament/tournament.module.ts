import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTournamentUseCase } from '../../application/tournament/use-cases/create-tournament.use-case';
import { DeleteTournamentUseCase } from '../../application/tournament/use-cases/delete-tournament.use-case';
import { GetTournamentUseCase } from '../../application/tournament/use-cases/get-tournament.use-case';
import { JoinTournamentUseCase } from '../../application/tournament/use-cases/join-tournament.use-case';
import { ListTournamentsUseCase } from '../../application/tournament/use-cases/list-tournaments.use-case';
import { UpdateTournamentUseCase } from '../../application/tournament/use-cases/update-tournament.use-case';
import {
  ITournamentRepository,
  TOURNAMENT_REPOSITORY,
} from '../../domain/tournament/tournament.repository.interface';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { PlayerTypeormEntity } from '../../infrastructure/repositories/player/player.typeorm-entity';
import { TournamentTypeormEntity } from '../../infrastructure/repositories/tournament/tournament.typeorm-entity';
import { TournamentTypeormRepository } from '../../infrastructure/repositories/tournament/tournament.typeorm-repository';
import { MatchModule } from '../match/match.module';
import { TournamentController } from './tournament.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TournamentTypeormEntity, PlayerTypeormEntity]),
    AuthInfrastructureModule,
    MatchModule,
  ],
  controllers: [TournamentController],
  exports: [TOURNAMENT_REPOSITORY, TypeOrmModule],
  providers: [
    { provide: TOURNAMENT_REPOSITORY, useClass: TournamentTypeormRepository },
    {
      provide: CreateTournamentUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new CreateTournamentUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
    {
      provide: GetTournamentUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new GetTournamentUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
    {
      provide: ListTournamentsUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new ListTournamentsUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
    {
      provide: UpdateTournamentUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new UpdateTournamentUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
    {
      provide: DeleteTournamentUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new DeleteTournamentUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
    {
      provide: JoinTournamentUseCase,
      useFactory: (repo: ITournamentRepository) =>
        new JoinTournamentUseCase(repo),
      inject: [TOURNAMENT_REPOSITORY],
    },
  ],
})
export class TournamentModule {}
