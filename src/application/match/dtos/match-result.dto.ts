import { IsString, IsUUID, Matches } from 'class-validator';

export class MatchResultDto {
  @IsUUID()
  winnerId!: string;

  @Matches(/^\d+:\d+$/, { message: 'Score must be in format "X:Y"' })
  score!: string;
}
