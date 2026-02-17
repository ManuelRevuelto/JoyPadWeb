import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { initSocketLogic } from './socket-handler';

const port = 4000;
const httpServer = createServer((req, res) => {
  res.writeHead(200);
  res.end('Sockets server Development Activo');
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

initSocketLogic(io);

httpServer.listen(port, () => {
  console.log(`JoyPadWeb development server listening on http://localhost:${port}`);
});
