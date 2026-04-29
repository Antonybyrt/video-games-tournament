import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { GetMatchUseCase } from './get-match.use-case';

const buildRepo = (): jest.Mocked<IMatchRepository> => ({
  findByTournamentId: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
});

const match = new MatchEntity(
  'm1',
  't1',
  'p1',
  'p2',
  MatchStatus.IN_PROGRESS,
  1,
  null,
  null,
);

describe('GetMatchUseCase', () => {
  it('returns the match when it exists', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(match);

    const result = await new GetMatchUseCase(repo).execute('m1');

    expect(result).toBe(match);
    expect(repo.findById).toHaveBeenCalledWith('m1');
  });

  it('throws NotFoundDomainException when the match does not exist', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(null);

    await expect(new GetMatchUseCase(repo).execute('missing')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });
});
