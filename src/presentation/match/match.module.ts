import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListTournamentMatchesUseCase } from '../../application/match/use-cases/list-tournament-matches.use-case';
import { SubmitMatchResultUseCase } from '../../application/match/use-cases/submit-match-result.use-case';
import {
  IMatchRepository,
  MATCH_REPOSITORY,
} from '../../domain/match/match.repository.interface';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { MatchTypeormEntity } from '../../infrastructure/repositories/match/match.typeorm-entity';
import { MatchTypeormRepository } from '../../infrastructure/repositories/match/match.typeorm-repository';
import { MatchController } from './match.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchTypeormEntity]),
    AuthInfrastructureModule,
  ],
  controllers: [MatchController],
  exports: [MATCH_REPOSITORY, ListTournamentMatchesUseCase],
  providers: [
    { provide: MATCH_REPOSITORY, useClass: MatchTypeormRepository },
    {
      provide: ListTournamentMatchesUseCase,
      useFactory: (repo: IMatchRepository) =>
        new ListTournamentMatchesUseCase(repo),
      inject: [MATCH_REPOSITORY],
    },
    {
      provide: SubmitMatchResultUseCase,
      useFactory: (repo: IMatchRepository) =>
        new SubmitMatchResultUseCase(repo),
      inject: [MATCH_REPOSITORY],
    },
  ],
})
export class MatchModule {}
