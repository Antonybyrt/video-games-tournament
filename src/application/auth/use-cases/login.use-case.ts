import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
import { BusinessRuleDomainException } from '../../../domain/shared/exceptions/business-rule.exception';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { LoginDto } from '../dtos/login.dto';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';

export class LoginUseCase {
  constructor(
    private readonly playerRepo: IPlayerRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LoginDto): Promise<{ accessToken: string }> {
    const player = await this.playerRepo.findByEmail(dto.email);
    if (!player) {
      throw new NotFoundDomainException('Player not found');
    }

    const isValid = await this.hashService.compare(
      dto.password,
      player.password,
    );
    if (!isValid) {
      throw new BusinessRuleDomainException('Invalid credentials');
    }

    const accessToken = this.tokenService.sign({
      sub: player.id,
      email: player.email,
      isAdmin: player.isAdmin,
    });

    return { accessToken };
  }
}
