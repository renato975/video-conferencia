import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #334155', borderRadius: '15px', backgroundColor: '#1e293b' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎥 Video Conf Minds</h1>
        <p style={{ color: '#94a3b8' }}>Seu clone do Whereby está quase pronto!</p>
        <button style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' }}>
          Criar Nova Sala
        </button>
      </div>
    </div>
  );
}

export default App;
