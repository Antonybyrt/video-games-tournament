import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { JoinTournamentUseCase } from './join-tournament.use-case';

const buildRepo = (): jest.Mocked<ITournamentRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithPlayers: jest.fn(),
  findByPlayerId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  countPlayers: jest.fn(),
  isPlayerEnrolled: jest.fn(),
  addPlayer: jest.fn(),
});

const buildTournament = (
  overrides: Partial<{ status: TournamentStatus; maxPlayers: number }> = {},
) =>
  new TournamentEntity(
    'tournament-id',
    new Date(),
    'Tournament',
    'game-id',
    overrides.maxPlayers ?? 4,
    new Date('2025-12-31'),
    overrides.status ?? TournamentStatus.PENDING,
    [],
  );

describe('JoinTournamentUseCase', () => {
  let repo: jest.Mocked<ITournamentRepository>;
  let useCase: JoinTournamentUseCase;

  beforeEach(() => {
    repo = buildRepo();
    useCase = new JoinTournamentUseCase(repo);
  });

  it('throws NotFoundDomainException when tournament does not exist', async () => {
    repo.findByIdWithPlayers.mockResolvedValue(null);
    await expect(useCase.execute('t', 'p')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });

  it('throws ConflictDomainException when player is already enrolled', async () => {
    repo.findByIdWithPlayers.mockResolvedValue(buildTournament());
    repo.isPlayerEnrolled.mockResolvedValue(true);
    await expect(useCase.execute('t', 'p')).rejects.toBeInstanceOf(
      ConflictDomainException,
    );
    expect(repo.addPlayer).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleDomainException when tournament is full', async () => {
    repo.findByIdWithPlayers.mockResolvedValue(
      buildTournament({ maxPlayers: 2 }),
    );
    repo.isPlayerEnrolled.mockResolvedValue(false);
    repo.countPlayers.mockResolvedValue(2);
    await expect(useCase.execute('t', 'p')).rejects.toBeInstanceOf(
      BusinessRuleDomainException,
    );
  });

  it('throws BusinessRuleDomainException when tournament is not pending', async () => {
    repo.findByIdWithPlayers.mockResolvedValue(
      buildTournament({ status: TournamentStatus.IN_PROGRESS }),
    );
    repo.isPlayerEnrolled.mockResolvedValue(false);
    repo.countPlayers.mockResolvedValue(0);
    await expect(useCase.execute('t', 'p')).rejects.toBeInstanceOf(
      BusinessRuleDomainException,
    );
  });

  it('adds the player when tournament is open and not full', async () => {
    repo.findByIdWithPlayers.mockResolvedValue(buildTournament());
    repo.isPlayerEnrolled.mockResolvedValue(false);
    repo.countPlayers.mockResolvedValue(1);
    await useCase.execute('t', 'p');
    expect(repo.addPlayer).toHaveBeenCalledWith('t', 'p');
  });
});
