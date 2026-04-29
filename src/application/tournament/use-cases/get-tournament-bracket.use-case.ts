import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import {
  BracketMatchDto,
  BracketRoundDto,
  TournamentBracketDto,
} from '../dtos/tournament-bracket.dto';
import { MatchStatus } from '../../../domain/match/match-status.enum';

export class GetTournamentBracketUseCase {
  constructor(
    private readonly tournamentRepository: ITournamentRepository,
    private readonly matchRepository: IMatchRepository,
  ) {}

  async execute(tournamentId: string): Promise<TournamentBracketDto> {
    const tournament = await this.tournamentRepository.findById(tournamentId);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }

    const allMatches =
      await this.matchRepository.findByTournamentId(tournamentId);

    // Group matches by round and sort rounds ascending
    const roundMap = new Map<number, BracketMatchDto[]>();
    for (const match of allMatches) {
      const matchDto: BracketMatchDto = {
        id: match.id,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        isBye: match.player1Id === match.player2Id,
        status: match.status,
        score: match.score,
        winnerId: match.winnerId,
      };

      const existing = roundMap.get(match.round) ?? [];
      existing.push(matchDto);
      roundMap.set(match.round, existing);
    }

    const rounds: BracketRoundDto[] = [...roundMap.keys()]
      .sort((a, b) => a - b)
      .map((roundNumber) => ({
        round: roundNumber,
        matches: roundMap.get(roundNumber)!,
      }));

    // Determine the overall final winner:
    // It's the winner of the single match in the last round (if completed)
    let finalWinnerId: string | null = null;
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      const realMatches = lastRound.matches.filter((m) => !m.isBye);
      if (
        realMatches.length === 1 &&
        realMatches[0].status === MatchStatus.COMPLETED &&
        realMatches[0].winnerId !== null
      ) {
        finalWinnerId = realMatches[0].winnerId;
      }
    }

    return {
      tournamentId,
      totalRounds: rounds.length,
      rounds,
      finalWinnerId,
    };
  }
}
