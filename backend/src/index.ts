import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Usuário ${socket.id} entrou na sala ${roomId}`);
    // Avisa quem já estava na sala que alguém novo chegou
    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('offer', (data) => {
    // Repassa a oferta de vídeo para o destinatário específico
    io.to(data.to).emit('offer', {
      signal: data.signal,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    // Repassa a resposta de vídeo de volta para quem chamou
    io.to(data.to).emit('answer', {
      signal: data.signal,
      from: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Usuário saiu:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('Motor Minds Video rodando na porta ' + PORT);
});
