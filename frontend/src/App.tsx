import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Pega o link do Render que você configurou no Netlify
const API_URL = import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';
const socket = io(API_URL);

function App() {
  const [inCall, setInCall] = useState(false);
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    const id = Math.random().toString(36).substring(7);
    setRoomId(id);
    setInCall(true);
    socket.emit('join-room', id);
  };

  useEffect(() => {
    if (inCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          const videoElement = document.getElementById('localVideo') as HTMLVideoElement;
          if (videoElement) videoElement.srcObject = stream;
        })
        .catch(err => alert("Erro ao acessar câmera: " + err));
    }
  }, [inCall]);

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      {!inCall ? (
        <div style={{ textAlign: 'center', padding: '40px', border: '1px solid #334155', borderRadius: '20px', backgroundColor: '#1e293b', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>🎥 Minds Video</h1>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Sua plataforma exclusiva de videoconferência.</p>
          <button 
            onClick={createRoom}
            style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: '0.3s' }}>
            CRIAR MINHA SALA AGORA
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', p: '20px' }}>
          <h2 style={{ margin: '20px' }}>Sala: {roomId}</h2>
          <div style={{ width: '80%', maxWidth: '800px', aspectRatio: '16/9', backgroundColor: 'black', borderRadius: '20px', overflow: 'hidden', border: '4px solid #0ea5e9' }}>
            <video id="localVideo" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '30px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
            Encerrar Chamada
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
