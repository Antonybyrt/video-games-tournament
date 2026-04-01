import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToGames1775050262915 implements MigrationInterface {
    name = 'AddCreatedAtToGames1775050262915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "createdAt"`);
    }

}
