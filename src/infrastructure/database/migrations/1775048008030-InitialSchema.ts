import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1775048008030 implements MigrationInterface {
  name = 'InitialSchema1775048008030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_status_enum" AS ENUM('pending', 'in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tournaments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "status" "public"."tournaments_status_enum" NOT NULL DEFAULT 'pending', "maxPlayers" integer NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "game_id" uuid NOT NULL, CONSTRAINT "PK_6d5d129da7a80cf99e8ad4833a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bdbbbf95bc2bcb5caada90f0c" ON "tournaments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86eb37df073cbf54a27a0739a2" ON "tournaments" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE TABLE "players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "avatar" character varying, "isAdmin" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ba988c87a279b5067d273c5924" UNIQUE ("username"), CONSTRAINT "UQ_3abeb86b19703d782f0beff84c0" UNIQUE ("email"), CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ba988c87a279b5067d273c592" ON "players" ("username") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3abeb86b19703d782f0beff84c" ON "players" ("email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."matches_status_enum" AS ENUM('pending', 'in_progress', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."matches_status_enum" NOT NULL DEFAULT 'pending', "round" integer NOT NULL, "score" character varying, "tournament_id" uuid NOT NULL, "player1_id" uuid NOT NULL, "player2_id" uuid NOT NULL, "winner_id" uuid, CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1cbed13ca0ed0398b208ef7b7" ON "matches" ("round") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d0fb132a9b17b5801b91666214" ON "matches" ("tournament_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "publisher" character varying NOT NULL, "releaseDate" date NOT NULL, "genre" character varying(50) NOT NULL, CONSTRAINT "UQ_28639e6be5f363b0257ec04e14f" UNIQUE ("name"), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tournament_players" ("player_id" uuid NOT NULL, "tournament_id" uuid NOT NULL, CONSTRAINT "PK_0aa209ac4ea7d2a95b1f6639ff5" PRIMARY KEY ("player_id", "tournament_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3c6b193bf4b3a4ecdf7e4cf40" ON "tournament_players" ("player_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76e731e4992a85050d3cb75b2f" ON "tournament_players" ("tournament_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD CONSTRAINT "FK_d1ed2c0baea76333e83404b7635" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_d0fb132a9b17b5801b916662147" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_4160c564de33391537026e4ed27" FOREIGN KEY ("player1_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_3e098e236f56bf7f46c2663e1aa" FOREIGN KEY ("player2_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_5d665d4ed9ae6cf089ece227754" FOREIGN KEY ("winner_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_players" ADD CONSTRAINT "FK_a3c6b193bf4b3a4ecdf7e4cf408" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_players" ADD CONSTRAINT "FK_76e731e4992a85050d3cb75b2f4" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tournament_players" DROP CONSTRAINT "FK_76e731e4992a85050d3cb75b2f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_players" DROP CONSTRAINT "FK_a3c6b193bf4b3a4ecdf7e4cf408"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_5d665d4ed9ae6cf089ece227754"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_3e098e236f56bf7f46c2663e1aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_4160c564de33391537026e4ed27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_d0fb132a9b17b5801b916662147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" DROP CONSTRAINT "FK_d1ed2c0baea76333e83404b7635"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76e731e4992a85050d3cb75b2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3c6b193bf4b3a4ecdf7e4cf40"`,
    );
    await queryRunner.query(`DROP TABLE "tournament_players"`);
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0fb132a9b17b5801b91666214"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1cbed13ca0ed0398b208ef7b7"`,
    );
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TYPE "public"."matches_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3abeb86b19703d782f0beff84c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ba988c87a279b5067d273c592"`,
    );
    await queryRunner.query(`DROP TABLE "players"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86eb37df073cbf54a27a0739a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5bdbbbf95bc2bcb5caada90f0c"`,
    );
    await queryRunner.query(`DROP TABLE "tournaments"`);
    await queryRunner.query(`DROP TYPE "public"."tournaments_status_enum"`);
  }
}
