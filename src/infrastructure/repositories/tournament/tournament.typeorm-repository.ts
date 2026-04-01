import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../../../domain/player/player.entity';
import { TournamentStatus } from '../../../domain/tournament/tournament-status.enum';
import { TournamentEntity } from '../../../domain/tournament/tournament.entity';
import { ITournamentRepository } from '../../../domain/tournament/tournament.repository.interface';
import { PlayerTypeormEntity } from '../player/player.typeorm-entity';
import { TournamentTypeormEntity } from './tournament.typeorm-entity';

@Injectable()
export class TournamentTypeormRepository implements ITournamentRepository {
  constructor(
    @InjectRepository(TournamentTypeormEntity)
    private readonly repo: Repository<TournamentTypeormEntity>,
  ) {}

  async findAll(status?: TournamentStatus): Promise<TournamentEntity[]> {
    const qb = this.repo
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.players', 'player');
    if (status) {
      qb.where('tournament.status = :status', { status });
    }
    const entities = await qb.getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<TournamentEntity | null> {
    const entity = await this.repo
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.players', 'player')
      .where('tournament.id = :id', { id })
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByIdWithPlayers(id: string): Promise<TournamentEntity | null> {
    const entity = await this.repo
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.players', 'player')
      .where('tournament.id = :id', { id })
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByPlayerId(playerId: string): Promise<TournamentEntity[]> {
    const entities = await this.repo
      .createQueryBuilder('tournament')
      .innerJoin('tournament.players', 'player')
      .where('player.id = :playerId', { playerId })
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async save(tournament: TournamentEntity): Promise<TournamentEntity> {
    const saved = await this.repo.save(this.toPersistence(tournament));
    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.manager.query(
      'DELETE FROM tournament_players WHERE tournament_id = $1',
      [id],
    );
    await this.repo.delete(id);
  }

  async countPlayers(tournamentId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('tournament')
      .innerJoin('tournament.players', 'player')
      .where('tournament.id = :tournamentId', { tournamentId })
      .getCount();
    return result;
  }

  async isPlayerEnrolled(
    tournamentId: string,
    playerId: string,
  ): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('tournament')
      .innerJoin('tournament.players', 'player')
      .where('tournament.id = :tournamentId', { tournamentId })
      .andWhere('player.id = :playerId', { playerId })
      .getCount();
    return count > 0;
  }

  async addPlayer(tournamentId: string, playerId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .relation(TournamentTypeormEntity, 'players')
      .of(tournamentId)
      .add(playerId);
  }

  private toDomain(entity: TournamentTypeormEntity): TournamentEntity {
    const players: PlayerEntity[] = (entity.players ?? []).map(
      (p: PlayerTypeormEntity) =>
        new PlayerEntity(
          p.id,
          p.createdAt,
          p.username,
          p.email,
          p.password,
          p.avatar,
          p.isAdmin,
        ),
    );

    return new TournamentEntity(
      entity.id,
      entity.createdAt,
      entity.name,
      entity.gameId,
      entity.maxPlayers,
      entity.startDate,
      entity.status,
      players,
    );
  }

  private toPersistence(
    domain: TournamentEntity,
  ): Partial<TournamentTypeormEntity> {
    return {
      id: domain.id,
      name: domain.name,
      gameId: domain.gameId,
      maxPlayers: domain.maxPlayers,
      startDate: domain.startDate,
      status: domain.status,
    };
  }
}
