import { Module } from '@nestjs/common';
import { TOURNAMENT_EVENTS } from '../../application/shared/ports/tournament-events.port';
import { TournamentGateway } from '../tournament/tournament.gateway';

@Module({
  providers: [
    TournamentGateway,
    { provide: TOURNAMENT_EVENTS, useExisting: TournamentGateway },
  ],
  exports: [TOURNAMENT_EVENTS],
})
export class EventsModule {}
