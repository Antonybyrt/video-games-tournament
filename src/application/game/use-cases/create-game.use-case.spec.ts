import { GameEntity } from '../../../domain/game/game.entity';
import { IGameRepository } from '../../../domain/game/game.repository.interface';
import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { CreateGameUseCase } from './create-game.use-case';

const buildRepo = (): jest.Mocked<IGameRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
});

describe('CreateGameUseCase', () => {
  it('persists a new game when the name is unique', async () => {
    const repo = buildRepo();
    repo.findByName.mockResolvedValue(null);
    repo.save.mockImplementation(async (g) => g);

    const game = await new CreateGameUseCase(repo).execute({
      name: 'Street Fighter 6',
      publisher: 'Capcom',
      releaseDate: '2023-06-02',
      genre: 'Fighting',
    });

    expect(game).toBeInstanceOf(GameEntity);
    expect(game.name).toBe('Street Fighter 6');
    expect(game.releaseDate).toEqual(new Date('2023-06-02'));
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictDomainException when a game with the same name exists', async () => {
    const repo = buildRepo();
    repo.findByName.mockResolvedValue({} as GameEntity);

    await expect(
      new CreateGameUseCase(repo).execute({
        name: 'Street Fighter 6',
        publisher: 'Capcom',
        releaseDate: '2023-06-02',
        genre: 'Fighting',
      }),
    ).rejects.toBeInstanceOf(ConflictDomainException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
