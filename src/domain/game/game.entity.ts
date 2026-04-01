import { EntityBase } from '../shared/entity.base';

export class GameEntity extends EntityBase {
  constructor(
    id: string,
    createdAt: Date,
    public readonly name: string,
    public readonly publisher: string,
    public readonly releaseDate: Date,
    public readonly genre: string,
  ) {
    super(id, createdAt);
  }
}
