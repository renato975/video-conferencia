import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('offer', (data) => {
    io.to(data.to).emit('offer', { from: socket.id, signal: data.signal });
  });

  socket.on('answer', (data) => {
    io.to(data.to).emit('answer', { from: socket.id, signal: data.signal });
  });
});

httpServer.listen(process.env.PORT || 3001);
