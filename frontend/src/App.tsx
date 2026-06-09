import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { Video, Mic, MonitorUp, MessageSquare, PhoneOff } from 'lucide-react';

const API_URL = 'https://video-conferencia.onrender.com';
const socket = io(API_URL);

function App() {
  const [inCall, setInCall] = useState(false);
  const roomId = window.location.pathname.split('/')[1];
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCall = (id: string) => {
    window.history.pushState({}, '', `/${id}`);
    setInCall(true);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      streamRef.current = s;
      if (localVideo.current) localVideo.current.srcObject = s;

      socket.emit('join-room', id);

      socket.on('user-connected', (userId) => {
        const peer = new Peer({ initiator: true, trickle: false, stream: s });
        peer.on('signal', (signal) => socket.emit('offer', { to: userId, signal }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        socket.on('answer', (data) => peer.signal(data.signal));
      });

      socket.on('offer', (data) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: s });
        peer.on('signal', (signal) => socket.emit('answer', { to: data.from, signal }));
        peer.on('stream', (rs) => { if (remoteVideo.current) remoteVideo.current.srcObject = rs; });
        peer.signal(data.signal);
      });
    });
  };

  useEffect(() => { if (roomId && !inCall) startCall(roomId); }, [roomId]);

  return (
    <div style={{ backgroundColor: '#0b0f1a', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      {!inCall ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <h1>Minds Video Conference</h1>
          <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#2563eb', padding: '15px 30px', borderRadius: '10px', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Criar Minha Sala</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', flex: 1, alignItems: 'center', width: '100%' }}>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: '45%', minWidth: '300px', borderRadius: '15px', border: '2px solid #30363d', transform: 'scaleX(-1)' }} />
            <video ref={remoteVideo} autoPlay playsInline style={{ width: '45%', minWidth: '300px', borderRadius: '15px', border: '2px solid #10b981', backgroundColor: '#000' }} />
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '20px', background: '#161b22', borderRadius: '50px', border: '1px solid #30363d', marginBottom: '20px' }}>
            <Video /> <Mic /> <MonitorUp /> <MessageSquare />
            <button onClick={() => window.location.href = '/'} style={{ backgroundColor: '#ef4444', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer' }}>Sair</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
