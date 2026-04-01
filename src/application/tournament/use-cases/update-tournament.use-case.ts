import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { NotFoundDomainException } from '../../../domain/shared/exceptions/not-found.exception';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';

export class UpdateTournamentUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  async execute(
    id: string,
    dto: UpdateTournamentDto,
  ): Promise<TournamentEntity> {
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new NotFoundDomainException('Tournament not found');
    }

    if (dto.name !== undefined) tournament.name = dto.name;
    if (dto.gameId !== undefined) tournament.gameId = dto.gameId;
    if (dto.maxPlayers !== undefined) tournament.maxPlayers = dto.maxPlayers;
    if (dto.startDate !== undefined)
      tournament.startDate = new Date(dto.startDate);

    if (dto.status === TournamentStatus.IN_PROGRESS) {
      tournament.start();
    } else if (dto.status === TournamentStatus.COMPLETED) {
      tournament.complete();
    }

    return this.tournamentRepository.save(tournament);
  }
}
