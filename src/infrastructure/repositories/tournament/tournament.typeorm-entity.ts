import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import type { GameTypeormEntity } from '../game/game.typeorm-entity';
import type { MatchTypeormEntity } from '../match/match.typeorm-entity';
import type { PlayerTypeormEntity } from '../player/player.typeorm-entity';

@Entity('tournaments')
export class TournamentTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.PENDING,
  })
  status!: TournamentStatus;

  @Column()
  maxPlayers!: number;

  @Index()
  @Column({ type: 'timestamptz' })
  startDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ name: 'game_id' })
  gameId!: string;

  @ManyToOne('GameTypeormEntity', { eager: false, nullable: false })
  @JoinColumn({ name: 'game_id' })
  game!: GameTypeormEntity;

  @ManyToMany('PlayerTypeormEntity', (p: PlayerTypeormEntity) => p.tournaments)
  players!: PlayerTypeormEntity[];

  @OneToMany('MatchTypeormEntity', (m: MatchTypeormEntity) => m.tournament)
  matches!: MatchTypeormEntity[];
}
