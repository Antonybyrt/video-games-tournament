import { randomUUID } from 'crypto';
import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';

export function buildRoundMatches(
  playerIds: string[],
  round: number,
  tournamentId: string,
): MatchEntity[] {
  const matches: MatchEntity[] = [];

  for (let i = 0; i + 1 < playerIds.length; i += 2) {
    matches.push(
      new MatchEntity(
        randomUUID(),
        tournamentId,
        playerIds[i],
        playerIds[i + 1],
        MatchStatus.IN_PROGRESS,
        round,
        null,
        null,
      ),
    );
  }

  if (playerIds.length % 2 !== 0) {
    const bye = playerIds[playerIds.length - 1];
    matches.push(
      new MatchEntity(
        randomUUID(),
        tournamentId,
        bye,
        bye,
        MatchStatus.PENDING,
        round,
        null,
        null,
      ),
    );
  }

  return matches;
}
