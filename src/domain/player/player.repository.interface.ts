import { PlayerEntity } from './player.entity';

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export interface PlayerStats {
  wins: number;
  totalMatches: number;
}

export interface PlayerRankingRow {
  player: PlayerEntity;
  wins: number;
  totalMatches: number;
}

export interface IPlayerRepository {
  findById(id: string): Promise<PlayerEntity | null>;
  findByEmail(email: string): Promise<PlayerEntity | null>;
  findByUsername(username: string): Promise<PlayerEntity | null>;
  findAll(): Promise<PlayerEntity[]>;
  save(player: PlayerEntity): Promise<PlayerEntity>;
  findStats(playerId: string): Promise<PlayerStats>;
  findRankings(): Promise<PlayerRankingRow[]>;
  delete(id: string): Promise<void>;
}
