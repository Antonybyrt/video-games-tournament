import { MatchStatus } from '../../../domain/match/match-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @ApiProperty({ example: 'uuid-v4' })
  tournamentId!: string;

  @ApiProperty({ example: 'uuid-v4' })
  player1Id!: string;

  @ApiProperty({ example: 'uuid-v4' })
  player2Id!: string;

  @ApiProperty({ enum: MatchStatus, example: MatchStatus.PENDING })
  status!: MatchStatus;

  @ApiProperty({ example: 1 })
  round!: number;

  @ApiPropertyOptional({ example: '2:1' })
  score!: string | null;

  @ApiPropertyOptional({ example: 'uuid-v4' })
  winnerId!: string | null;
}
