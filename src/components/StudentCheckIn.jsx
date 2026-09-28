// src/components/StudentCheckIn.jsx
// Rediseño visual inspirado en la maqueta: Banner de ondas, tarjeta flotante y tarjetas de nivel redondeadas

import React, { useState, useMemo, useRef } from 'react';
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
  Sprout,
  Heart,
  Flame,
  ArrowDown
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
  const formRef = useRef(null);

  // Fecha de hoy por defecto (formato YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedLevelId, setSelectedLevelId] = useState(levels[0]?.id || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(null);
  const [justCheckedIn, setJustCheckedIn] = useState(null);

  // Nivel seleccionado actualmente
  const currentLevel = useMemo(() => {
    return levels.find(l => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  // Profesores asignados a este nivel
  const currentTeachers = useMemo(() => {
    return teachers.filter(t => 
      (Array.isArray(currentLevel?.teacherIds) && currentLevel.teacherIds.includes(t.id)) || t.id === currentLevel?.teacherId
    );
  }, [teachers, currentLevel]);
  const currentTeacher = currentTeachers[0] || null;

  // Formato amigable de la fecha de hoy
  const formattedToday = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  }, []);

  // Icono para cada nivel inspirado en la maqueta
  const getLevelIcon = (index) => {
    if (index === 0) return <Sprout size={30} />;
    if (index === 1) return <Heart size={28} />;
    return <Flame size={30} />;
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  return (
    <div>
      {/* 1. HERO WAVE BANNER (Exacto al estilo de la maqueta de referencia) */}
      <section className="hero-wave-banner">
        {/* Gráficos vectoriales de ondas orgánicas en los colores de la paleta */}
        <svg className="hero-wave-svg" viewBox="0 0 1000 360" preserveAspectRatio="none">
          <path
            d="M-50,220 C180,140 280,310 520,200 C740,110 840,290 1050,180 L1050,360 L-50,360 Z"
            fill="#B9DEF8"
            opacity="0.6"
          />
          <path
            d="M-50,270 C220,190 320,340 560,240 C780,160 880,330 1050,230 L1050,360 L-50,360 Z"
            fill="#CFE7FF"
            opacity="0.8"
          />
          <path
            d="M-50,300 C150,260 350,350 600,280 C800,210 900,340 1050,280 L1050,360 L-50,360 Z"
            fill="#FFF3E6"
            opacity="0.7"
          />
          <path
            d="M-50,130 C200,60 300,220 540,120 C750,40 850,200 1050,100 L1050,0 L-50,0 Z"
            fill="#EAF4FF"
            opacity="0.4"
          />
          {/* Ondas suaves de contorno */}
          <path
            d="M-20,230 C200,160 300,320 530,220 C760,130 850,300 1020,200"
            fill="none"
            stroke="#9BC8EF"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M-20,250 C230,180 330,330 570,240 C790,170 870,320 1020,230"
            fill="none"
            stroke="#C4E7D7"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        {/* Tarjeta Flotante Blanca Central (Idéntica a la maqueta) */}
        <div className="hero-floating-card">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#5A8DBA', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            <Calendar size={14} /> {formattedToday}
          </div>
          
          <h2 className="hero-title">Tu Camino de Discipulado</h2>
          
          <p className="hero-subtitle">
            Creciendo en fe, palabra y servicio. Confirma tu asistencia a la clase de hoy con tu teléfono móvil.
          </p>

          <button
            type="button"
            className="btn-pill-warm"
            onClick={scrollToForm}
          >
            Fichar Asistencia <ArrowDown size={18} />
          </button>
        </div>
      </section>

      {/* 2. TARJETAS DE NIVELES (Estilo 3 Tarjetas Redondeadas de la Maqueta) */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Selecciona tu Nivel de Formación
          </span>
        </div>

        <div className="levels-cards-grid">
          {levels.map((level, idx) => {
            const isSelected = selectedLevelId === level.id;
            const levelTeachers = teachers.filter(t => 
              (Array.isArray(level.teacherIds) && level.teacherIds.includes(t.id)) || t.id === level.teacherId
            );

            return (
              <div
                key={level.id}
                className={`level-card-mockup ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedLevelId(level.id);
                  setErrorMessage('');
                  setAlreadyCheckedIn(null);
                }}
              >
                {/* Círculo de icono */}
                <div className="level-card-icon-circle">
                  {getLevelIcon(idx)}
                </div>

                {/* Título de la tarjeta */}
                <h3 className="level-card-title">
                  {level.name.split('-')[0].trim()}
                </h3>

                {/* Subtítulo / Descripción */}
                <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {level.name.split('-')[1]?.trim() || level.name}
                </p>

                <div className="level-card-meta">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Clock size={13} color="#7FB7E6" />
                    <span>{level.dayOfWeek} • {level.time}</span>
                  </div>
                  {levelTeachers.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                      {levelTeachers.length > 1 ? 'Profs. ' : 'Prof. '}
                      {levelTeachers.map(t => t.name.split(' ')[0] + ' ' + (t.name.split(' ')[1] || '')).join(', ')}
                    </div>
                  )}
                </div>

                {/* Botón en pastilla de la tarjeta (como 'Learn More' en la maqueta) */}
                <button
                  type="button"
                  className="card-learn-more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLevelId(level.id);
                    setErrorMessage('');
                    setAlreadyCheckedIn(null);
                    scrollToForm();
                  }}
                >
                  {isSelected ? '✓ Seleccionado' : 'Elegir Nivel'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FORMULARIO DE FICHAJE (Tarjeta Limpia y Estilizada) */}
      <section ref={formRef} className="checkin-form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1.5px solid var(--border-card)', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={22} color="#7FB7E6" /> Fichaje de Alumno
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
              Nivel seleccionado: <strong style={{ color: '#1A365D' }}>{currentLevel?.name}</strong>
            </p>
          </div>

          <span className="badge badge-level" style={{ padding: '6px 14px' }}>
            <Clock size={14} /> {currentLevel?.dayOfWeek} • {currentLevel?.time}
          </span>
        </div>

        {/* Mensaje de ya fichado hoy */}
        {alreadyCheckedIn && (
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            background: 'var(--success-bg)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--success-text)', fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>
              <CheckCircle2 size={22} /> ¡Ya has registrado tu asistencia hoy!
            </div>
            <p style={{ color: '#065F46', fontSize: '0.9rem' }}>
              Hola <strong>{alreadyCheckedIn.student.name}</strong>, tu asistencia quedó confirmada a las <strong>{alreadyCheckedIn.time}</strong> en {currentLevel?.name}. ¡Que tengas una excelente clase!
            </p>
          </div>
        )}

        {/* Mensaje de error */}
        {errorMessage && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            background: 'var(--danger-bg)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger-text)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '10px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} color="#7FB7E6" /> Tu Número de Teléfono
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
                <Lock size={15} color="#7FB7E6" /> Tu Contraseña de Estudiante
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
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="submit"
              className="btn-pill-warm pulse-success"
              style={{ width: '100%', maxWidth: '380px', padding: '14px 28px', fontSize: '1.08rem' }}
            >
              <UserCheck size={22} /> Confirmar Mi Asistencia
            </button>
          </div>
        </form>
      </section>

      {/* Pantalla Modal / Overlay de Éxito al Fichar */}
      {justCheckedIn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '36px 28px' }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '2px solid rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle2 size={46} />
            </div>

            <span className="badge badge-present" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
              ✓ Asistencia Registrada con Éxito
            </span>

            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '6px' }}>
              ¡Hola, {justCheckedIn.student.name}!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '22px' }}>
              Tu presencia en <strong>{justCheckedIn.level.name}</strong> ha quedado registrada a las <strong>{justCheckedIn.time}</strong>.
            </p>

            {/* Versículo de bendición */}
            <div style={{
              background: 'var(--c-warm-cream)',
              borderLeft: '4px solid var(--c-warm-peach)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              marginBottom: '26px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8F5826', fontSize: '0.78rem', fontWeight: '800', marginBottom: '6px' }}>
                <Sparkles size={14} /> PALABRA DE HOY
              </div>
              <p style={{ fontSize: '0.92rem', fontStyle: 'italic', color: '#4A3525', marginBottom: '4px', lineHeight: '1.5' }}>
                {justCheckedIn.verse.text}
              </p>
              <span style={{ fontSize: '0.8rem', color: '#8F5826', fontWeight: '700' }}>
                — {justCheckedIn.verse.ref}
              </span>
            </div>

            <button 
              className="btn-pill-blue btn-lg" 
              style={{ width: '100%' }}
              onClick={handleResetForAnother}
            >
              <RotateCcw size={18} /> Entendido / Fichar a otro alumno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
