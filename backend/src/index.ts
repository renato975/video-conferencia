import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permite que o Netlify acesse sem bloqueios
    methods: ["GET", "POST"]
  }
});

// Mapeamento para saber quem está em qual sala
io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Usuário ${socket.id} entrou na sala ${roomId}`);
    
    // Avisa os outros que alguém chegou, enviando o ID de quem chegou
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Repassa a oferta de vídeo para o destino específico
  socket.on('offer', (data) => {
    console.log(`Repassando oferta de ${socket.id} para ${data.to}`);
    io.to(data.to).emit('offer', {
      from: socket.id,
      signal: data.signal
    });
  });

  // Repassa a resposta de vídeo para o destino específico
  socket.on('answer', (data) => {
    console.log(`Repassando resposta de ${socket.id} para ${data.to}`);
    io.to(data.to).emit('answer', {
      from: socket.id,
      signal: data.signal
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Usuário desconectou:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Motor da Minds rodando na porta ${PORT}`);
});
