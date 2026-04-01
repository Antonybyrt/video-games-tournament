import { GameEntity } from './game.entity';

export interface IGameRepository {
  findAll(): Promise<GameEntity[]>;
  findById(id: string): Promise<GameEntity | null>;
  findByName(name: string): Promise<GameEntity | null>;
  save(game: GameEntity): Promise<GameEntity>;
}

export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');
