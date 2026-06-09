import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Copy,
  Users,
  MessageSquare,
  MonitorUp,
} from 'lucide-react';

type RemoteStreamItem = {
  id: string;
  stream: MediaStream;
};

const API_URL =
  import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';

const roomFromUrl = window.location.pathname.replace('/', '');

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

function App() {
  const [roomId, setRoomId] = useState(roomFromUrl || '');
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamItem[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const cleanupPeer = (userId: string) => {
    const peer = peersRef.current[userId];
    if (peer) {
      peer.destroy();
      delete peersRef.current[userId];
    }

    setRemoteStreams((prev) => prev.filter((item) => item.id !== userId));
  };

  const createPeer = (
    targetUserId: string,
    initiator: boolean,
    stream: MediaStream
  ) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('signal', {
        to: targetUserId,
        signal,
        roomId,
      });
    });

    peer.on('stream', (remoteStream) => {
      setRemoteStreams((prev) => {
        const alreadyExists = prev.some((item) => item.id === targetUserId);

        if (alreadyExists) {
          return prev.map((item) =>
            item.id === targetUserId
              ? { ...item, stream: remoteStream }
              : item
          );
        }

        return [...prev, { id: targetUserId, stream: remoteStream }];
      });
    });

    peer.on('close', () => {
      cleanupPeer(targetUserId);
    });

    peer.on('error', (err) => {
      console.error('Erro no peer:', err);
      cleanupPeer(targetUserId);
    });

    return peer;
  };

  const setupSocket = () => {
    if (socketRef.current) return;

    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket conectado:', socket.id);
    });

    socket.on('existing-users', (users: string[]) => {
      console.log('Usuários já na sala:', users);

      const stream = localStreamRef.current;
      if (!stream) return;

      users.forEach((userId) => {
        if (peersRef.current[userId]) return;

        const peer = createPeer(userId, true, stream);
        peersRef.current[userId] = peer;
      });
    });

    socket.on('user-joined', (userId: string) => {
      console.log('Novo usuário entrou:', userId);
    });

    socket.on(
      'signal',
      ({ from, signal }: { from: string; signal: Peer.SignalData }) => {
        const stream = localStreamRef.current;
        if (!stream) return;

        let peer = peersRef.current[from];

        if (!peer) {
          peer = createPeer(from, false, stream);
          peersRef.current[from] = peer;
        }

        peer.signal(signal);
      }
    );

    socket.on('user-left', (userId: string) => {
      console.log('Usuário saiu:', userId);
      cleanupPeer(userId);
    });

    socket.on('connect_error', (err) => {
      console.error('Erro de conexão socket:', err);
      setErrorMessage('Não consegui conectar ao servidor de chamadas.');
    });

    socketRef.current = socket;
  };

  const startCall = async (forcedRoomId?: string) => {
    const finalRoomId = forcedRoomId || roomId || generateRoomId();

    try {
      setLoading(true);
      setErrorMessage('');
      setRoomId(finalRoomId);

      setupSocket();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (window.location.pathname !== `/${finalRoomId}`) {
        window.history.pushState({}, '', `/${finalRoomId}`);
      }

      setInCall(true);

      socketRef.current?.emit('join-room', finalRoomId);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Não consegui acessar câmera e microfone. Verifique as permissões do navegador.'
      );
    } finally {
      setLoading(false);
    }
  };

  const leaveCall = () => {
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};

    setRemoteStreams([]);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setInCall(false);
    setRoomId('');
    setChatOpen(false);

    window.location.href = '/';
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCamEnabled(videoTrack.enabled);
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (roomFromUrl) {
      startCall(roomFromUrl);
    }

    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      if (socketRef.current) socketRef.current.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {!inCall ? (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 36, margin: 0, color: '#60a5fa' }}>
                Minds Video
              </h1>
              <p style={{ color: '#cbd5e1', marginTop: 12 }}>
                Sua sala de videoconferência estilo Whereby
              </p>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Digite um ID ou clique para criar uma sala"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: '1px solid #334155',
                  background: '#0b1220',
                  color: '#fff',
                  fontSize: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => startCall()}
                  disabled={loading}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Entrando...' : 'Criar / Entrar na sala'}
                </button>

                <button
                  onClick={() => setRoomId(generateRoomId())}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  Gerar ID
                </button>
              </div>

              {errorMessage && (
                <div
                  style={{
                    marginTop: 8,
                    background: '#7f1d1d',
                    border: '1px solid #b91c1c',
                    color: '#fecaca',
                    padding: 14,
                    borderRadius: 12,
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
          <div style={{ flex: 1, padding: 20, boxSizing: 'border-box' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  Você está na sala: {roomId}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 14 }}>
                  Participantes conectados: {1 + remoteStreams.length}
                </div>
              </div>

              <button
                onClick={copyInviteLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: copied ? '#059669' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                <Copy size={18} />
                {copied ? 'Link copiado!' : 'Copiar link'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  remoteStreams.length > 0 ? '1fr 1fr' : '1fr',
                gap: 16,
              }}
            >
              <div
                style={{
                  background: '#020617',
                  border: '2px solid #0ea5e9',
                  borderRadius: 16,
                  overflow: 'hidden',
                  minHeight: 320,
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    fontSize: 14,
                    color: '#cbd5e1',
                    background: '#111827',
                  }}
                >
                  Você
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 280,
                    objectFit: 'cover',
                    background: '#000',
                    transform: 'scaleX(-1)',
                  }}
                />
              </div>

              {remoteStreams.map((item) => (
                <RemoteVideoCard key={item.id} stream={item.stream} id={item.id} />
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: 999,
                  padding: 12,
                }}
              >
                <ControlButton
                  onClick={toggleMic}
                  active={micEnabled}
                  icon={micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                  label={micEnabled ? 'Mic ligado' : 'Mic desligado'}
                />

                <ControlButton
                  onClick={toggleCam}
                  active={camEnabled}
                  icon={camEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                  label={camEnabled ? 'Câmera ligada' : 'Câmera desligada'}
                />

                <ControlButton
                  onClick={() => setChatOpen(!chatOpen)}
                  active={chatOpen}
                  icon={<MessageSquare size={20} />}
                  label="Chat"
                />

                <ControlButton
                  onClick={() => alert('Compartilhamento de tela entra no próximo passo. Primeiro vamos travar a videochamada funcionando 100%.')}
                  active={false}
                  icon={<MonitorUp size={20} />}
                  label="Compartilhar"
                />

                <ControlButton
                  onClick={() => alert(`Pessoas na sala: ${1 + remoteStreams.length}`)}
                  active={false}
                  icon={<Users size={20} />}
                  label="Participantes"
                />

                <button
                  onClick={leaveCall}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    padding: '12px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  <PhoneOff size={20} />
                  Sair
                </button>
              </div>
            </div>
          </div>

          {chatOpen && (
            <div
              style={{
                width: 320,
                borderLeft: '1px solid #1f2937',
                background: '#0b1220',
                padding: 20,
                boxSizing: 'border-box',
              }}
            >
              <h3 style={{ marginTop: 0 }}>Chat</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                Nesta etapa, foque em validar:
                <br />
                1. os dois entram,
                <br />
                2. um vê o vídeo do outro,
                <br />
                3. áudio e vídeo conectam.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RemoteVideoCard({
  stream,
  id,
}: {
  stream: MediaStream;
  id: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      style={{
        background: '#020617',
        border: '2px solid #22c55e',
        borderRadius: 16,
        overflow: 'hidden',
        minHeight: 320,
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          fontSize: 14,
          color: '#cbd5e1',
          background: '#111827',
        }}
      >
        Participante {id.slice(0, 6)}
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          minHeight: 280,
          objectFit: 'cover',
          background: '#000',
        }}
      />
    </div>
  );
}

function ControlButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1d4ed8' : '#1e293b',
        color: '#fff',
        border: 'none',
        borderRadius: 999,
        padding: '12px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 700,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
