import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  })
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Minds Video backend online 🚀');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log('✅ Socket conectado:', socket.id);

  socket.on('join-room', (roomId: string) => {
    if (!roomId) return;

    console.log(`📥 ${socket.id} entrou na sala ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId)!;

    const existingUsers = Array.from(room);

    room.add(socket.id);
    socket.data.roomId = roomId;

    socket.join(roomId);

    // manda para quem entrou quem já estava lá
    socket.emit('existing-users', existingUsers);

    // avisa os outros só para UI/log, sem forçar offer duplicada
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on(
    'signal',
    (payload: { to: string; signal: any; roomId?: string }) => {
      if (!payload?.to || !payload?.signal) return;

      io.to(payload.to).emit('signal', {
        from: socket.id,
        signal: payload.signal,
      });
    }
  );

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId as string | undefined;

    console.log('❌ Socket desconectado:', socket.id);

    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.delete(socket.id);
    socket.to(roomId).emit('user-left', socket.id);

    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
});

const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Minds Video backend rodando na porta ${PORT}`);
});
