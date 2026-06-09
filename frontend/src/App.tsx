import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Video, Mic, MonitorUp, MessageSquare, Users, PhoneOff, Settings } from 'lucide-react';

const API_URL = 'https://video-conferencia.onrender.com';
const socket = io(API_URL, { transports: ['websocket'] });

function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState(window.location.pathname.split('/')[1] || '');
  const [chatOpen, setChatOpen] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>();

  // SERVIDORES MÁGICOS (STUN) - Fazem a conexão funcionar em qualquer lugar
  const webRTCConfig = {
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
  };

  const startCall = (id: string) => {
    setInCall(true);
    window.history.pushState({}, '', `/${id}`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideo.current) localVideo.current.srcObject = stream;
      socket.emit('join-room', id);

      // Quando o convidado entra
      socket.on('user-connected', (userId) => {
        const peer = new Peer({ initiator: true, trickle: false, stream, ...webRTCConfig });
        peer.on('signal', (signal) => socket.emit('offer', { to: userId, signal }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        socket.on('answer', (data) => peer.signal(data.signal));
        peerRef.current = peer;
      });

      // Quando eu recebo uma chamada
      socket.on('offer', (data) => {
        const peer = new Peer({ initiator: false, trickle: false, stream, ...webRTCConfig });
        peer.on('signal', (signal) => socket.emit('answer', { to: data.from, signal }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        peer.signal(data.signal);
        peerRef.current = peer;
      });
    });
  };

  useEffect(() => { if (roomId && !inCall) startCall(roomId); }, [roomId]);

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      {!inCall ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <h1 style={{fontSize: '3rem', fontWeight: 'bold'}}>Minds Video</h1>
          <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#2563eb', padding: '15px 40px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem' }}>Criar Reunião Agora</button>
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative', backgroundColor: '#161b22' }}>
          {/* GRIDS DE VÍDEO */}
          <div style={{ flex: 1, display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ width: '45%', borderRadius: '15px', overflow: 'hidden', border: '2px solid #30363d', background: '#000', position: 'relative' }}>
              <video ref={localVideo} autoPlay playsInline muted style={{ width: '100%', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' }}>Você</div>
            </div>
            <div style={{ width: '45%', borderRadius: '15px', overflow: 'hidden', border: '2px solid #10b981', background: '#000', position: 'relative' }}>
              <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' }}>Convidado</div>
            </div>
          </div>

          {/* PAINEL DE CHAT */}
          {chatOpen && (
            <div style={{ width: '300px', background: '#0d1117', borderLeft: '1px solid #30363d', padding: '20px' }}>
              <h3>Chat Minds</h3>
              <div style={{ height: '80%', border: '1px solid #334155', borderRadius: '10px', marginTop: '10px' }}></div>
              <input placeholder="Digite aqui..." style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '5px', border: 'none', background: '#161b22', color: 'white' }} />
            </div>
          )}

          {/* BARRA INFERIOR (ESTILO WHEREBY) */}
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', padding: '15px 30px', backgroundColor: 'rgba(22, 27, 34, 0.95)', borderRadius: '50px', border: '1px solid #30363d', backdropFilter: 'blur(10px)' }}>
            <Video size={28} style={{cursor: 'pointer'}} />
            <Mic size={28} style={{cursor: 'pointer'}} />
            <MonitorUp size={28} style={{cursor: 'pointer'}} />
            <MessageSquare size={28} onClick={() => setChatOpen(!chatOpen)} style={{cursor: 'pointer', color: chatOpen ? '#2563eb' : 'white'}} />
            <Users size={28} style={{cursor: 'pointer'}} />
            <Settings size={28} style={{cursor: 'pointer'}} />
            <div style={{ width: '1px', background: '#334155' }}></div>
            <button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#ef4444', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><PhoneOff size={18} /> Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
