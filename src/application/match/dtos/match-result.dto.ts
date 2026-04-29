import { IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MatchResultDto {
  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  winnerId!: string;

  @ApiProperty({ example: '2:1' })
  @Matches(/^\d+:\d+$/, { message: 'Score must be in format "X:Y"' })
  score!: string;
}
