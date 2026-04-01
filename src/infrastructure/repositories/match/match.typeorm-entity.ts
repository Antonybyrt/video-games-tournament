import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import type { PlayerTypeormEntity } from '../player/player.typeorm-entity';
import type { TournamentTypeormEntity } from '../tournament/tournament.typeorm-entity';

@Entity('matches')
export class MatchTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
  status!: MatchStatus;

  @Index()
  @Column()
  round!: number;

  @Column({ nullable: true, type: 'varchar' })
  score!: string | null;

  @Index()
  @Column({ name: 'tournament_id' })
  tournamentId!: string;

  @ManyToOne(
    'TournamentTypeormEntity',
    (t: TournamentTypeormEntity) => t.matches,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'tournament_id' })
  tournament!: TournamentTypeormEntity;

  @Column({ name: 'player1_id' })
  player1Id!: string;

  @ManyToOne('PlayerTypeormEntity')
  @JoinColumn({ name: 'player1_id' })
  player1!: PlayerTypeormEntity;

  @Column({ name: 'player2_id' })
  player2Id!: string;

  @ManyToOne('PlayerTypeormEntity')
  @JoinColumn({ name: 'player2_id' })
  player2!: PlayerTypeormEntity;

  @Column({ name: 'winner_id', nullable: true, type: 'uuid' })
  winnerId!: string | null;

  @ManyToOne('PlayerTypeormEntity', { nullable: true })
  @JoinColumn({ name: 'winner_id' })
  winner!: PlayerTypeormEntity | null;
}
