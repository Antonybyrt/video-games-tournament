import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty({ example: 'Street Fighter 6' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'Capcom' })
  @IsString()
  @MinLength(1)
  publisher!: string;

  @ApiProperty({ example: '2023-06-02' })
  @IsDateString()
  releaseDate!: string;

  @ApiProperty({ example: 'Fighting' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  genre!: string;
}
