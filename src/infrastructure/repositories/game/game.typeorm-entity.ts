import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('games')
export class GameTypeormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  publisher!: string;

  @Column({ type: 'date' })
  releaseDate!: string;

  @Column({ length: 50 })
  genre!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
