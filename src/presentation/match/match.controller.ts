import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MatchResultDto } from '../../application/match/dtos/match-result.dto';
import { MatchResponseDto } from '../../application/match/dtos/match-response.dto';
import { SubmitMatchResultUseCase } from '../../application/match/use-cases/submit-match-result.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { MatchMapper } from './mappers/match.mapper';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly submitMatchResultUseCase: SubmitMatchResultUseCase,
  ) {}

  @Post(':id/result')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async submitResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchResultDto,
  ): Promise<MatchResponseDto> {
    const match = await this.submitMatchResultUseCase.execute(
      id,
      dto.winnerId,
      dto.score,
    );
    return MatchMapper.toResponseDto(match);
  }
}
