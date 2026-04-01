import { GameEntity } from '../../../domain/game/game.entity';
import { IGameRepository } from '../../../domain/game/game.repository.interface';

export class ListGamesUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  execute(): Promise<GameEntity[]> {
    return this.gameRepository.findAll();
  }
}
