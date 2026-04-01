import { PlayerEntity } from '../../../domain/player/player.entity';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { ConflictDomainException } from '../../../domain/shared/exceptions/conflict.exception';
import { RegisterDto } from '../dtos/register.dto';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';

export class RegisterUseCase {
  constructor(
    private readonly playerRepo: IPlayerRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existingByEmail = await this.playerRepo.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictDomainException('Email already in use');
    }

    const existingByUsername = await this.playerRepo.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new ConflictDomainException('Username already in use');
    }

    const hashedPassword = await this.hashService.hash(dto.password);

    const player = new PlayerEntity(
      crypto.randomUUID(),
      new Date(),
      dto.username,
      dto.email,
      hashedPassword,
      dto.avatar ?? null,
      false,
    );

    const saved = await this.playerRepo.save(player);

    const accessToken = this.tokenService.sign({
      sub: saved.id,
      email: saved.email,
      isAdmin: saved.isAdmin,
    });

    return { accessToken };
  }
}
