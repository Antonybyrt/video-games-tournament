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

export class CreateTournamentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsUUID()
  gameId!: string;

  @IsInt()
  @Min(2)
  @Max(64)
  maxPlayers!: number;

  @IsDateString()
  startDate!: string;
}
