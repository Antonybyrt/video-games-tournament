export class PlayerResponseDto {
  id!: string;
  username!: string;
  email!: string;
  avatar!: string | null;
  isAdmin!: boolean;
  createdAt!: Date;
}
