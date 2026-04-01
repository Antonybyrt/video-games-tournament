import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID()
  gameId?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(64)
  maxPlayers?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
