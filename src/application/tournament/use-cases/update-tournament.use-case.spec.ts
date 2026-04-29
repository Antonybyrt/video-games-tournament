import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';
import { UpdateTournamentUseCase } from './update-tournament.use-case';

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

const buildMatchRepo = (): jest.Mocked<IMatchRepository> => ({
  findByTournamentId: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
});

const buildPlayer = (id: string) =>
  new PlayerEntity(id, new Date(), `u_${id}`, `${id}@test.com`, 'pw', null, false);

const buildTournament = (
  playerIds: string[],
  status = TournamentStatus.PENDING,
) =>
  new TournamentEntity(
    't1',
    new Date(),
    'Tour',
    'g1',
    8,
    new Date(),
    status,
    playerIds.map(buildPlayer),
  );

describe('UpdateTournamentUseCase', () => {
  let tRepo: jest.Mocked<ITournamentRepository>;
  let mRepo: jest.Mocked<IMatchRepository>;
  let useCase: UpdateTournamentUseCase;

  beforeEach(() => {
    tRepo = buildTournamentRepo();
    mRepo = buildMatchRepo();
    tRepo.save.mockImplementation(async (t) => t);
    mRepo.save.mockImplementation(async (m) => m);
    useCase = new UpdateTournamentUseCase(tRepo, mRepo);
  });

  it('throws NotFoundDomainException when the tournament does not exist', async () => {
    tRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('t1', {})).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });

  describe('transition to IN_PROGRESS', () => {
    const dto: UpdateTournamentDto = { status: TournamentStatus.IN_PROGRESS };

    it('throws BusinessRuleDomainException when fewer than 2 players are enrolled', async () => {
      tRepo.findById.mockResolvedValue(buildTournament(['p1']));
      await expect(useCase.execute('t1', dto)).rejects.toBeInstanceOf(
        BusinessRuleDomainException,
      );
      expect(mRepo.save).not.toHaveBeenCalled();
    });

    it('sets status to IN_PROGRESS and saves the tournament', async () => {
      const tournament = buildTournament(['p1', 'p2', 'p3', 'p4']);
      tRepo.findById.mockResolvedValue(tournament);

      await useCase.execute('t1', dto);

      expect(tournament.status).toBe(TournamentStatus.IN_PROGRESS);
      expect(tRepo.save).toHaveBeenCalledWith(tournament);
    });

    it('creates pair-wise round 1 matches for an even player count', async () => {
      tRepo.findById.mockResolvedValue(buildTournament(['p1', 'p2', 'p3', 'p4']));

      await useCase.execute('t1', dto);

      expect(mRepo.save).toHaveBeenCalledTimes(2);
      const saved = mRepo.save.mock.calls.map(([m]) => m);
      expect(saved.every((m) => m.round === 1)).toBe(true);
      expect(saved[0].player1Id).toBe('p1');
      expect(saved[0].player2Id).toBe('p2');
      expect(saved[1].player1Id).toBe('p3');
      expect(saved[1].player2Id).toBe('p4');
    });

    it('creates a PENDING bye match for the leftover player when count is odd', async () => {
      tRepo.findById.mockResolvedValue(buildTournament(['p1', 'p2', 'p3']));

      await useCase.execute('t1', dto);

      const saved = mRepo.save.mock.calls.map(([m]) => m);
      expect(saved).toHaveLength(2);
      const bye = saved.find((m) => m.player1Id === m.player2Id);
      expect(bye).toBeDefined();
      expect(bye?.player1Id).toBe('p3');
      expect(bye?.status).toBe(MatchStatus.PENDING);
    });
  });

  describe('transition to COMPLETED', () => {
    const dto: UpdateTournamentDto = { status: TournamentStatus.COMPLETED };

    it('throws BusinessRuleDomainException when a PENDING match remains in the last round', async () => {
      tRepo.findById.mockResolvedValue(
        buildTournament(['p1', 'p2'], TournamentStatus.IN_PROGRESS),
      );
      mRepo.findByTournamentId.mockResolvedValue([
        new MatchEntity('m1', 't1', 'p1', 'p2', MatchStatus.PENDING, 1, null, null),
      ]);

      await expect(useCase.execute('t1', dto)).rejects.toBeInstanceOf(
        BusinessRuleDomainException,
      );
    });

    it('throws BusinessRuleDomainException when an IN_PROGRESS match remains in the last round', async () => {
      tRepo.findById.mockResolvedValue(
        buildTournament(['p1', 'p2'], TournamentStatus.IN_PROGRESS),
      );
      mRepo.findByTournamentId.mockResolvedValue([
        new MatchEntity('m1', 't1', 'p1', 'p2', MatchStatus.IN_PROGRESS, 1, null, null),
      ]);

      await expect(useCase.execute('t1', dto)).rejects.toBeInstanceOf(
        BusinessRuleDomainException,
      );
    });

    it('only checks the last round — earlier pending rounds do not block completion', async () => {
      const tournament = buildTournament(['p1', 'p2'], TournamentStatus.IN_PROGRESS);
      tRepo.findById.mockResolvedValue(tournament);
      mRepo.findByTournamentId.mockResolvedValue([
        new MatchEntity('m1', 't1', 'p1', 'p2', MatchStatus.PENDING, 1, null, null),
        new MatchEntity('m2', 't1', 'p1', 'p3', MatchStatus.COMPLETED, 2, '2:0', 'p1'),
      ]);

      await useCase.execute('t1', dto);

      expect(tournament.status).toBe(TournamentStatus.COMPLETED);
    });

    it('throws BusinessRuleDomainException when multiple winners remain in the last round', async () => {
      tRepo.findById.mockResolvedValue(
        buildTournament(['p1', 'p2', 'p3', 'p4'], TournamentStatus.IN_PROGRESS),
      );
      mRepo.findByTournamentId.mockResolvedValue([
        new MatchEntity('m1', 't1', 'p1', 'p2', MatchStatus.COMPLETED, 1, '2:0', 'p1'),
        new MatchEntity('m2', 't1', 'p3', 'p4', MatchStatus.COMPLETED, 1, '2:0', 'p3'),
      ]);

      await expect(useCase.execute('t1', dto)).rejects.toBeInstanceOf(
        BusinessRuleDomainException,
      );
    });

    it('sets status to COMPLETED and saves when all last-round matches are done', async () => {
      const tournament = buildTournament(['p1', 'p2'], TournamentStatus.IN_PROGRESS);
      tRepo.findById.mockResolvedValue(tournament);
      mRepo.findByTournamentId.mockResolvedValue([
        new MatchEntity('m1', 't1', 'p1', 'p2', MatchStatus.COMPLETED, 1, '2:0', 'p1'),
      ]);

      await useCase.execute('t1', dto);

      expect(tournament.status).toBe(TournamentStatus.COMPLETED);
      expect(tRepo.save).toHaveBeenCalledWith(tournament);
    });
  });
});
