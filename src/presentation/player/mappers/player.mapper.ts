import { PlayerEntity } from '../../../domain/player/player.entity';

export interface PlayerResponseDto {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: Date;
}

export class PlayerMapper {
  static toResponseDto(player: PlayerEntity): PlayerResponseDto {
    return {
      id: player.id,
      username: player.username,
      email: player.email,
      avatar: player.avatar,
      isAdmin: player.isAdmin,
      createdAt: player.createdAt,
    };
  }
}
