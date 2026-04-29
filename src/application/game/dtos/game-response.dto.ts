import { ApiProperty } from '@nestjs/swagger';

export class GameResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @ApiProperty({ example: 'Street Fighter 6' })
  name!: string;

  @ApiProperty({ example: 'Capcom' })
  publisher!: string;

  @ApiProperty({ example: '2023-06-02T00:00:00.000Z' })
  releaseDate!: Date;

  @ApiProperty({ example: 'Fighting' })
  genre!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}
