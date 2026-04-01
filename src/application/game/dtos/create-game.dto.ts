import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  publisher!: string;

  @IsDateString()
  releaseDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  genre!: string;
}
