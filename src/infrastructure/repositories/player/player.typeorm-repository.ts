import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { IPlayerRepository } from '../../../domain/player/player.repository.interface';
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
