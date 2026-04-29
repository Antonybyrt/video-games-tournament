import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MatchResultDto } from '../../application/match/dtos/match-result.dto';
import { MatchResponseDto } from '../../application/match/dtos/match-response.dto';
import { GetMatchUseCase } from '../../application/match/use-cases/get-match.use-case';
import { SubmitMatchResultUseCase } from '../../application/match/use-cases/submit-match-result.use-case';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { MatchMapper } from './mappers/match.mapper';

@Controller('matches')
export class MatchController {
  constructor(
    private readonly getMatchUseCase: GetMatchUseCase,
    private readonly submitMatchResultUseCase: SubmitMatchResultUseCase,
  ) {}

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchResponseDto> {
    const match = await this.getMatchUseCase.execute(id);
    return MatchMapper.toResponseDto(match);
  }

  @Post(':id/result')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
