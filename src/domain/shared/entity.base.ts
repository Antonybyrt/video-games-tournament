export abstract class EntityBase {
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
  ) {}
}
