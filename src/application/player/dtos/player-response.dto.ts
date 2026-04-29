import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayerResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @ApiProperty({ example: 'player1' })
  username!: string;

  @ApiProperty({ example: 'player1@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', nullable: true })
  avatar!: string | null;

  @ApiProperty({ example: false })
  isAdmin!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}
