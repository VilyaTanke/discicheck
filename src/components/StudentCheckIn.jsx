// src/components/StudentCheckIn.jsx
// Vista de Fichaje para el estudiante: Ingreso con Teléfono y Contraseña personal

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  UserCheck, 
  Phone, 
  Lock, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info
} from 'lucide-react';
import { storageService } from '../services/storageService';

const INSPIRATIONAL_VERSES = [
  { text: '«Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.»', ref: 'Proverbios 22:6' },
  { text: '«Por tanto, id, y haced discípulos a todas las naciones...»', ref: 'Mateo 28:19' },
  { text: '«La palabra de Cristo more en abundancia en vosotros con toda sabiduría.»', ref: 'Colosenses 3:16' },
  { text: '«Lámpara es a mis pies tu palabra, y lumbrera a mi camino.»', ref: 'Salmos 119:105' },
  { text: '«Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo... porque Jehová tu Dios va contigo.»', ref: 'Deuteronomio 31:6' }
];

export default function StudentCheckIn({ data }) {
  const { levels = [], students = [], teachers = [] } = data;

  // Fecha de hoy por defecto (formato YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedLevelId, setSelectedLevelId] = useState(levels[0]?.id || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(null);
  const [justCheckedIn, setJustCheckedIn] = useState(null); // Almacena el resultado para la pantalla de éxito

  // Nivel seleccionado actualmente
  const currentLevel = useMemo(() => {
    return levels.find(l => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  // Profesor asignado a este nivel
  const currentTeacher = useMemo(() => {
    if (!currentLevel?.teacherId) return null;
    return teachers.find(t => t.id === currentLevel.teacherId);
  }, [teachers, currentLevel]);

  // Formato amigable de la fecha de hoy
  const formattedToday = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  }, []);

  // Alumnos de ejemplo de este nivel para ayudar a probar en modo demo
  const sampleLevelStudents = useMemo(() => {
    return students.filter(s => s.levelId === selectedLevelId && s.status === 'active').slice(0, 4);
  }, [students, selectedLevelId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setAlreadyCheckedIn(null);

    if (!phoneInput.trim()) {
      setErrorMessage('Por favor introduce tu número de teléfono.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor introduce tu contraseña.');
      return;
    }

    // Validar estudiante por teléfono y contraseña
    const validation = storageService.validateStudentForCheckIn(phoneInput, passwordInput, selectedLevelId);

    if (!validation.success) {
      setErrorMessage(validation.error);
      return;
    }

    const student = validation.student;

    // Verificar si ya fichó hoy
    const existing = storageService.hasCheckedInToday(student.id, selectedLevelId, todayStr);
    if (existing) {
      setAlreadyCheckedIn({
        student,
        time: new Date(existing.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      });
      return;
    }

    // Registrar asistencia
    const result = storageService.recordAttendance({
      studentId: student.id,
      levelId: selectedLevelId,
      date: todayStr,
      status: 'present',
      checkedInBy: 'student_self',
    });

    // Efecto de celebración con confeti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.log('Confetti effect');
    }

    const randomVerse = INSPIRATIONAL_VERSES[Math.floor(Math.random() * INSPIRATIONAL_VERSES.length)];

    setJustCheckedIn({
      student,
      level: currentLevel,
      time: new Date(result.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      verse: randomVerse
    });

    // Limpiar campos
    setPhoneInput('');
    setPasswordInput('');
  };

  const handleResetForAnother = () => {
    setPhoneInput('');
    setPasswordInput('');
    setErrorMessage('');
    setAlreadyCheckedIn(null);
    setJustCheckedIn(null);
  };

  const handleSelectSample = (samplePhone) => {
    setPhoneInput(samplePhone);
    setPasswordInput('1234');
    setErrorMessage('');
    setAlreadyCheckedIn(null);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Banner de Bienvenida y Fecha */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#818cf8', marginBottom: '6px' }}>
          <Calendar size={16} />
          <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: '500' }}>
            {formattedToday}
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Fichaje de Asistencia</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ingresa con tu número de teléfono y tu contraseña personal para confirmar tu asistencia a la clase.
        </p>
      </div>

      {/* Pantalla Modal / Overlay de Éxito al Fichar */}
      {justCheckedIn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px 24px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--success-light)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={44} />
            </div>

            <span className="badge badge-present" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
              ✓ Asistencia Confirmada
            </span>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
              ¡Hola, {justCheckedIn.student.name}!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Tu presencia en <strong>{justCheckedIn.level.name}</strong> ha quedado registrada a las <strong>{justCheckedIn.time}</strong>.
            </p>

            {/* Versículo de bendición */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              borderLeft: '4px solid var(--primary)',
              padding: '14px',
              borderRadius: '8px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                <Sparkles size={14} /> PALABRA DEL DÍA
              </div>
              <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#e2e8f0', marginBottom: '4px' }}>
                {justCheckedIn.verse.text}
              </p>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' }}>
                — {justCheckedIn.verse.ref}
              </span>
            </div>

            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%' }}
              onClick={handleResetForAnother}
            >
              <RotateCcw size={18} /> Entendido / Fichar a otro alumno
            </button>
          </div>
        </div>
      )}

      {/* 1. Selector de Nivel de Discipulado */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
          1. Elige tu Nivel de Discipulado:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {levels.map(level => {
            const isSelected = selectedLevelId === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  setSelectedLevelId(level.id);
                  setErrorMessage('');
                  setAlreadyCheckedIn(null);
                }}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 10px',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '4px', color: isSelected ? '#a5b4fc' : 'white' }}>
                  {level.name.split('-')[0].trim()}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {level.name.split('-')[1]?.trim() || level.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Ficha de Detalles del Nivel Seleccionado */}
        {currentLevel && (
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#818cf8" />
              <span>{currentLevel.dayOfWeek} • {currentLevel.time}</span>
            </div>
            {currentLevel.room && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="#34d399" />
                <span>{currentLevel.room}</span>
              </div>
            )}
            {currentTeacher && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="#f59e0b" />
                <span>Prof: <strong>{currentTeacher.name}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Formulario de Fichaje con Teléfono y Contraseña */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} color="#34d399" /> 2. Fichar Asistencia con tu Teléfono
        </h3>

        {alreadyCheckedIn && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            background: 'var(--success-light)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>
              <CheckCircle2 size={20} /> ¡Ya has registrado tu asistencia hoy!
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Hola <strong>{alreadyCheckedIn.student.name}</strong>, fichaste a las <strong>{alreadyCheckedIn.time}</strong> en {currentLevel.name}. ¡Bendiciones!
            </p>
          </div>
        )}

        {errorMessage && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            background: 'var(--danger-light)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} color="#818cf8" /> Tu Número de Teléfono
            </label>
            <input
              type="tel"
              className="form-input"
              required
              placeholder="Ej. 600111222 o +34600111222"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setErrorMessage('');
                setAlreadyCheckedIn(null);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#818cf8" /> Tu Contraseña de Estudiante
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                required
                placeholder="Introduce tu contraseña"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMessage('');
                  setAlreadyCheckedIn(null);
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

          <button
            type="submit"
            className="btn btn-success btn-lg pulse-success"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '10px' }}
          >
            <UserCheck size={22} /> VERIFICAR Y FICHAR ASISTENCIA
          </button>
        </form>

        {/* Ayuda de prueba / Modo demo */}
        {sampleLevelStudents.length > 0 && (
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-card)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#a5b4fc', fontWeight: '600' }}>
              <Info size={14} /> Estudiantes de prueba para {currentLevel.name.split('-')[0].trim()} (Contraseña por defecto: <code>1234</code>):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sampleLevelStudents.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s.phone)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  title={`Tel: ${s.phone}`}
                >
                  {s.name} ({s.phone})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
