import { PlayerEntity } from '../../../domain/player/player.entity';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { DeletePlayerUseCase } from './delete-player.use-case';

const buildPlayerRepo = (): jest.Mocked<IPlayerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  findStats: jest.fn(),
  findRankings: jest.fn(),
  delete: jest.fn(),
});

const buildTournamentRepo = (): jest.Mocked<ITournamentRepository> => ({
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

const player = new PlayerEntity(
  'p1',
  new Date(),
  'user',
  'u@test.com',
  'pw',
  null,
  false,
);

const buildTournament = (status: TournamentStatus) =>
  new TournamentEntity(
    't1',
    new Date(),
    'Tour',
    'g1',
    8,
    new Date(),
    status,
    [],
  );

describe('DeletePlayerUseCase', () => {
  let playerRepo: jest.Mocked<IPlayerRepository>;
  let tournamentRepo: jest.Mocked<ITournamentRepository>;
  let useCase: DeletePlayerUseCase;

  beforeEach(() => {
    playerRepo = buildPlayerRepo();
    tournamentRepo = buildTournamentRepo();
    playerRepo.delete.mockResolvedValue(undefined);
    useCase = new DeletePlayerUseCase(playerRepo, tournamentRepo);
  });

  it('throws NotFoundDomainException when the player does not exist', async () => {
    playerRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('p1')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
    expect(playerRepo.delete).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleDomainException when the player is in a PENDING tournament', async () => {
    playerRepo.findById.mockResolvedValue(player);
    tournamentRepo.findByPlayerId.mockResolvedValue([
      buildTournament(TournamentStatus.PENDING),
    ]);
    await expect(useCase.execute('p1')).rejects.toBeInstanceOf(
      BusinessRuleDomainException,
    );
    expect(playerRepo.delete).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleDomainException when the player is in an IN_PROGRESS tournament', async () => {
    playerRepo.findById.mockResolvedValue(player);
    tournamentRepo.findByPlayerId.mockResolvedValue([
      buildTournament(TournamentStatus.IN_PROGRESS),
    ]);
    await expect(useCase.execute('p1')).rejects.toBeInstanceOf(
      BusinessRuleDomainException,
    );
    expect(playerRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes the player when all their tournaments are COMPLETED', async () => {
    playerRepo.findById.mockResolvedValue(player);
    tournamentRepo.findByPlayerId.mockResolvedValue([
      buildTournament(TournamentStatus.COMPLETED),
    ]);
    await useCase.execute('p1');
    expect(playerRepo.delete).toHaveBeenCalledWith('p1');
  });

  it('deletes the player when they have no tournaments', async () => {
    playerRepo.findById.mockResolvedValue(player);
    tournamentRepo.findByPlayerId.mockResolvedValue([]);
    await useCase.execute('p1');
    expect(playerRepo.delete).toHaveBeenCalledWith('p1');
  });
});
