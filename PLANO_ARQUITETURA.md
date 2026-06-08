# 🎥 Plataforma de Videoconferência - Arquitetura Técnica

## Visão Geral

Plataforma de videoconferência estilo Whereby.com, permitindo criar salas de reunião com link único, sem necessidade de cadastro. MVP focado em funcionalidades essenciais com arquitetura escalável.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUÁRIOS                                        │
│                     (Navegadores com WebRTC)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌─────────────────────┐         ┌─────────────────────┐
         │     CDN/Load Balancer│         │   TURN/STUN Server  │
         │   (CloudFront/AWS LB)│         │   (Twilio/Xirsys)   │
         └─────────────────────┘         └─────────────────────┘
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API SERVER                                      │
│                        (Node.js + Express)                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ REST API    │  │ Socket.io   │  │ Room Manager│  │ Auth        │        │
│  │ (Salas)     │  │ (Signaling) │  │ Service     │  │ Middleware  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
         ┌─────────────────────┐         ┌─────────────────────┐
         │   Redis (Pub/Sub)   │         │   PostgreSQL        │
         │   - Room State      │         │   - Salas           │
         │   - Signaling       │         │   - Users (futuro)  │
         └─────────────────────┘         └─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MEDIA SERVER                                       │
│                         (mediasoup SFU)                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Router      │  │ Transport   │  │ Producer    │  │ Consumer    │        │
│  │ (por sala)  │  │ (WebRTC)    │  │ (publica)   │  │ (assiste)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Purpose | Justificativa |
|------------|---------|---------------|
| **React 18** | UI Framework | Componentização, hooks, grande ecossistema |
| **TypeScript** | Linguagem | Type safety, melhor DX, menos bugs |
| **Vite** | Build Tool | Dev server rápido, HMR eficiente |
| **Zustand** | State Management | Simples, boilerplate mínimo vs Redux |
| **TailwindCSS** | CSS | Rapid prototyping, consistente |
| **simple-peer** | WebRTC Wrapper | Abstrai complexidade do WebRTC |

### Backend
| Tecnologia | Purpose | Justificativa |
|------------|---------|---------------|
| **Node.js** | Runtime | Non-blocking I/O ideal para WebSocket |
| **Express** | HTTP Framework | Flexível, middleware robusto |
| **Socket.io** | Signaling | Reconexão automática, fallback |
| **Redis** | Cache/PubSub | Rápido, pub/sub para scaling |
| **mediasoup** | SFU | Leve, performant, Node.js native |
| **nanoid** | ID Generation | IDs únicos para salas |

### Infraestrutura (AWS)
| Serviço | Tipo | Custo Estimado |
|---------|------|----------------|
| **EC2 t3.medium** | API Server (x2) | ~$60/mês |
| **EC2 c5.xlarge** | Media Server (x2) | ~$300/mês |
| **ElastiCache** | Redis | ~$50/mês |
| **Application LB** | Load Balancer | ~$35/mês |
| **EIP** | Elastic IPs | ~$15/mês |
| **S3 + CloudFront** | Assets/CDN | ~$30/mês |
| **Data Transfer** | Tráfego | ~$50/mês |

**Total Estimado: ~$540/mês**

---

## 📁 Estrutura de Diretórios

