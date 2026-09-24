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
  Calendar,
  GraduationCap,
  Phone,
  Key
} from 'lucide-react';
import { storageService } from './services/storageService';
import StudentCheckIn from './components/StudentCheckIn';
import AdminPanel from './components/admin/AdminPanel';
import TeacherPanel from './components/teacher/TeacherPanel';

export default function App() {
  const [data, setData] = useState(() => storageService.getData());
  const [viewMode, setViewMode] = useState('checkin'); // 'checkin' | 'teacher' | 'admin'

  // Estado de autenticación Admin
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return sessionStorage.getItem('discipulado_admin_auth') === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estado de autenticación Profesor
  const [teacherUser, setTeacherUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('discipulado_teacher_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const isTeacherUnlocked = Boolean(teacherUser);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [teacherPhoneInput, setTeacherPhoneInput] = useState('');
  const [teacherPassInput, setTeacherPassInput] = useState('');
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [teacherAuthError, setTeacherAuthError] = useState('');

  // Escuchar cambios reactivos en el almacenamiento
  useEffect(() => {
    const unsubscribe = storageService.subscribe((updatedData) => {
      setData(updatedData);
      // Mantener actualizado el profesor si cambió de datos
      if (teacherUser) {
        const freshTeacher = updatedData.teachers?.find(t => t.id === teacherUser.id);
        if (freshTeacher) {
          setTeacherUser(freshTeacher);
          sessionStorage.setItem('discipulado_teacher_data', JSON.stringify(freshTeacher));
        }
      }
    });
    return unsubscribe;
  }, [teacherUser]);

  // Handlers para Admin
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

  // Handlers para Profesor
  const handleOpenTeacher = () => {
    if (isTeacherUnlocked) {
      setViewMode('teacher');
    } else {
      setShowTeacherLoginModal(true);
      setTeacherAuthError('');
      setTeacherPhoneInput('');
      setTeacherPassInput('');
    }
  };

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    if (!teacherPhoneInput.trim() || !teacherPassInput) {
      setTeacherAuthError('Por favor introduce tu número de teléfono y tu contraseña.');
      return;
    }

    const res = storageService.validateTeacher(teacherPhoneInput, teacherPassInput);
    if (res.success) {
      sessionStorage.setItem('discipulado_teacher_data', JSON.stringify(res.teacher));
      setTeacherUser(res.teacher);
      setShowTeacherLoginModal(false);
      setViewMode('teacher');
      setTeacherAuthError('');
    } else {
      setTeacherAuthError(res.error || 'Número de teléfono o contraseña incorrectos.');
    }
  };

  const handleTeacherLogout = () => {
    sessionStorage.removeItem('discipulado_teacher_data');
    setTeacherUser(null);
    setViewMode('checkin');
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <div className="app-container">
        {/* Barra Superior estilo Maqueta con Botones Pastilla */}
        <header className="mockup-navbar">
          <div className="mockup-brand">
            <div className="mockup-brand-icon">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="mockup-brand-title">Discipulado</h1>
              <span className="mockup-brand-sub">Control de Asistencia</span>
            </div>
          </div>

          {/* Grupo de Pastillas de Navegación */}
          <div className="nav-pills-group">
            <button
              type="button"
              className={`nav-pill ${viewMode === 'checkin' ? 'active' : ''}`}
              onClick={() => setViewMode('checkin')}
            >
              <Smartphone size={16} />
              <span>Fichaje</span>
            </button>

            <button
              type="button"
              className={`nav-pill ${viewMode === 'teacher' ? 'active' : ''}`}
              onClick={handleOpenTeacher}
              style={viewMode !== 'teacher' ? {
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#065F46',
                border: '1.5px solid rgba(16, 185, 129, 0.3)'
              } : {}}
            >
              <GraduationCap size={16} />
              <span>Profesores</span>
            </button>

            <button
              type="button"
              className={`nav-pill ${viewMode === 'admin' ? 'active' : 'nav-pill-warm'}`}
              onClick={handleOpenAdmin}
            >
              <Shield size={16} />
              <span>Panel Admin</span>
            </button>

            {/* Botón de Cerrar Sesión si está en vista de profesor */}
            {isTeacherUnlocked && viewMode === 'teacher' && (
              <button
                type="button"
                className="nav-pill"
                onClick={handleTeacherLogout}
                title="Cerrar Sesión de Profesor"
                style={{ background: '#ECFDF5', color: '#065F46' }}
              >
                <Lock size={14} /> Salir ({teacherUser?.name?.split(' ')[0] || 'Prof.'})
              </button>
            )}

            {/* Botón de Cerrar Sesión si está autenticado en admin */}
            {isAdminUnlocked && viewMode === 'admin' && (
              <button
                type="button"
                className="nav-pill"
                onClick={handleLogout}
                title="Cerrar Sesión de Administrador"
                style={{ background: '#FEECEB', color: '#991B1B' }}
              >
                <Lock size={14} /> Salir (Admin)
              </button>
            )}
          </div>
        </header>

        {/* Contenido Principal */}
        <main>
          {viewMode === 'checkin' && (
            <StudentCheckIn data={data} />
          )}

          {viewMode === 'teacher' && (
            <div style={{ padding: '10px 32px 40px' }}>
              <TeacherPanel 
                data={data} 
                currentTeacher={teacherUser} 
                onLogout={handleTeacherLogout} 
              />
            </div>
          )}

          {viewMode === 'admin' && (
            <div style={{ padding: '10px 32px 40px' }}>
              <AdminPanel data={data} onLogout={handleLogout} />
            </div>
          )}
        </main>
      </div>

      {/* Modal de Acceso de Profesor con Teléfono y Contraseña */}
      {showTeacherLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <GraduationCap size={28} />
              </div>

              <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Acceso para Profesores</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Ingresa con tu número de teléfono registrado y contraseña de profesor para ver inasistencias y estudiantes.
              </p>
            </div>

            <form onSubmit={handleTeacherLogin}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> Teléfono Registrado
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+34 611 223 344 o 611223344"
                  autoFocus
                  required
                  value={teacherPhoneInput}
                  onChange={(e) => {
                    setTeacherPhoneInput(e.target.value);
                    setTeacherAuthError('');
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} /> Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showTeacherPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    value={teacherPassInput}
                    onChange={(e) => {
                      setTeacherPassInput(e.target.value);
                      setTeacherAuthError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPass(!showTeacherPass)}
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
                    {showTeacherPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {teacherAuthError && (
                <div style={{
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  marginBottom: '14px'
                }}>
                  {teacherAuthError}
                </div>
              )}

              {/* Guía con profesores disponibles */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#065F46',
                marginBottom: '18px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Profesores de prueba disponibles:</div>
                <div style={{ fontSize: '0.76rem', lineHeight: '1.5' }}>
                  • <strong>Andrés Romero</strong>: <code>+34 611 223 344</code> (Clave: <code>1234</code>)<br />
                  • <strong>Miriam Valdés</strong>: <code>+34 622 334 455</code> (Clave: <code>1234</code>)<br />
                  • <strong>David Gómez</strong>: <code>+34 633 445 566</code> (Clave: <code>1234</code>)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowTeacherLoginModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#10B981', borderColor: '#059669' }}
                >
                  <Unlock size={16} /> Entrar al Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                background: 'var(--c-sky-lightest)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#2B4A6F',
                marginBottom: '18px',
                border: '1.5px solid var(--border-card)'
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
