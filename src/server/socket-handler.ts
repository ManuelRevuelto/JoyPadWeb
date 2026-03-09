import { Server } from 'socket.io';

export function initSocketLogic(io: Server) {
  io.on('connection', (socket) => {
    console.log('New socket connected:', socket.id);

    socket.on('check-room', (data: { roomId: string }, callback) => {
      const { roomId } = data;
      const fullRoomId = 'SALA-' + roomId;
      const roomExists = io.sockets.adapter.rooms.has(fullRoomId);
      console.log(`Rooms:` + Array.from(io.sockets.adapter.rooms.keys()));
      callback({ active: roomExists });
    });

    socket.on(
      'join-room',
      (data: {
        roomId: string;
        name?: string;
        carColor?: string;
        carModel?: string;
        role: 'monitor' | 'remote';
      }) => {
        const { roomId, name, carColor, carModel, role } = data;

        socket.join(roomId);
        socket.data = { roomId, name, carColor, carModel, role };

        console.log(`${name} (${role}) joined to ${roomId}`);

        if (role === 'remote') {
          socket.to(roomId).emit('player-joined', {
            userId: socket.id,
            name: name,
            carColor: carColor,
            carModel: carModel,
          });
        } else if (role === 'monitor') {
          console.log(`Monitor ha creado en la sala: ${roomId}`);
        } else {
          console.warn(`Rol desconocido para ${name}: ${role}`);
        }
      },
    );

    socket.on(
      'controller-input',
      (data: { roomId: string; action: string; data?: any }) => {
        const { roomId, action, data: extraData } = data;
        console.log('Received command:', data);

        if (action === 'UPDATE_USER' && extraData) {
          socket.data.name = extraData.name;
          socket.data.carColor = extraData.carColor;
          socket.data.carModel = extraData.carModel;

          socket.to(roomId).emit('user-updated', {
            userId: socket.id,
            name: extraData.name,
            carColor: extraData.carColor,
            carModel: extraData.carModel,
          });
          return;
        }

        socket.to(roomId).emit('pc-receive', {
          userId: socket.id,
          action: action,
          data: extraData,
        });
      },
    );

    socket.on('leave-room', (data: { roomId: string }) => {
      const { roomId } = data;
      const role = socket.data?.role;

      if (role === 'monitor') {
        console.log(`📢 Monitor abandonó sala ${roomId}. Avisando a mandos...`);
        socket.to(roomId).emit('monitor-left');
      } else {
        socket.to(roomId).emit('player-left', socket.id);
      }

      socket.leave(roomId);
    });

    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          const { role } = socket.data;
          if (role === 'monitor') {
            socket.to(roomId).emit('monitor-left');
            console.log(`Room destroyed by closure of Monitor: ${roomId}`);
          } else {
            socket.to(roomId).emit('player-left', socket.id);
          }
        }
      });
    });
  });
}
