import { TournamentResponseDto } from '../../../application/tournament/dtos/tournament-response.dto';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';

export class TournamentMapper {
  static toResponseDto(tournament: TournamentEntity): TournamentResponseDto {
    const dto = new TournamentResponseDto();
    dto.id = tournament.id;
    dto.name = tournament.name;
    dto.gameId = tournament.gameId;
    dto.maxPlayers = tournament.maxPlayers;
    dto.startDate = tournament.startDate;
    dto.status = tournament.status;
    dto.createdAt = tournament.createdAt;
    dto.playerCount = tournament.players.length;
    return dto;
  }
}
