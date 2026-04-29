import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';

export const TOURNAMENT_EVENTS = Symbol('TOURNAMENT_EVENTS');

export interface ITournamentEventsPort {
  notifyStatusChanged(tournamentId: string, status: TournamentStatus): void;
  notifyMatchUpdated(
    tournamentId: string,
    match: {
      id: string;
      round: number;
      status: string;
      winnerId: string | null;
      score: string | null;
    },
  ): void;
}
