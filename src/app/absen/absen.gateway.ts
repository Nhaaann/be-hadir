/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class AbsenGateway {
  @WebSocketServer() server: Server;


  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createAbsenSiswa')
  async handleCreateAbsenSiswa(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    client.to(payload.jamDetailId).emit('absenSiswaUpdated', payload);
    console.log('data pay', payload);
    console.log('data room', payload.jamDetailId);

  }

  @SubscribeMessage('closeAbsen')
  async handleCloseAbsen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    console.log(payload);
    client.to(payload.jamDetailId).emit('absenCloseUpdated', payload);
    console.log('data pay', payload);

  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const { roomId } = payload;
    client.join(roomId);
    console.log(`Client ${client.id} joined room: ${roomId}`);
  }

  @SubscribeMessage('joinSiswa')
  handlejOinSiswa(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload
  ) {
    client.join(payload)
  }

  @SubscribeMessage('joinGuru')
  handlejOinGuru(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload
  ) {
    client.join(payload)
  }

  @SubscribeMessage('notifGuru')
  async handlePushNotifGuru(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const roomId = payload.guruId; // Ensure `guruId` is sent with the payload

    // Log when this method is triggered
    console.log('Received notifGuru message:', payload);

    let suc = client.to(roomId).emit('notifGuruUpdated', payload);

    // Log to check if the emit was successful
    console.log('Emit success:', suc);
    console.log('Payload data:', payload);

  }

  @SubscribeMessage('notifSiswa')
  async handlePushNotifSiswa(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const roomId = payload.studentId; // Ensure `guruId` is sent with the payload

    // Log when this method is triggered
    console.log('Received notifGuru message:', payload);
    console.log('Room Id:', payload.studentId);

    let suc = client.to(roomId).emit('notifSiswaUpdated', payload);

    // Log to check if the emit was successful
    console.log('Emit success:', suc);
    console.log('Payload data:', payload);

  }
}
