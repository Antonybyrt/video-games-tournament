import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'player1@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password1' })
  @IsString()
  @MinLength(1)
  password!: string;
}
