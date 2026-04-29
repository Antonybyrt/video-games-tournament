import { randomUUID } from 'crypto';
import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { ITournamentEventsPort } from '../../shared/ports/tournament-events.port';

export class StartTournamentUseCase {
  constructor(
    private readonly tournamentRepository: ITournamentRepository,
    private readonly matchRepository: IMatchRepository,
    private readonly events?: ITournamentEventsPort,
  ) {}

  async execute(tournamentId: string): Promise<MatchEntity[]> {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) throw new NotFoundDomainException('Tournament not found');

    const allMatches =
      await this.matchRepository.findByTournamentId(tournamentId);

    if (allMatches.length === 0) {
      tournament.start();
      await this.tournamentRepository.save(tournament);
      this.events?.notifyStatusChanged(tournament.id, tournament.status);
      const playerIds = tournament.players.map((p) => p.id);
      return this.generateRound(playerIds, 1, tournamentId);
    }

    const currentRound = Math.max(...allMatches.map((m) => m.round));
    const currentRoundMatches = allMatches.filter(
      (m) => m.round === currentRound,
    );

    const hasPending = currentRoundMatches.some(
      (m) => m.status === MatchStatus.PENDING,
    );
    if (hasPending) {
      throw new BusinessRuleDomainException(
        'All matches in the current round must be completed before advancing',
      );
    }

    const winners = currentRoundMatches
      .map((m) => m.winnerId)
      .filter((id): id is string => id !== null);

    if (winners.length === 1) {
      tournament.complete();
      await this.tournamentRepository.save(tournament);
      this.events?.notifyStatusChanged(tournament.id, tournament.status);
      return [];
    }

    return this.generateRound(winners, currentRound + 1, tournamentId);
  }

  private async generateRound(
    playerIds: string[],
    round: number,
    tournamentId: string,
  ): Promise<MatchEntity[]> {
    const created: MatchEntity[] = [];

    for (let i = 0; i + 1 < playerIds.length; i += 2) {
      const match = new MatchEntity(
        randomUUID(),
        tournamentId,
        playerIds[i],
        playerIds[i + 1],
        MatchStatus.PENDING,
        round,
        null,
        null,
      );
      created.push(await this.matchRepository.save(match));
    }

    if (playerIds.length % 2 !== 0) {
      const byePlayer = playerIds[playerIds.length - 1];
      const bye = new MatchEntity(
        randomUUID(),
        tournamentId,
        byePlayer,
        byePlayer,
        MatchStatus.COMPLETED,
        round,
        'bye',
        byePlayer,
      );
      created.push(await this.matchRepository.save(bye));
    }

    return created;
  }
}
