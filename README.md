# 🎥 Video Conference Platform

Uma plataforma de videoconferência estilo Whereby.com, sem necessidade de cadastro. Crie salas instantaneamente e compartilhe o link!

## ✨ Funcionalidades

- **Criação de Salas**: Gere links únicos para reuniões instantâneas
- **Sem Cadastro**: Entre na sala apenas com seu nome
- **Áudio e Vídeo**: WebRTC com qualidade adaptativa
- **Controles do Host**: Trancar sala, expulsar participantes, silenciar todos
- **Chat**: Mensagens em tempo real durante a reunião
- **Compartilhamento de Tela**: Para apresentações e demonstrações
- **Waiting Room**: Sala de espera para rooms privados
- **Responsivo**: Funciona em desktop e mobile

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Backend   │────▶│   Redis     │
│  (WebRTC)   │     │  (Socket.io)│     │  (Signaling)│
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ Media Server│
                    │  (mediasoup)│
                    └─────────────┘
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose (para desenvolvimento local)
- npm ou yarn

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd video-conference-platform

# 2. Suba os serviços com Docker Compose
docker-compose up -d redis

# 3. Backend
cd backend
npm install
npm run dev

# 4. Frontend (em outro terminal)
cd frontend
npm install
npm run dev

# 5. Acesse http://localhost:5173
```

### Usando Docker Compose (Tudo em um comando)

```bash
# Sobe todos os serviços
docker-compose up -d

# Acessa em http://localhost:5173 (frontend) e http://localhost:3001 (backend)
```

## 📁 Estrutura do Projeto

```
video-conference-platform/
├── backend/              # API Server (Node.js + Express + Socket.io)
│   ├── src/
│   │   ├── config/       # Configurações
│   │   ├── controllers/  # Controllers REST
│   │   ├── services/     # Lógica de negócio (RoomService)
│   │   ├── socket/       # Handlers Socket.io
│   │   ├── routes/       # Rotas Express
│   │   ├── models/       # Types/Interfaces
│   │   └── index.ts      # Entry point
│   └── package.json
│
├── frontend/             # React App
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   │   ├── video/    # VideoTile, VideoGrid
│   │   │   ├── controls/ # ControlBar
│   │   │   ├── chat/     # ChatPanel
│   │   │   └── waiting-room/
│   │   ├── hooks/        # useWebRTC, useSocket, useMediaDevices
│   │   ├── services/     # API client, Socket client
│   │   ├── store/        # Zustand state
│   │   └── pages/        # Home, Create, Room
│   └── package.json
│
├── media-server/         # mediasoup SFU
│   ├── src/
│   │   ├── server.ts     # Entry point
│   │   └── mediaServer.ts
│   └── package.json
│
├── docker-compose.yml    # Orquestração de containers
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Backend
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Media Server
MEDIA_SERVER_PORT=3002
PUBLIC_IP=your-public-ip
```

## 🌐 API Endpoints

### REST API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/rooms` | Criar nova sala |
| GET | `/api/rooms/:id` | Buscar info da sala |
| POST | `/api/rooms/:id/join` | Validar entrada |
| GET | `/health` | Health check |
| GET | `/stats` | Estatísticas do servidor |

### Socket Events

**Client → Server:**
- `join-room` - Entrar na sala
- `leave-room` - Sair da sala
- `offer/answer/ice-candidate` - WebRTC signaling
- `chat-message` - Enviar mensagem
- `host-action` - Ação de host (kick, lock, etc)

**Server → Client:**
- `room-joined` - Confirmação de entrada
- `participant-joined/left` - Participantes
- `room-locked/unlocked` - Estado da sala
- `kicked` - Notificação de expulsão

## 🧪 Testando

1. **Abra 2 navegadores** (Chrome comum + modo anônimo)
2. **Chrome 1**: http://localhost:5173 → Create Room
3. **Copie o link** da sala criada
4. **Chrome 2 (anônimo)**: Cole o link
5. **Teste funcionalidades**:
   - Mute/unmute
   - Camera on/off
   - Chat
   - Leave meeting

## 📊 Custos AWS (Produção)

| Serviço | Especificação | Custo Mensal |
|---------|---------------|--------------|
| EC2 (API) | t3.medium x 2 | $60 |
| EC2 (Media) | c5.xlarge x 2 | $300 |
| ElastiCache | Redis | $50 |
| Load Balancer | Application LB | $35 |
| EIPs | 4 IPs | $15 |
| S3 + CloudFront | 50GB + CDN | $30 |
| Data Transfer | ~500GB | $50 |
| **Total** | | **~$540** |

## 🚢 Deploy

### AWS (EC2 + Docker)

```bash
# 1. Clone no servidor
git clone <repo>
cd video-conference-platform

# 2. Configure ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 3. Deploy com Docker
docker-compose -f docker-compose.prod.yml up -d

# 4. Configure DNS e SSL
# Use nginx + certbot para HTTPS
```

### Render / Railway / Heroku

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente
3. Deploy automático

## 🔒 Segurança

- [ ] Implementar autenticação JWT (opcional)
- [ ] Rate limiting no API
- [ ] Validação de input
- [ ] CORS configurado
- [ ] WebSocket authentication
- [ ] TURN server para NAT traversal

## 📈 Escalabilidade

Para múltiplos servidores:

1. **Horizontal scaling do Backend**: Multiple instances com load balancer
2. **Redis Cluster**: Para signaling distribuído
3. **Media Server (SFU)**: Usar mediasoup para roteamento de mídia
4. **CDN**: Para assets estáticos

## 🤝 Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

MIT License - Use livremente!

## 🆘 Suporte

- Abra uma issue no GitHub
- Consulte a documentação em `docs/`
- See also: [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

Feito com ❤️ para videoconferências sem fricção.