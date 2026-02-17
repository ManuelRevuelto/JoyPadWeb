import { Server } from 'socket.io';

export function initSocketLogic(io: Server) {
  io.on('connection', (socket) => {
    console.log('Someone has logged in:', socket.id);

    socket.on('join-room', (data: { roomId: string; name?: string }) => {
      const { roomId, name } = data;
      socket.join(roomId);
      console.log(
        `Current socket room ${socket.id}: ${Array.from(socket.rooms)}`,
      );
      io.to(roomId).emit('pc-receive', {
        userId: socket.id,
        action: 'JOIN',
        name: name || 'Guest',
      });
    });

    socket.on(
      'controller-input',
      (data: { roomId: string; action: string }) => {
        console.log('Received command:', data);
        socket
          .to(data.roomId)
          .emit('pc-receive', { userId: socket.id, action: data.action });
      },
    );

    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) => {
        io.to(room).emit('pc-receive', {
          userId: socket.id,
          action: 'DISCONNECT',
        });
      });
      console.log('User logging off:', socket.id);
    });
  });
}
