import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { TournamentTypeormEntity } from '../tournament/tournament.typeorm-entity';

@Entity('players')
export class PlayerTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ length: 50, unique: true })
  username!: string;

  @Index()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true, type: 'varchar' })
  avatar!: string | null;

  @Column({ default: false })
  isAdmin!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(
    'TournamentTypeormEntity',
    (t: TournamentTypeormEntity) => t.players,
  )
  @JoinTable({
    name: 'tournament_players',
    joinColumn: { name: 'player_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tournament_id', referencedColumnName: 'id' },
  })
  tournaments!: TournamentTypeormEntity[];
}
