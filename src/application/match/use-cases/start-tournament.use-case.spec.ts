import { MatchEntity } from '../../../domain/match/match.entity';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { StartTournamentUseCase } from './start-tournament.use-case';

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
  new PlayerEntity(
    id,
    new Date(),
    `u_${id}`,
    `${id}@example.com`,
    'pw',
    null,
    false,
  );

const buildTournament = (playerIds: string[]) =>
  new TournamentEntity(
    'tournament-id',
    new Date(),
    'Tournament',
    'game-id',
    8,
    new Date('2025-12-31'),
    TournamentStatus.PENDING,
    playerIds.map(buildPlayer),
  );

describe('StartTournamentUseCase', () => {
  let tRepo: jest.Mocked<ITournamentRepository>;
  let mRepo: jest.Mocked<IMatchRepository>;
  let useCase: StartTournamentUseCase;

  beforeEach(() => {
    tRepo = buildTournamentRepo();
    mRepo = buildMatchRepo();
    mRepo.save.mockImplementation(async (m) => m);
    useCase = new StartTournamentUseCase(tRepo, mRepo);
  });

  it('throws NotFoundDomainException when the tournament is missing', async () => {
    tRepo.findById.mockResolvedValue(null);
    mRepo.findByTournamentId.mockResolvedValue([]);
    await expect(useCase.execute('t')).rejects.toBeInstanceOf(
      NotFoundDomainException,
    );
  });

  it('starts the tournament and generates pair-wise matches for an even player count', async () => {
    const tournament = buildTournament(['p1', 'p2', 'p3', 'p4']);
    tRepo.findById.mockResolvedValue(tournament);
    mRepo.findByTournamentId.mockResolvedValue([]);

    const matches = await useCase.execute('tournament-id');

    expect(matches).toHaveLength(2);
    expect(matches[0].round).toBe(1);
    expect(matches[0].player1Id).toBe('p1');
    expect(matches[0].player2Id).toBe('p2');
    expect(matches[1].player1Id).toBe('p3');
    expect(matches[1].player2Id).toBe('p4');
    expect(tournament.status).toBe(TournamentStatus.IN_PROGRESS);
    expect(tRepo.save).toHaveBeenCalledWith(tournament);
  });

  it('creates a bye match for the leftover player when the count is odd', async () => {
    const tournament = buildTournament(['p1', 'p2', 'p3']);
    tRepo.findById.mockResolvedValue(tournament);
    mRepo.findByTournamentId.mockResolvedValue([]);

    const matches = await useCase.execute('tournament-id');

    expect(matches).toHaveLength(2);
    const bye = matches.find((m) => m.score === 'bye');
    expect(bye).toBeDefined();
    expect(bye?.player1Id).toBe('p3');
    expect(bye?.player2Id).toBe('p3');
    expect(bye?.winnerId).toBe('p3');
    expect(bye?.status).toBe(MatchStatus.COMPLETED);
  });

  it('completes the tournament when only one winner remains', async () => {
    const tournament = buildTournament(['p1', 'p2']);
    tournament.status = TournamentStatus.IN_PROGRESS;
    tRepo.findById.mockResolvedValue(tournament);
    mRepo.findByTournamentId.mockResolvedValue([
      new MatchEntity(
        'm1',
        'tournament-id',
        'p1',
        'p2',
        MatchStatus.COMPLETED,
        1,
        '2:0',
        'p1',
      ),
    ]);

    const matches = await useCase.execute('tournament-id');
    expect(matches).toEqual([]);
    expect(tournament.status).toBe(TournamentStatus.COMPLETED);
  });
});
