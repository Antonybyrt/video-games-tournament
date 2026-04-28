import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchEntity } from '../../../domain/match/match.entity';
import { IMatchRepository } from '../../../domain/match/match.repository.interface';
import { MatchTypeormEntity } from './match.typeorm-entity';

@Injectable()
export class MatchTypeormRepository implements IMatchRepository {
  constructor(
    @InjectRepository(MatchTypeormEntity)
    private readonly repo: Repository<MatchTypeormEntity>,
  ) {}

  async findByTournamentId(tournamentId: string): Promise<MatchEntity[]> {
    const entities = await this.repo.findBy({ tournamentId });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<MatchEntity | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async save(match: MatchEntity): Promise<MatchEntity> {
    const saved = await this.repo.save(this.toPersistence(match));
    return this.toDomain(saved);
  }

  private toDomain(entity: MatchTypeormEntity): MatchEntity {
    return new MatchEntity(
      entity.id,
      entity.tournamentId,
      entity.player1Id,
      entity.player2Id,
      entity.status,
      entity.round,
      entity.score,
      entity.winnerId,
    );
  }

  private toPersistence(domain: MatchEntity): Partial<MatchTypeormEntity> {
    return {
      id: domain.id,
      tournamentId: domain.tournamentId,
      player1Id: domain.player1Id,
      player2Id: domain.player2Id,
      status: domain.status,
      round: domain.round,
      score: domain.score,
      winnerId: domain.winnerId,
    };
  }
}
