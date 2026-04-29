import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { LoginUseCase } from './login.use-case';

const buildPlayerRepo = (): jest.Mocked<IPlayerRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findAll: jest.fn(),
  save: jest.fn(),
  findStats: jest.fn(),
  findRankings: jest.fn(),
});

describe('LoginUseCase', () => {
  let repo: jest.Mocked<IPlayerRepository>;
  let hash: jest.Mocked<IHashService>;
  let token: jest.Mocked<ITokenService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repo = buildPlayerRepo();
    hash = { hash: jest.fn(), compare: jest.fn() };
    token = { sign: jest.fn(), verify: jest.fn() };
    useCase = new LoginUseCase(repo, hash, token);
  });

  it('throws NotFoundDomainException when email is unknown', async () => {
    repo.findByEmail.mockResolvedValue(null);
    await expect(
      useCase.execute({ email: 'ghost@example.com', password: 'Password1' }),
    ).rejects.toBeInstanceOf(NotFoundDomainException);
    expect(hash.compare).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleDomainException on wrong password', async () => {
    repo.findByEmail.mockResolvedValue(
      new PlayerEntity(
        'id-1',
        new Date(),
        'alice',
        'alice@example.com',
        'hashed',
        null,
        false,
      ),
    );
    hash.compare.mockResolvedValue(false);
    await expect(
      useCase.execute({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(BusinessRuleDomainException);
  });

  it('returns a signed token on success', async () => {
    const player = new PlayerEntity(
      'id-1',
      new Date(),
      'alice',
      'alice@example.com',
      'hashed',
      null,
      true,
    );
    repo.findByEmail.mockResolvedValue(player);
    hash.compare.mockResolvedValue(true);
    token.sign.mockReturnValue('signed_token');

    const res = await useCase.execute({
      email: 'alice@example.com',
      password: 'Password1',
    });

    expect(token.sign).toHaveBeenCalledWith({
      sub: 'id-1',
      email: 'alice@example.com',
      isAdmin: true,
    });
    expect(res).toEqual({ accessToken: 'signed_token' });
  });
});
