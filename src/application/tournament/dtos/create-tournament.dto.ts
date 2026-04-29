import {
  IsDateString,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty({ example: 'Summer Championship' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'uuid-v4' })
  @IsUUID()
  gameId!: string;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(2)
  @Max(64)
  maxPlayers!: number;

  @ApiProperty({ example: '2025-07-01' })
  @IsDateString()
  startDate!: string;
}
