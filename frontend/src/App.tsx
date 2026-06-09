import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const API_URL = import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';
const socket = io(API_URL);

function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState(window.location.pathname.split('/')[1] || '');
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>();

  useEffect(() => {
    if (roomId && !inCall) startCall(roomId);
  }, [roomId]);

  const startCall = (id: string) => {
    setRoomId(id);
    setInCall(true);
    window.history.pushState({}, '', `/${id}`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideo.current) localVideo.current.srcObject = stream;

      // Quando alguém entra na sala, o cérebro avisa
      socket.emit('join-room', id);

      socket.on('user-connected', (userId) => {
        // Eu sou o iniciador (quem já estava na sala)
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on('signal', (data) => socket.emit('offer', { to: userId, signal: data }));
        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });
        peerRef.current = peer;
      });

      socket.on('offer', (data) => {
        // Eu sou o convidado (recebendo oferta)
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on('signal', (signal) => socket.emit('answer', { to: data.from, signal }));
        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });
        peer.signal(data.signal);
        peerRef.current = peer;
      });

      socket.on('answer', (data) => {
        peerRef.current?.signal(data.signal);
      });
    });
  };

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      {!inCall ? (
        <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '15px 40px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          CRIAR MINHA SALA
        </button>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '90%' }}>
          {/* Meu Vídeo */}
          <div style={{ width: '45%', minWidth: '300px', position: 'relative' }}>
            <p>Você</p>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: '100%', borderRadius: '15px', border: '3px solid #0ea5e9' }} />
          </div>
          {/* Vídeo do Convidado */}
          <div style={{ width: '45%', minWidth: '300px', position: 'relative' }}>
            <p>Convidado</p>
            <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%', borderRadius: '15px', border: '3px solid #10b981', backgroundColor: '#000' }} />
          </div>
          <button onClick={() => window.location.href = '/'} style={{ position: 'fixed', bottom: '20px', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px' }}>Sair</button>
        </div>
      )}
    </div>
  );
}

export default App;
