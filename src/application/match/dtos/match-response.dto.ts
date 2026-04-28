import { MatchStatus } from '../../../domain/match/match-status.enum';

export class MatchResponseDto {
  id!: string;
  tournamentId!: string;
  player1Id!: string;
  player2Id!: string;
  status!: MatchStatus;
  round!: number;
  score!: string | null;
  winnerId!: string | null;
}
