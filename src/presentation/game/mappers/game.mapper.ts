import { GameEntity } from '../../../domain/game/game.entity';
import { GameResponseDto } from '../../../application/game/dtos/game-response.dto';

export class GameMapper {
  static toResponseDto(game: GameEntity): GameResponseDto {
    const dto = new GameResponseDto();
    dto.id = game.id;
    dto.name = game.name;
    dto.publisher = game.publisher;
    dto.releaseDate = game.releaseDate;
    dto.genre = game.genre;
    dto.createdAt = game.createdAt;
    return dto;
  }
}
