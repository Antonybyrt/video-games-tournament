import { MatchResponseDto } from '../../../application/match/dtos/match-response.dto';
import { MatchEntity } from '../../../domain/match/match.entity';

export class MatchMapper {
  static toResponseDto(match: MatchEntity): MatchResponseDto {
    const dto = new MatchResponseDto();
    dto.id = match.id;
    dto.tournamentId = match.tournamentId;
    dto.player1Id = match.player1Id;
    dto.player2Id = match.player2Id;
    dto.status = match.status;
    dto.round = match.round;
    dto.score = match.score;
    dto.winnerId = match.winnerId;
    return dto;
  }
}
