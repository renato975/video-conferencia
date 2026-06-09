import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Video, Mic, MonitorUp, MessageSquare, Users, PhoneOff } from 'lucide-react';

// Endereço fixo do seu cérebro no Render
const API_URL = 'https://video-conferencia.onrender.com';
const socket = io(API_URL, { transports: ['websocket'] });

function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState(window.location.pathname.split('/')[1] || '');
  const [chatOpen, setChatOpen] = useState(false);
  
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<any>();

  // Configuração para atravessar firewalls (Google STUN)
  const iceConfig = {
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
  };

  const startCall = (id: string) => {
    setRoomId(id);
    setInCall(true);
    window.history.pushState({}, '', `/${id}`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((myStream) => {
      setStream(myStream);
      if (localVideo.current) localVideo.current.srcObject = myStream;

      socket.emit('join-room', id);

      // CENÁRIO A: Eu já estava na sala e alguém entrou
      socket.on('user-connected', (newUserId) => {
        const peer = new Peer({ initiator: true, trickle: false, stream: myStream, ...iceConfig });
        
        peer.on('signal', (signal) => {
          socket.emit('offer', { to: newUserId, signal });
        });

        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });

        // Quando o convidado responder (answer), finaliza a conexão
        socket.on('answer', (data) => {
          peer.signal(data.signal);
        });

        peerRef.current = peer;
      });

      // CENÁRIO B: Eu sou o convidado e recebi uma oferta de quem já estava lá
      socket.on('offer', (data) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: myStream, ...iceConfig });
        
        peer.on('signal', (signal) => {
          socket.emit('answer', { to: data.from, signal });
        });

        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });

        peer.signal(data.signal);
        peerRef.current = peer;
      });
    });
  };

  useEffect(() => {
    if (roomId && !inCall) startCall(roomId);
  }, [roomId]);

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {!inCall ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <h1 style={{fontSize: '2.5rem', marginBottom: '20px'}}>Minds Video</h1>
          <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#2563eb', padding: '15px 40px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>
            CRIAR REUNIÃO AGORA
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
          <div style={{ flex: 1, padding: '20px', display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#161b22' }}>
            {/* Meu Vídeo */}
            <div style={{ width: '45%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #30363d', backgroundColor: '#000', position: 'relative' }}>
              <video ref={localVideo} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Você</div>
            </div>
            {/* Vídeo do Outro */}
            <div style={{ width: '45%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981', backgroundColor: '#000', position: 'relative' }}>
              <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Convidado</div>
            </div>
          </div>

          {/* Barra de Ferramentas Inferior */}
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', padding: '12px 25px', backgroundColor: 'rgba(22, 27, 34, 0.9)', borderRadius: '50px', border: '1px solid #30363d', backdropFilter: 'blur(10px)' }}>
            <Video size={24} /> <Mic size={24} /> <MonitorUp size={24} /> <MessageSquare size={24} /> <Users size={24} />
            <button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#ef4444', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
          </div>
          
          <div style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Link: {window.location.href}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
