import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '../../../domain/match/match-status.enum';

export class BracketMatchDto {
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @ApiProperty({ example: 'uuid-v4' })
  player1Id!: string;

  @ApiProperty({ example: 'uuid-v4' })
  player2Id!: string;

  /** true when player1Id === player2Id (automatic bye advancement) */
  @ApiProperty({ example: false })
  isBye!: boolean;

  @ApiProperty({ enum: MatchStatus, example: MatchStatus.IN_PROGRESS })
  status!: MatchStatus;

  @ApiPropertyOptional({ example: '3:1' })
  score!: string | null;

  @ApiPropertyOptional({
    example: 'uuid-v4',
    description: 'ID of the winning player, null if not yet decided',
  })
  winnerId!: string | null;
}

export class BracketRoundDto {
  @ApiProperty({ example: 1, description: 'Round number (1 = first round)' })
  round!: number;

  @ApiProperty({ type: [BracketMatchDto] })
  matches!: BracketMatchDto[];
}

export class TournamentBracketDto {
  @ApiProperty({ example: 'uuid-v4' })
  tournamentId!: string;

  @ApiProperty({
    example: 3,
    description: 'Total number of rounds generated so far',
  })
  totalRounds!: number;

  @ApiProperty({
    type: [BracketRoundDto],
    description: 'Rounds ordered from first to last',
  })
  rounds!: BracketRoundDto[];

  @ApiPropertyOptional({
    example: 'uuid-v4',
    description:
      'ID of the final winner (only set when tournament is completed)',
  })
  finalWinnerId!: string | null;
}
