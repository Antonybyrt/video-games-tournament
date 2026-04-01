import { PlayerEntity } from '../player/player.entity';
import { EntityBase } from '../shared/entity.base';
import { BusinessRuleDomainException } from '../shared/exceptions/business-rule.exception';
import { TournamentStatus } from './tournament-status.enum';

export class TournamentEntity extends EntityBase {
  constructor(
    id: string,
    createdAt: Date,
    public name: string,
    public gameId: string,
    public maxPlayers: number,
    public startDate: Date,
    public status: TournamentStatus,
    public players: PlayerEntity[],
  ) {
    super(id, createdAt);
  }

  canJoin(currentPlayerCount: number): boolean {
    if (this.status !== TournamentStatus.PENDING) {
      return false;
    }
    if (currentPlayerCount >= this.maxPlayers) {
      return false;
    }
    return true;
  }

  start(): void {
    if (this.status !== TournamentStatus.PENDING) {
      throw new BusinessRuleDomainException(
        'Tournament can only be started from PENDING status',
      );
    }
    this.status = TournamentStatus.IN_PROGRESS;
  }

  complete(): void {
    if (this.status !== TournamentStatus.IN_PROGRESS) {
      throw new BusinessRuleDomainException(
        'Tournament can only be completed from IN_PROGRESS status',
      );
    }
    this.status = TournamentStatus.COMPLETED;
  }
}
