import { PlayerEntity } from '../../../domain/player/player.entity';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';

export class GetPlayerUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(id: string): Promise<PlayerEntity> {
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new NotFoundDomainException('Player not found');
    }
    return player;
  }
}