```
video-conference-platform/
├── backend/                     # API Server Node.js
│   ├── src/
│   │   ├── config/              # Configurações (env, db)
│   │   ├── controllers/         # Controllers REST
│   │   ├── services/            # Lógica de negócio
│   │   ├── models/              # Models/Types
│   │   ├── routes/              # Rotas Express
│   │   ├── socket/              # Handlers Socket.io
│   │   │   ├── signaling.ts     # WebRTC signaling
│   │   │   └── roomHandler.ts   # Gerenciamento sala
│   │   ├── middleware/          # Auth, validation
│   │   └── index.ts             # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── video/
│   │   │   │   ├── VideoGrid.tsx      # Grid de vídeos
│   │   │   │   ├── VideoTile.tsx      # Tile individual
│   │   │   │   └── SpeakingIndicator.tsx
│   │   │   ├── controls/
│   │   │   │   ├── ControlBar.tsx     # Barra de controles
│   │   │   │   ├── MicButton.tsx
│   │   │   │   ├── CameraButton.tsx
│   │   │   │   └── ScreenShareButton.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── ChatMessage.tsx
│   │   │   ├── waiting-room/
│   │   │   │   └── WaitingRoom.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── DeviceSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useWebRTC.ts          # Lógica WebRTC
│   │   │   ├── useSocket.ts          # Socket.io hook
│   │   │   ├── useMediaDevices.ts    # Camera/mic access
│   │   │   └── useRoom.ts            # Sala state
│   │   ├── services/
│   │   │   ├── api.ts                # REST client
│   │   │   └── socket.ts             # Socket.io client
│   │   ├── store/
│   │   │   └── roomStore.ts          # Zustand store
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   ├── create/
│   │   │   └── room/
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript types
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
├── media-server/                # mediasoup SFU
│   ├── src/
│   │   ├── server.ts
│   │   ├── rooms.ts
│   │   └── config.ts
│   └── package.json
│
├── docker-compose.yml           # Desenvolvimento local
├── .env.example
└── README.md
```

---

## 🔄 Fluxo de Dados WebRTC

### 1. Criação de Sala
```
User A → POST /api/rooms → Server cria sala → Retorna roomId
```

### 2. Entry na Sala
```
User A → GET /room/:id → Frontend carrega sala
       → Socket.connect('room:' + roomId)
       → Server valida sala existe
       → User A entra na sala
```

### 3. Conexão depeer
```
User A → getUserMedia() → Local stream
       → new SimplePeer({initiator: true}) 
       → signaling: 'offer' via Socket
       
Server → retransmite 'offer' para User B

User B → signaling: 'answer'
       → Server retransmite 'answer' para User A

User A & B → ICE candidates trocados
           → WebRTC connection established
           → Media flowing!
```

### 4. Novos Participantes
```
User C entra → signaling: 'offer'
            → Server retransmite para A e B
            → A e B respondem com 'answer'
            → C recebe streams de A e B
```

---

## 🎯 Funcionalidades MVP

| ID | Funcionalidade | Prioridade | Complexidade |
|----|---------------|------------|--------------|
| 1 | Criar sala com link único | P0 | Baixa |
| 2 | Entrar na sala (sem login) | P0 | Baixa |
| 3 | Vídeo e áudio funcional | P0 | Média |
| 4 | Mutar/desligar câmera | P0 | Baixa |
| 5 | Grid de participantes | P0 | Baixa |
| 6 | Host controls (kick, lock) | P1 | Média |
| 7 | Waiting room | P1 | Média |
| 8 | Chat na sala | P2 | Baixa |
| 9 | Compartilhamento de tela | P2 | Média |
| 10 | Gravação | P3 | Alta |

---

## 🚀 Plano de Implementação

### Fase 1: Foundation (Dias 1-3)
- [x] Estrutura de projetos (backend + frontend)
- [ ] Setup Docker Compose
- [ ] API básica REST (criar/listar salas)
- [ ] Socket.io básico (conexão/entry)

### Fase 2: Core WebRTC (Dias 4-7)
- [ ] getUserMedia (câmera/mic)
- [ ] simple-peer integration
- [ ] Signaling completo
- [ ] VideoGrid component

### Fase 3: Controls (Dias 8-10)
- [ ] Toggle mic/camera
- [ ] Host controls (lock, kick)
- [ ] Waiting room
- [ ] UI polish

### Fase 4: Extras (Dias 11-14)
- [ ] Chat
- [ ] Screen share
- [ ] Device selector
- [ ] Testes

### Fase 5: Deploy (Dias 15-17)
- [ ] AWS setup
- [ ] Deploy containers
- [ ] TURN server config
- [ ] Monitoring

---

## 📊 Custos Detalhados (AWS)

