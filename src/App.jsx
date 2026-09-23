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
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return sessionStorage.getItem('discipulado_admin_auth') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Escuchar cambios reactivos en el almacenamiento
  useEffect(() => {
    const unsubscribe = storageService.subscribe((updatedData) => {
      setData(updatedData);
    });
    return unsubscribe;
  }, []);

  const handleOpenAdmin = () => {
    if (isAdminUnlocked) {
      setViewMode('admin');
    } else {
      setShowLoginModal(true);
      setAuthError('');
      setUsernameInput('');
      setPasswordInput('');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) {
      setAuthError('Por favor completa el usuario y la contraseña.');
      return;
    }

    const isValid = storageService.validateAdmin(usernameInput, passwordInput);
    if (isValid) {
      sessionStorage.setItem('discipulado_admin_auth', 'true');
      setIsAdminUnlocked(true);
      setShowLoginModal(false);
      setViewMode('admin');
      setAuthError('');
    } else {
      setAuthError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('discipulado_admin_auth');
    setIsAdminUnlocked(false);
    setViewMode('checkin');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Botón de Cerrar Sesión si está autenticado */}
          {isAdminUnlocked && viewMode === 'admin' && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              title="Cerrar Sesión de Administrador"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            >
              <Lock size={14} /> Salir
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="main-content">
        {viewMode === 'checkin' ? (
          <StudentCheckIn data={data} />
        ) : (
          <AdminPanel data={data} onLogout={handleLogout} />
        )}
      </main>

      {/* Modal de Acceso de Administrador con Usuario y Contraseña */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Shield size={28} />
              </div>

              <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Acceso Administrativo</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ingresa tus credenciales de administrador para gestionar cursos, estudiantes y asistencias.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="admin"
                  autoFocus
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setAuthError('');
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {authError && (
                <div style={{
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  marginBottom: '14px'
                }}>
                  {authError}
                </div>
              )}

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                border: '1px solid var(--border-card)'
              }}>
                🔑 <strong>Credenciales por defecto:</strong><br />
                Usuario: <code>admin</code> • Contraseña: <code>password123</code>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowLoginModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Unlock size={16} /> Iniciar Sesión
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
