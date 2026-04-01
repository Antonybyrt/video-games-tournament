import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';

export class TournamentResponseDto {
  id!: string;
  name!: string;
  gameId!: string;
  maxPlayers!: number;
  startDate!: Date;
  status!: TournamentStatus;
  createdAt!: Date;
  playerCount?: number;
}
