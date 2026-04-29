import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { TournamentStatus } from '../../domain/tournament/tournament-status.enum';
import { ITournamentEventsPort } from '../../application/shared/ports/tournament-events.port';

@Injectable()
@WebSocketGateway({ namespace: '/tournaments', cors: true })
export class TournamentGateway implements ITournamentEventsPort {
  @WebSocketServer()
  private readonly server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() payload: { tournamentId: string },
    socket: Socket,
  ): { joined: string } {
    const room = `tournament:${payload.tournamentId}`;
    void socket.join(room);
    return { joined: room };
  }

  notifyStatusChanged(tournamentId: string, status: TournamentStatus): void {
    if (!this.server) return;
    this.server
      .to(`tournament:${tournamentId}`)
      .emit('tournament:status', { tournamentId, status });
  }

  notifyMatchUpdated(
    tournamentId: string,
    match: {
      id: string;
      round: number;
      status: string;
      winnerId: string | null;
      score: string | null;
    },
  ): void {
    if (!this.server) return;
    this.server
      .to(`tournament:${tournamentId}`)
      .emit('tournament:match', { tournamentId, match });
  }
}
