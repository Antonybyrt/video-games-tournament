import { MatchEntity } from './match.entity';

export interface IMatchRepository {
  findByTournamentId(tournamentId: string): Promise<MatchEntity[]>;
  findById(id: string): Promise<MatchEntity | null>;
  save(match: MatchEntity): Promise<MatchEntity>;
}

export const MATCH_REPOSITORY = Symbol('MATCH_REPOSITORY');
