import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../../../domain/player/player.entity';
import {
  IPlayerRepository,
  PlayerRankingRow,
  PlayerStats,
} from '../../../domain/player/player.repository.interface';
import { MatchStatus } from '../../../domain/match/match-status.enum';
import { PlayerTypeormEntity } from './player.typeorm-entity';

@Injectable()
export class PlayerTypeormRepository implements IPlayerRepository {
  constructor(
    @InjectRepository(PlayerTypeormEntity)
    private readonly repo: Repository<PlayerTypeormEntity>,
  ) {}

  async findById(id: string): Promise<PlayerEntity | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<PlayerEntity | null> {
    const entity = await this.repo.findOneBy({ email });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<PlayerEntity | null> {
    const entity = await this.repo.findOneBy({ username });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<PlayerEntity[]> {
    const entities = await this.repo.find();
    return entities.map((e) => this.toDomain(e));
  }

  async save(player: PlayerEntity): Promise<PlayerEntity> {
    const entity = this.toPersistence(player);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findStats(playerId: string): Promise<PlayerStats> {
    const totalRow = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .from('matches', 'm')
      .where(
        '(m.player1_id = :id OR m.player2_id = :id) AND m.status = :s',
        { id: playerId, s: MatchStatus.COMPLETED },
      )
      .getRawOne<{ total: string }>();

    const winsRow = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'wins')
      .from('matches', 'm')
      .where('m.winner_id = :id', { id: playerId })
      .getRawOne<{ wins: string }>();

    return {
      totalMatches: parseInt(totalRow?.total ?? '0', 10),
      wins: parseInt(winsRow?.wins ?? '0', 10),
    };
  }

  async findRankings(): Promise<PlayerRankingRow[]> {
    const players = await this.repo.find();

    const rows = await Promise.all(
      players.map(async (p) => {
        const stats = await this.findStats(p.id);
        return { player: this.toDomain(p), ...stats };
      }),
    );

    return rows;
  }

  private toDomain(entity: PlayerTypeormEntity): PlayerEntity {
    return new PlayerEntity(
      entity.id,
      entity.createdAt,
      entity.username,
      entity.email,
      entity.password,
      entity.avatar,
      entity.isAdmin,
    );
  }

  private toPersistence(domain: PlayerEntity): PlayerTypeormEntity {
    const entity = new PlayerTypeormEntity();
    entity.id = domain.id;
    entity.createdAt = domain.createdAt;
    entity.username = domain.username;
    entity.email = domain.email;
    entity.password = domain.password;
    entity.avatar = domain.avatar;
    entity.isAdmin = domain.isAdmin;
    return entity;
  }
}
