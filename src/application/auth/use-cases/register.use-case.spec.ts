import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { RegisterUseCase } from './register.use-case';

const buildPlayerRepo = (): jest.Mocked<IPlayerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  findStats: jest.fn(),
  findRankings: jest.fn(),
});

const buildHashService = (): jest.Mocked<IHashService> => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

const buildTokenService = (): jest.Mocked<ITokenService> => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

describe('RegisterUseCase', () => {
  let repo: jest.Mocked<IPlayerRepository>;
  let hash: jest.Mocked<IHashService>;
  let token: jest.Mocked<ITokenService>;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    repo = buildPlayerRepo();
    hash = buildHashService();
    token = buildTokenService();
    useCase = new RegisterUseCase(repo, hash, token);
  });

  it('hashes the password, persists the player and returns a token', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.findByUsername.mockResolvedValue(null);
    hash.hash.mockResolvedValue('hashed_pw');
    repo.save.mockImplementation(async (p) => p);
    token.sign.mockReturnValue('signed_token');

    const result = await useCase.execute({
      username: 'alice',
      email: 'alice@example.com',
      password: 'Password1',
    });

    expect(hash.hash).toHaveBeenCalledWith('Password1');
    expect(repo.save).toHaveBeenCalledWith(expect.any(PlayerEntity));
    const persisted = repo.save.mock.calls[0][0];
    expect(persisted.email).toBe('alice@example.com');
    expect(persisted.password).toBe('hashed_pw');
    expect(persisted.isAdmin).toBe(false);
    expect(result).toEqual({ accessToken: 'signed_token' });
  });

  it('throws ConflictDomainException when email is already used', async () => {
    repo.findByEmail.mockResolvedValue({} as PlayerEntity);

    await expect(
      useCase.execute({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(ConflictDomainException);

    expect(hash.hash).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws ConflictDomainException when username is already used', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.findByUsername.mockResolvedValue({} as PlayerEntity);

    await expect(
      useCase.execute({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(ConflictDomainException);
  });
});
