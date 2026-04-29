import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetMatchUseCase } from '../../application/match/use-cases/get-match.use-case';
import { ListTournamentMatchesUseCase } from '../../application/match/use-cases/list-tournament-matches.use-case';
import { SubmitMatchResultUseCase } from '../../application/match/use-cases/submit-match-result.use-case';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from '../../domain/match/match.repository.interface';
import {
  ITournamentEventsPort,
  TOURNAMENT_EVENTS,
} from '../../application/shared/ports/tournament-events.port';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { MatchTypeormEntity } from '../../infrastructure/repositories/match/match.typeorm-entity';
import { MatchTypeormRepository } from '../../infrastructure/repositories/match/match.typeorm-repository';
import { EventsModule } from '../events/events.module';
import { MatchController } from './match.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchTypeormEntity]),
    AuthInfrastructureModule,
    EventsModule,
  ],
  controllers: [MatchController],
  exports: [MATCH_REPOSITORY, ListTournamentMatchesUseCase],
  providers: [
    { provide: MATCH_REPOSITORY, useClass: MatchTypeormRepository },
    {
      provide: GetMatchUseCase,
      useFactory: (repo: IMatchRepository) => new GetMatchUseCase(repo),
      inject: [MATCH_REPOSITORY],
    },
    {
      provide: ListTournamentMatchesUseCase,
      useFactory: (repo: IMatchRepository) =>
        new ListTournamentMatchesUseCase(repo),
      inject: [MATCH_REPOSITORY],
    },
    {
      provide: SubmitMatchResultUseCase,
      useFactory: (repo: IMatchRepository, events: ITournamentEventsPort) =>
        new SubmitMatchResultUseCase(repo, events),
      inject: [MATCH_REPOSITORY, TOURNAMENT_EVENTS],
    },
  ],
})
export class MatchModule {}
