import { TournamentStatus } from './tournament-status.enum';
import { TournamentEntity } from './tournament.entity';

export interface ITournamentRepository {
  findAll(status?: TournamentStatus): Promise<TournamentEntity[]>;
  findById(id: string): Promise<TournamentEntity | null>;
  findByIdWithPlayers(id: string): Promise<TournamentEntity | null>;
  findByPlayerId(playerId: string): Promise<TournamentEntity[]>;
  save(tournament: TournamentEntity): Promise<TournamentEntity>;
  delete(id: string): Promise<void>;
  countPlayers(tournamentId: string): Promise<number>;
  isPlayerEnrolled(tournamentId: string, playerId: string): Promise<boolean>;
  addPlayer(tournamentId: string, playerId: string): Promise<void>;
}

export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');
