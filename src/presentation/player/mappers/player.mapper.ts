import { PlayerResponseDto } from '../../../application/player/dtos/player-response.dto';
import { PlayerEntity } from '../../../domain/player/player.entity';

export class PlayerMapper {
  static toResponseDto(player: PlayerEntity): PlayerResponseDto {
    const dto = new PlayerResponseDto();
    dto.id = player.id;
    dto.username = player.username;
    dto.email = player.email;
    dto.avatar = player.avatar;
    dto.isAdmin = player.isAdmin;
    dto.createdAt = player.createdAt;
    return dto;
  }
}
