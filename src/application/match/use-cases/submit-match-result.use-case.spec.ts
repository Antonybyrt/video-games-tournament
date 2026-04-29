import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { SubmitMatchResultUseCase } from './submit-match-result.use-case';

const buildRepo = (): jest.Mocked<IMatchRepository> => ({
  findByTournamentId: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
});

const makeMatch = (
  id: string,
  p1: string,
  p2: string,
  status: MatchStatus,
  round: number,
  winnerId: string | null = null,
  score: string | null = null,
) => new MatchEntity(id, 't', p1, p2, status, round, score, winnerId);

describe('SubmitMatchResultUseCase', () => {
  let repo: jest.Mocked<IMatchRepository>;
  let useCase: SubmitMatchResultUseCase;

  beforeEach(() => {
    repo = buildRepo();
    repo.save.mockImplementation(async (m) => m);
    useCase = new SubmitMatchResultUseCase(repo);
  });

  it('throws NotFoundDomainException when the match does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('m', 'p1', '2:1')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });

  it('throws BusinessRuleDomainException when the winner is not a participant', async () => {
    repo.findById.mockResolvedValue(
      makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1),
    );
    await expect(
      useCase.execute('m1', 'stranger', '2:1'),
    ).rejects.toBeInstanceOf(BusinessRuleDomainException);
  });

  it('marks the match COMPLETED and persists it', async () => {
    const match = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
    repo.findById.mockResolvedValue(match);
    repo.findByTournamentId.mockResolvedValue([match]);

    const result = await useCase.execute('m1', 'p1', '2:1');

    expect(result.winnerId).toBe('p1');
    expect(result.score).toBe('2:1');
    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(repo.save).toHaveBeenCalled();
  });

  describe('bracket auto-advancement', () => {
    it('does not create a next round when the submitted match is the only one remaining', async () => {
      const match = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
      repo.findById.mockResolvedValue(match);
      repo.findByTournamentId.mockResolvedValue([match]);

      await useCase.execute('m1', 'p1', '2:1');

      // only 1 save: the submitted match — no new-round matches
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('creates round 2 matches when all real matches in round 1 complete', async () => {
      const m1 = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
      const m2 = makeMatch(
        'm2',
        'p3',
        'p4',
        MatchStatus.COMPLETED,
        1,
        'p3',
        '2:0',
      );
      repo.findById.mockResolvedValue(m1);
      // Return both matches after m1 is submitted (m1 becomes COMPLETED via submitResult)
      repo.findByTournamentId.mockImplementation(async () => [
        makeMatch('m1', 'p1', 'p2', MatchStatus.COMPLETED, 1, 'p1', '2:1'),
        m2,
      ]);

      await useCase.execute('m1', 'p1', '2:1');

      // save calls: m1 (submitted) + 1 new round-2 match
      expect(repo.save).toHaveBeenCalledTimes(2);
      const lastSave = repo.save.mock.calls[1][0];
      expect(lastSave.round).toBe(2);
      expect([lastSave.player1Id, lastSave.player2Id].sort()).toEqual([
        'p1',
        'p3',
      ]);
    });

    it('does not advance when some real matches in the round are still pending', async () => {
      const m1 = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
      const m2 = makeMatch('m2', 'p3', 'p4', MatchStatus.IN_PROGRESS, 1);
      repo.findById.mockResolvedValue(m1);
      repo.findByTournamentId.mockResolvedValue([
        makeMatch('m1', 'p1', 'p2', MatchStatus.COMPLETED, 1, 'p1', '2:1'),
        m2,
      ]);

      await useCase.execute('m1', 'p1', '2:1');

      // only the submitted match is saved
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('does not advance when the first of four round matches is resolved (1 winner so far, round incomplete)', async () => {
      // 8-player round: 4 real matches, only the first one is submitted
      const m1 = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
      repo.findById.mockResolvedValue(m1);
      repo.findByTournamentId.mockResolvedValue([
        makeMatch('m1', 'p1', 'p2', MatchStatus.COMPLETED, 1, 'p1', '2:1'),
        makeMatch('m2', 'p3', 'p4', MatchStatus.IN_PROGRESS, 1),
        makeMatch('m3', 'p5', 'p6', MatchStatus.IN_PROGRESS, 1),
        makeMatch('m4', 'p7', 'p8', MatchStatus.IN_PROGRESS, 1),
      ]);

      await useCase.execute('m1', 'p1', '2:1');

      // No round-2 match should be created — the round has 3 unresolved matches remaining
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('auto-completes a bye match and generates round 2 when all real matches are done', async () => {
      const real = makeMatch('m1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1);
      const bye = makeMatch('bye', 'p3', 'p3', MatchStatus.PENDING, 1);
      repo.findById.mockResolvedValue(real);
      repo.findByTournamentId.mockImplementation(async () => [
        makeMatch('m1', 'p1', 'p2', MatchStatus.COMPLETED, 1, 'p1', '2:0'),
        bye,
      ]);

      await useCase.execute('m1', 'p1', '2:0');

      const saves = repo.save.mock.calls.map(([m]) => m);
      // save 1: submitted real match
      // save 2: auto-completed bye
      // save 3: new round-2 match (p1 vs p3)
      expect(saves).toHaveLength(3);
      const completedBye = saves.find((m) => m.player1Id === m.player2Id);
      expect(completedBye?.status).toBe(MatchStatus.COMPLETED);
      expect(completedBye?.winnerId).toBe('p3');
      expect(completedBye?.score).toBe('bye');
      const nextRound = saves.find((m) => m.round === 2);
      expect(nextRound).toBeDefined();
    });
  });
});
