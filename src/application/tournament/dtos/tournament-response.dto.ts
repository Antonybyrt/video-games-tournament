import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TournamentResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @ApiProperty({ example: 'Summer Championship' })
  name!: string;

  @ApiProperty({ example: 'uuid-v4' })
  gameId!: string;

  @ApiProperty({ example: 8 })
  maxPlayers!: number;

  @ApiProperty({ example: '2025-07-01T00:00:00.000Z' })
  startDate!: Date;

  @ApiProperty({ enum: TournamentStatus, example: TournamentStatus.PENDING })
  status!: TournamentStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: 4 })
  playerCount?: number;
}
