import { PlayerEntity } from './player.entity';

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export interface IPlayerRepository {
  findById(id: string): Promise<PlayerEntity | null>;
  findByEmail(email: string): Promise<PlayerEntity | null>;
  findByUsername(username: string): Promise<PlayerEntity | null>;
  findAll(): Promise<PlayerEntity[]>;
  save(player: PlayerEntity): Promise<PlayerEntity>;
}
