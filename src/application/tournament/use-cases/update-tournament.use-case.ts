import { buildRoundMatches } from '../../shared/helpers/bracket.helper';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';

export class UpdateTournamentUseCase {
  constructor(
    private readonly tournamentRepository: ITournamentRepository,
    private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateTournamentDto,
  ): Promise<TournamentEntity> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }

    if (dto.name !== undefined) tournament.name = dto.name;
    if (dto.gameId !== undefined) tournament.gameId = dto.gameId;
    if (dto.maxPlayers !== undefined) tournament.maxPlayers = dto.maxPlayers;
    if (dto.startDate !== undefined)
      tournament.startDate = new Date(dto.startDate);

    if (dto.status === TournamentStatus.IN_PROGRESS) {
      if (tournament.status !== TournamentStatus.PENDING) {
        throw new BusinessRuleDomainException(
          'Tournament must be in pending status to start',
        );
      }
      if (tournament.players.length < 2) {
        throw new BusinessRuleDomainException(
          'Tournament needs at least 2 players to start',
        );
      }
      tournament.start();
      await this.tournamentRepository.save(tournament);

      const playerIds = tournament.players.map((p) => p.id);
      const matches = buildRoundMatches(playerIds, 1, tournament.id);
      for (const match of matches) {
        await this.matchRepository.save(match);
      }

      return tournament;
    }

    if (dto.status === TournamentStatus.COMPLETED) {
      if (tournament.status !== TournamentStatus.IN_PROGRESS) {
        throw new BusinessRuleDomainException(
          'Tournament must be in in-progress status to complete',
        );
      }
      const allMatches = await this.matchRepository.findByTournamentId(id);

      // Every single match across all rounds must be completed
      const unresolved = allMatches.filter(
        (m) => m.status !== MatchStatus.COMPLETED,
      );
      if (unresolved.length > 0) {
        throw new BusinessRuleDomainException(
          `Cannot complete tournament: ${unresolved.length} match(es) are still unresolved`,
        );
      }

      // The final round must have exactly 1 winner
      if (allMatches.length > 0) {
        const lastRound = Math.max(...allMatches.map((m) => m.round));
        const lastRoundMatches = allMatches.filter(
          (m) => m.round === lastRound,
        );
        const winners = lastRoundMatches
          .map((m) => m.winnerId)
          .filter((id): id is string => id !== null);
        if (winners.length !== 1) {
          throw new BusinessRuleDomainException(
            `Cannot complete tournament: expected 1 final winner, found ${winners.length}`,
          );
        }
      }
      tournament.complete();
    }

    return this.tournamentRepository.save(tournament);
  }
}
