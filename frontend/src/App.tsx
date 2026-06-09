import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Video, VideoOff, Mic, MicOff, MonitorUp, MessageSquare, Users, PhoneOff, Settings, ShieldLock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';
const socket = io(API_URL, { transports: ['websocket'] });

function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState(window.location.pathname.split('/')[1] || '');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<any>();

  const iceServers = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } };

  const startCall = (id: string) => {
    setRoomId(id);
    setInCall(true);
    window.history.pushState({}, '', `/${id}`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      setStream(s);
      if (localVideo.current) localVideo.current.srcObject = s;
      socket.emit('join-room', id);

      socket.on('user-connected', (userId) => {
        const peer = new Peer({ initiator: true, trickle: false, stream: s, ...iceServers });
        peer.on('signal', (data) => socket.emit('offer', { to: userId, signal: data }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        peerRef.current = peer;
      });

      socket.on('offer', (data) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: s, ...iceServers });
        peer.on('signal', (signal) => socket.emit('answer', { to: data.from, signal }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        peer.signal(data.signal);
        peerRef.current = peer;
      });
      
const socket = io(API_URL, { 
  transports: ['websocket'],
  upgrade: false 
});

      socket.on('answer', (data) => { peerRef.current?.signal(data.signal); });
    });
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {!inCall ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1 style={{fontSize: '2.5rem', fontWeight: 'bold'}}>Minds English School</h1>
            <p style={{color: '#94a3b8', marginBottom: '2rem'}}>Plataforma de Videoconferência Exclusiva</p>
            <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#2563eb', padding: '1rem 2rem', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Criar Reunião</button>
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', position: 'relative' }}>
          {/* ÁREA DE VÍDEO */}
          <div style={{ flex: 1, padding: '20px', display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#161b22' }}>
             <div style={{ width: '45%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', border: '2px solid #30363d', position: 'relative' }}>
                <video ref={localVideo} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Renato Garcia (Você)</div>
             </div>
             <div style={{ width: '45%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', border: '2px solid #30363d', position: 'relative' }}>
                <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Convidado</div>
             </div>
          </div>

          {/* CHAT LATERAL */}
          {chatOpen && (
            <div style={{ width: '300px', backgroundColor: '#0d1117', borderLeft: '1px solid #30363d', padding: '20px' }}>
                <h3>Chat da Reunião</h3>
                <div style={{ height: '80%', border: '1px solid #30363d', marginTop: '10px', borderRadius: '8px', padding: '10px', fontSize: '14px', color: '#8b949e' }}>Nenhuma mensagem ainda...</div>
                <input placeholder="Enviar mensagem..." style={{ width: '100%', marginTop: '20px', padding: '10px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#161b22', color: 'white' }} />
            </div>
          )}

          {/* BARRA DE FERRAMENTAS INFERIOR */}
          <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', padding: '12px 25px', backgroundColor: 'rgba(22, 27, 34, 0.9)', borderRadius: '50px', border: '1px solid #30363d', backdropFilter: 'blur(10px)' }}>
            <button onClick={toggleVideo} style={{ background: isVideoOff ? '#ef4444' : 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Video /></button>
            <button onClick={toggleMic} style={{ background: isMuted ? '#ef4444' : 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Mic /></button>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><MonitorUp /></button>
            <button onClick={() => setChatOpen(!chatOpen)} style={{ background: chatOpen ? '#2563eb' : 'none', border: 'none', color: 'white', cursor: 'pointer' }}><MessageSquare /></button>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Users /></button>
            <div style={{ width: '1px', background: '#30363d', margin: '0 10px' }}></div>
            <button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#ef4444', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><PhoneOff size={18} /> Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
