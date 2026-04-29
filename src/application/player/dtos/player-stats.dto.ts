import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  playerId!: string;

  @ApiProperty({ example: 12 })
  totalMatches!: number;

  @ApiProperty({ example: 8 })
  wins!: number;

  @ApiProperty({ example: 4 })
  losses!: number;

  @ApiProperty({
    example: 0.6667,
    description: 'Wins divided by total matches',
  })
  winRate!: number;
}
