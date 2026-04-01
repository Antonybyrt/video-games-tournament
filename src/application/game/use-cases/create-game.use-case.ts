import { GameEntity } from '../../../domain/game/game.entity';
import { IGameRepository } from '../../../domain/game/game.repository.interface';
import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { CreateGameDto } from '../dtos/create-game.dto';

export class CreateGameUseCase {
  constructor(private readonly gameRepository: IGameRepository) {}

  async execute(dto: CreateGameDto): Promise<GameEntity> {
    const existing = await this.gameRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictDomainException('Game with this name already exists');
    }

    const game = new GameEntity(
      crypto.randomUUID(),
      new Date(),
      dto.name,
      dto.publisher,
      new Date(dto.releaseDate),
      dto.genre,
    );

    return this.gameRepository.save(game);
  }
}