```
┌────────────────────────────────────────────────────────┐
│                   CUSTOS MENSAIS AWS                    │
├──────────────────────────┬─────────────────┬───────────┤
│ Serviço                  │ Especificação   │ Custo     │
├──────────────────────────┼─────────────────┼───────────┤
│ API Server (EC2)         │ t3.medium x 2   │ $60.00    │
│ Media Server (EC2)       │ c5.xlarge x 2   │ $300.00   │
│ ElastiCache (Redis)      │ cache.t3.medium │ $50.00    │
│ Application LB           │ 1 LB            │ $35.00    │
│ Elastic IPs              │ 4 EIPs          │ $15.00    │
│ S3 Standard              │ 50GB            │ $10.00    │
│ CloudFront               │ 100GB           │ $20.00    │
│ Data Transfer            │ ~500GB          │ $50.00    │
├──────────────────────────┼─────────────────┼───────────┤
│ TOTAL                    │                 │ $540.00   │
└──────────────────────────┴─────────────────┴───────────┘
```

### Otimizações para reduzir custos:
- Media server spot instances (60% desconto)
- CloudFront + S3 para assets estáticos
- Auto-scaling baseado em demanda

---

## 🔧 Configuração de Desenvolvimento

### Requisitos
- Node.js 18+
- Docker + Docker Compose
- Git

### Setup Local
```bash
# Clone o repositório
git clone <repo>
cd video-conference-platform

# Subir todos os serviços
docker-compose up -d

# Backend (dev mode)
cd backend && npm run dev

# Frontend (dev mode)
cd frontend && npm run dev
```

### Variáveis de Ambiente (.env)
```env
# Backend
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379
MEDIA_SERVER_URL=ws://localhost:3002

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_MEDIA_SERVER_URL=ws://localhost:3002
```

---

## 📝 API Reference

### REST Endpoints

#### POST /api/rooms
Cria uma nova sala
```json
// Request
{
  “name”: “Minha Reunião”,
  “isPrivate”: false,
  “maxParticipants”: 10
}

// Response
{
  “id”: “abc123xyz”,
  “name”: “Minha Reunião”,
  “url”: “https://app.com/room/abc123xyz”,
  “hostToken”: “host_abc123xyz”,
  “createdAt”: “2024-01-15T10:00:00Z”
}
```

#### GET /api/rooms/:id
Busca informações da sala
```json
// Response
{
  “id”: “abc123xyz”,
  “name”: “Minha Reunião”,
  “isPrivate”: false,
  “participantCount”: 5,
  “isLocked”: false
}
```

### Socket Events

#### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{roomId, name}` | Entrar na sala |
| `leave-room` | `{}` | Sair da sala |
| `offer` | `{to, offer}` | WebRTC offer |
| `answer` | `{to, answer}` | WebRTC answer |
| `ice-candidate` | `{to, candidate}` | ICE candidate |
| `chat-message` | `{text}` | Enviar mensagem |
| `host-action` | `{action, targetId}` | Ação de host |

#### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{participants}` | Confirmação de entry |
| `participant-joined` | `{id, name}` | Novo participante |
| `participant-left` | `{id}` | Participante saiu |
| `offer/answer/ice-candidate` | - | WebRTC signaling |
| `chat-message` | `{from, text, time}` | Nova mensagem |
| `room-locked/unlocked` | - | Sala trancada/destrancada |
| `kicked` | - | Você foi expulso |

---

## 🧪 Testando Localmente

1. **Abra 2 navegadores** (Chrome 1, Chrome 2 em modo anônimo)
2. **Chrome 1**: http://localhost:5173 → Criar sala
3. **Copie o link** da sala
4. **Chrome 2**: Cole o link → Entrar como participante
5. **Teste**: Mute, câmera, chat

---

## 📚 Recursos

- [WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [mediasoup Documentation](https://mediasoup.org/documentation/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [simple-peer](https://github.com/feross/simple-peer)

---

## 🚢 Deploy Checklist

- [ ] Configurar domain (DNS)
- [ ] SSL certificates
- [ ] TURN server (coturn)
- [ ] STUN servers
- [ ] Monitoring (CloudWatch/Datadog)
- [ ] Logs centralizados
- [ ] Backup strategy
- [ ] Security headers

---

## 📞 Suporte

Para dúvidas técnicas, abra uma issue no repositório ou consulte a documentação interna.