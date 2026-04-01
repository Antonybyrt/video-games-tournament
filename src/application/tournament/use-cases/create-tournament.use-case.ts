import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';

export class CreateTournamentUseCase {
  constructor(private readonly tournamentRepository: ITournamentRepository) {}

  execute(dto: CreateTournamentDto): Promise<TournamentEntity> {
    const tournament = new TournamentEntity(
      crypto.randomUUID(),
      new Date(),
      dto.name,
      dto.gameId,
      dto.maxPlayers,
      new Date(dto.startDate),
      TournamentStatus.PENDING,
      [],
    );
    return this.tournamentRepository.save(tournament);
  }
}
