import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { CreateTournamentUseCase } from './create-tournament.use-case';

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

describe('CreateTournamentUseCase', () => {
  it('builds a PENDING tournament with the provided fields and persists it', async () => {
    const repo = buildRepo();
    repo.save.mockImplementation(async (t) => t);
    const useCase = new CreateTournamentUseCase(repo);

    const result = await useCase.execute({
      name: 'Summer Cup',
      gameId: '550e8400-e29b-41d4-a716-446655440000',
      maxPlayers: 8,
      startDate: '2025-08-01',
    });

    expect(result).toBeInstanceOf(TournamentEntity);
    expect(result.name).toBe('Summer Cup');
    expect(result.gameId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.maxPlayers).toBe(8);
    expect(result.startDate).toEqual(new Date('2025-08-01'));
    expect(result.status).toBe(TournamentStatus.PENDING);
    expect(result.players).toEqual([]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
