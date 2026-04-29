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

const buildMatch = () =>
  new MatchEntity(
    'match-1',
    't',
    'p1',
    'p2',
    MatchStatus.PENDING,
    1,
    null,
    null,
  );

describe('SubmitMatchResultUseCase', () => {
  let repo: jest.Mocked<IMatchRepository>;
  let useCase: SubmitMatchResultUseCase;

  beforeEach(() => {
    repo = buildRepo();
    repo.save.mockImplementation(async (m) => m);
    useCase = new SubmitMatchResultUseCase(repo);
  });

  it('throws NotFoundDomainException when the match is missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('m', 'p1', '2:1')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });

  it('throws when winnerId is not one of the participants', async () => {
    repo.findById.mockResolvedValue(buildMatch());
    await expect(
      useCase.execute('match-1', 'stranger', '2:1'),
    ).rejects.toBeInstanceOf(BusinessRuleDomainException);
  });

  it('marks the match completed and persists it', async () => {
    repo.findById.mockResolvedValue(buildMatch());
    const result = await useCase.execute('match-1', 'p1', '2:1');
    expect(result.winnerId).toBe('p1');
    expect(result.score).toBe('2:1');
    expect(result.status).toBe(MatchStatus.COMPLETED);
    expect(repo.save).toHaveBeenCalled();
  });
});
