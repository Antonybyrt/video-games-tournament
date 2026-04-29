import { MatchStatus } from '../../../domain/match/match-status.enum';
import { buildRoundMatches } from './bracket.helper';

describe('buildRoundMatches', () => {
  it('pairs players sequentially for an even count', () => {
    const matches = buildRoundMatches(['p1', 'p2', 'p3', 'p4'], 1, 't1');

    expect(matches).toHaveLength(2);
    expect(matches[0].player1Id).toBe('p1');
    expect(matches[0].player2Id).toBe('p2');
    expect(matches[1].player1Id).toBe('p3');
    expect(matches[1].player2Id).toBe('p4');
  });

  it('assigns the correct round and tournamentId to every match', () => {
    const matches = buildRoundMatches(['p1', 'p2'], 3, 'tournament-42');

    expect(matches.every((m) => m.round === 3)).toBe(true);
    expect(matches.every((m) => m.tournamentId === 'tournament-42')).toBe(true);
  });

  it('produces no bye match when the player count is even', () => {
    const matches = buildRoundMatches(['p1', 'p2', 'p3', 'p4'], 1, 't1');
    const byes = matches.filter((m) => m.player1Id === m.player2Id);
    expect(byes).toHaveLength(0);
  });

  it('appends a bye match for the leftover player when the count is odd', () => {
    const matches = buildRoundMatches(['p1', 'p2', 'p3'], 1, 't1');

    expect(matches).toHaveLength(2);
    const bye = matches.find((m) => m.player1Id === m.player2Id);
    expect(bye).toBeDefined();
    expect(bye?.player1Id).toBe('p3');
    expect(bye?.status).toBe(MatchStatus.PENDING);
  });

  it('creates a single bye match for a lone player', () => {
    const matches = buildRoundMatches(['p1'], 1, 't1');

    expect(matches).toHaveLength(1);
    expect(matches[0].player1Id).toBe('p1');
    expect(matches[0].player2Id).toBe('p1');
    expect(matches[0].status).toBe(MatchStatus.PENDING);
  });

  it('returns an empty array when given no players', () => {
    const matches = buildRoundMatches([], 1, 't1');
    expect(matches).toHaveLength(0);
  });
});
