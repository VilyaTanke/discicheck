// src/App.jsx
// Aplicación Principal de Control de Asistencia de Discipulado

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Shield, 
  BookOpen, 
  HeartHandshake,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { storageService } from './services/storageService';
import StudentCheckIn from './components/StudentCheckIn';
import AdminPanel from './components/admin/AdminPanel';

export default function App() {
  const [data, setData] = useState(() => storageService.getData());
  const [viewMode, setViewMode] = useState('checkin'); // 'checkin' | 'admin'
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Escuchar cambios reactivos en el almacenamiento
  useEffect(() => {
    const unsubscribe = storageService.subscribe((updatedData) => {
      setData(updatedData);
    });
    return unsubscribe;
  }, []);

  const handleOpenAdmin = () => {
    // Si ya está desbloqueado en la sesión, ir directo
    if (isAdminUnlocked) {
      setViewMode('admin');
    } else {
      setShowPinModal(true);
      setPinError(false);
      setAdminPinInput('');
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    // Clave predeterminada sencilla para líderes o entrar libremente
    // Permite "1234" o dejar en blanco / pulsar enter
    if (adminPinInput === '1234' || adminPinInput === '') {
      setIsAdminUnlocked(true);
      setShowPinModal(false);
      setViewMode('admin');
    } else {
      setPinError(true);
    }
  };

  return (
    <div>
      {/* Barra Superior / Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="brand-title">Discipulado</h1>
            <span className="brand-subtitle">Control de Asistencia</span>
          </div>
        </div>

        {/* Selector de Modo: Fichaje Móvil / Panel Admin */}
        <nav className="nav-switcher">
          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'checkin' ? 'active' : ''}`}
            onClick={() => setViewMode('checkin')}
          >
            <Smartphone size={16} />
            <span>Fichaje Alumno</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${viewMode === 'admin' ? 'active' : ''}`}
            onClick={handleOpenAdmin}
          >
            <Shield size={16} />
            <span>Panel Admin</span>
          </button>
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="main-content">
        {viewMode === 'checkin' ? (
          <StudentCheckIn data={data} />
        ) : (
          <AdminPanel data={data} />
        )}
      </main>

      {/* Modal de Acceso al Panel de Administración */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Lock size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Acceso Administrativo</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Para gestionar estudiantes, profesores o revisar faltas, introduce el PIN de líder (PIN por defecto: <code>1234</code> o pulsa Acceder).
            </p>

            <form onSubmit={handleVerifyPin}>
              <div className="form-group">
                <input
                  type="password"
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
                  placeholder="PIN (1234)"
                  autoFocus
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setPinError(false);
                  }}
                />
              </div>

              {pinError && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '12px' }}>
                  PIN incorrecto. Prueba con 1234.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowPinModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Unlock size={16} /> Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pie de Página */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 16px',
        color: 'var(--text-faint)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-card)',
        marginTop: '40px'
      }}>
        <p>Sistema de Asistencia de Discipulado • Optimizado para GitHub Pages y Dispositivos Móviles</p>
      </footer>
    </div>
  );
}
