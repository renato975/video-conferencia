import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const API_URL = import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';
const socket = io(API_URL, { transports: ['websocket'] }); // Força websocket para evitar atraso

function App() {
  const [inCall, setInCall] = useState(false);
  const urlRoomId = window.location.pathname.split('/')[1];
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>();

  // Servidores do Google para ajudar a conexão a atravessar a internet (STUN)
  const iceServers = {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  const startCall = (id: string) => {
    setRoomId(id);
    setInCall(true);
    window.history.pushState({}, '', `/${id}`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (localVideo.current) localVideo.current.srcObject = stream;

      socket.emit('join-room', id);

      socket.on('user-connected', (userId) => {
        // Criando a conexão com ajuda do Google STUN
        const peer = new Peer({ initiator: true, trickle: false, stream, ...iceServers });
        
        peer.on('signal', (data) => {
          socket.emit('offer', { to: userId, signal: data });
        });

        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });

        peerRef.current = peer;
      });

      socket.on('offer', (data) => {
        const peer = new Peer({ initiator: false, trickle: false, stream, ...iceServers });
        
        peer.on('signal', (signal) => {
          socket.emit('answer', { to: data.from, signal });
        });

        peer.on('stream', (remoteStream) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
        });

        peer.signal(data.signal);
        peerRef.current = peer;
      });

      socket.on('answer', (data) => {
        peerRef.current?.signal(data.signal);
      });
    }).catch(e => console.error("Erro na câmera:", e));
  };

  useEffect(() => {
    if (urlRoomId && !inCall) startCall(urlRoomId);
  }, [urlRoomId]);

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      {!inCall ? (
        <button onClick={() => startCall(Math.random().toString(36).substring(7))} style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '15px 40px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          CRIAR MINHA SALA
        </button>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '90%', padding: '20px' }}>
          <div style={{ width: '45%', minWidth: '300px' }}>
            <p>Você (ID: {socket.id?.slice(0,4)})</p>
            <video ref={localVideo} autoPlay playsInline muted style={{ width: '100%', borderRadius: '15px', border: '3px solid #0ea5e9', transform: 'scaleX(-1)' }} />
          </div>
          <div style={{ width: '45%', minWidth: '300px' }}>
            <p>Convidado</p>
            <video ref={remoteVideo} autoPlay playsInline style={{ width: '100%', borderRadius: '15px', border: '3px solid #10b981', backgroundColor: '#000' }} />
          </div>
          <p style={{ position: 'fixed', bottom: '80px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px' }}>
            Link da Sala: {window.location.href}
          </p>
          <button onClick={() => window.location.href = '/'} style={{ position: 'fixed', bottom: '20px', backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '8px' }}>Sair</button>
        </div>
      )}
    </div>
  );
}

export default App;
