import { EntityBase } from '../shared/entity.base';

export class PlayerEntity extends EntityBase {
  constructor(
    id: string,
    createdAt: Date,
    public username: string,
    public email: string,
    public password: string,
    public avatar: string | null,
    public isAdmin: boolean,
  ) {
    super(id, createdAt);
  }
}
