import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://video-conferencia.onrender.com';
const socket = io(API_URL);

function App() {
  const [inCall, setInCall] = useState(false);
  // O PULO DO GATO: Pega o ID da URL se existir
  const urlRoomId = window.location.pathname.split('/')[1];
  const [roomId, setRoomId] = useState(urlRoomId || '');

  const startCall = (id: string) => {
    setRoomId(id);
    setInCall(true);
    // Atualiza a URL do navegador sem recarregar a página
    window.history.pushState({}, '', `/${id}`);
    socket.emit('join-room', id);
  };

  const createNewRoom = () => {
    const newId = Math.random().toString(36).substring(7);
    startCall(newId);
  };

  // Se o usuário já entrou com um link (ex: /abc), inicia a chamada direto
  useEffect(() => {
    if (urlRoomId && !inCall) {
      startCall(urlRoomId);
    }
  }, [urlRoomId]);

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
            onClick={createNewRoom}
            style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '15px 40px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', transition: '0.3s' }}>
            CRIAR MINHA SALA AGORA
          </button>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <h2 style={{ margin: '20px' }}>Você está na Sala: <span style={{ color: '#0ea5e9' }}>{roomId}</span></h2>
          <div style={{ width: '80%', maxWidth: '800px', aspectRatio: '16/9', backgroundColor: 'black', borderRadius: '20px', overflow: 'hidden', border: '4px solid #0ea5e9' }}>
            <video id="localVideo" autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#334155', borderRadius: '8px' }}>
             <p style={{ margin: 0, fontSize: '0.9rem' }}>Envie este link para alguém: <br/> 
             <strong style={{ color: '#38bdf8' }}>{window.location.href}</strong></p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '30px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
            Sair da Sala
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
