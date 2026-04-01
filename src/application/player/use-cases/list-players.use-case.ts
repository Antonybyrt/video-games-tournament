import { PlayerEntity } from '../../../domain/player/player.entity';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';

export class ListPlayersUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  execute(): Promise<PlayerEntity[]> {
    return this.playerRepository.findAll();
  }
}
