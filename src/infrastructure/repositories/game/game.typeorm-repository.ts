import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from '../../../domain/game/game.entity';
import { IGameRepository } from '../../../domain/game/game.repository.interface';
import { GameTypeormEntity } from './game.typeorm-entity';

@Injectable()
export class GameTypeormRepository implements IGameRepository {
  constructor(
    @InjectRepository(GameTypeormEntity)
    private readonly repository: Repository<GameTypeormEntity>,
  ) {}

  async findAll(): Promise<GameEntity[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<GameEntity | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(name: string): Promise<GameEntity | null> {
    const entity = await this.repository.findOneBy({ name });
    return entity ? this.toDomain(entity) : null;
  }

  async save(game: GameEntity): Promise<GameEntity> {
    const saved = await this.repository.save(this.toPersistence(game));
    return this.toDomain(saved);
  }

  private toDomain(entity: GameTypeormEntity): GameEntity {
    return new GameEntity(
      entity.id,
      entity.createdAt,
      entity.name,
      entity.publisher,
      new Date(entity.releaseDate),
      entity.genre,
    );
  }

  private toPersistence(domain: GameEntity): Partial<GameTypeormEntity> {
    return {
      id: domain.id,
      name: domain.name,
      publisher: domain.publisher,
      releaseDate: domain.releaseDate.toISOString().split('T')[0],
      genre: domain.genre,
    };
  }
}
