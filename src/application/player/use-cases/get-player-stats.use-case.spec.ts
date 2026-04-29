import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { GetPlayerStatsUseCase } from './get-player-stats.use-case';

const buildRepo = (): jest.Mocked<IPlayerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  findStats: jest.fn(),
  findRankings: jest.fn(),
});

describe('GetPlayerStatsUseCase', () => {
  it('returns zero stats for a player without any match', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(
      new PlayerEntity('id', new Date(), 'u', 'e', 'pw', null, false),
    );
    repo.findStats.mockResolvedValue({ wins: 0, totalMatches: 0 });

    const stats = await new GetPlayerStatsUseCase(repo).execute('id');

    expect(stats).toEqual({
      playerId: 'id',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    });
  });

  it('computes losses and winRate from wins/totalMatches', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(
      new PlayerEntity('id', new Date(), 'u', 'e', 'pw', null, false),
    );
    repo.findStats.mockResolvedValue({ wins: 6, totalMatches: 10 });

    const stats = await new GetPlayerStatsUseCase(repo).execute('id');

    expect(stats.losses).toBe(4);
    expect(stats.winRate).toBeCloseTo(0.6);
  });

  it('throws NotFoundDomainException when the player does not exist', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(null);
    await expect(
      new GetPlayerStatsUseCase(repo).execute('missing'),
    ).rejects.toBeInstanceOf(NotFoundDomainException);
  });
});
