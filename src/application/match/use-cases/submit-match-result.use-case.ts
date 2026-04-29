import { buildRoundMatches } from '../../shared/helpers/bracket.helper';
import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { ITournamentEventsPort } from '../../shared/ports/tournament-events.port';
import { BusinessRuleDomainException } from '@domain/shared/exceptions/business-rule.exception';

export class SubmitMatchResultUseCase {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly events?: ITournamentEventsPort,
  ) {}

  async execute(
    matchId: string,
    winnerId: string,
    score: string,
  ): Promise<MatchEntity> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new NotFoundDomainException('Match not found');
    }
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BusinessRuleDomainException(
        'Match must be in in-progress status to submit result',
      );
    }
    match.submitResult(winnerId, score);
    const saved = await this.matchRepository.save(match);

    this.events?.notifyMatchUpdated(saved.tournamentId, {
      id: saved.id,
      round: saved.round,
      status: saved.status,
      winnerId: saved.winnerId,
      score: saved.score,
    });

    await this.advanceBracketIfRoundComplete(saved);

    return saved;
  }

  private async advanceBracketIfRoundComplete(
    submitted: MatchEntity,
  ): Promise<void> {
    const allMatches = await this.matchRepository.findByTournamentId(
      submitted.tournamentId,
    );

    const roundMatches = allMatches.filter((m) => m.round === submitted.round);
    const realMatches = roundMatches.filter((m) => m.player1Id !== m.player2Id);
    const byeMatches = roundMatches.filter((m) => m.player1Id === m.player2Id);

    const allRealDone = realMatches.every(
      (m) => m.status === MatchStatus.COMPLETED,
    );
    if (!allRealDone) return;

    for (const bye of byeMatches) {
      if (bye.status === MatchStatus.PENDING) {
        bye.status = MatchStatus.COMPLETED;
        bye.winnerId = bye.player1Id;
        bye.score = '0:0';
        await this.matchRepository.save(bye);
      }
    }

    const winners = roundMatches
      .map(
        (m) => m.winnerId ?? (m.player1Id === m.player2Id ? m.player1Id : null),
      )
      .filter((id): id is string => id !== null);

    if (winners.length > 1) {
      const nextMatches = buildRoundMatches(
        winners,
        submitted.round + 1,
        submitted.tournamentId,
      );
      for (const m of nextMatches) {
        await this.matchRepository.save(m);
      }
    }
  }
}
