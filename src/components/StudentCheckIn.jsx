// src/components/StudentCheckIn.jsx
// Vista de Fichaje para el estudiante desde su teléfono móvil

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  UserCheck, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertTriangle,
  RotateCcw,
  BookOpen
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
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

  // Estudiantes inscritos en este nivel
  const levelStudents = useMemo(() => {
    return students.filter(s => s.levelId === selectedLevelId && s.status === 'active');
  }, [students, selectedLevelId]);

  // Filtrado de estudiantes por búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return levelStudents.filter(s => 
      s.name.toLowerCase().includes(term) ||
      (s.documentId && s.documentId.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term))
    );
  }, [levelStudents, searchTerm]);

  // Verificar si el estudiante seleccionado ya fichó hoy
  const existingAttendance = useMemo(() => {
    if (!selectedStudent || !selectedLevelId) return null;
    return storageService.hasCheckedInToday(selectedStudent.id, selectedLevelId, todayStr);
  }, [selectedStudent, selectedLevelId, todayStr, data.attendance]);

  // Formato amigable de la fecha de hoy
  const formattedToday = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchTerm('');
  };

  const handleFichar = () => {
    if (!selectedStudent || !selectedLevelId) return;

    const result = storageService.recordAttendance({
      studentId: selectedStudent.id,
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
    } catch (e) {
      console.log('Confetti effect');
    }

    const randomVerse = INSPIRATIONAL_VERSES[Math.floor(Math.random() * INSPIRATIONAL_VERSES.length)];

    setJustCheckedIn({
      student: selectedStudent,
      level: currentLevel,
      time: new Date(result.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      verse: randomVerse
    });
  };

  const handleResetForAnother = () => {
    setSelectedStudent(null);
    setSearchTerm('');
    setJustCheckedIn(null);
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
        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Punto de Fichaje Móvil</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Selecciona tu curso de discipulado y confirma tu asistencia a la clase de hoy.
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
                  setSelectedStudent(null);
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

      {/* 2. Identificación del Estudiante */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
          2. Identifícate para fichar:
        </label>

        {!selectedStudent ? (
          <div>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Escribe tu nombre, apellido o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Resultados de Búsqueda / Autocompletado */}
            {searchTerm.trim().length > 0 && (
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                marginTop: '6px',
                boxShadow: 'var(--shadow-md)'
              }}>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: 'white' }}>{student.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          DNI/ID: {student.documentId || 'Sin ID'} • Tel: {student.phone || 'N/A'}
                        </div>
                      </div>
                      <span className="btn btn-outline btn-sm">Elegir</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No se encontró a ningún estudiante activo con ese nombre en este nivel.
                  </div>
                )}
              </div>
            )}

            {/* Acceso rápido a lista de alumnos de este nivel */}
            {!searchTerm && levelStudents.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                  Alumnos inscritos en este nivel ({levelStudents.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {levelStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Estudiante Seleccionado */
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: 'white',
                fontSize: '1.1rem'
              }}>
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'white' }}>
                  {selectedStudent.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ID: {selectedStudent.documentId || '—'} • {currentLevel.name.split('-')[0].trim()}
                </div>
              </div>
            </div>

            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedStudent(null)}
              title="Cambiar estudiante"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* 3. Botón de Fichaje o Mensaje de "Ya Fichó" */}
      {selectedStudent && (
        <div style={{ marginTop: '10px' }}>
          {existingAttendance ? (
            <div className="glass-panel" style={{
              padding: '18px',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', marginBottom: '6px' }}>
                <CheckCircle2 size={20} /> ¡Ya has fichado asistencia hoy!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Fichaste a las {new Date(existingAttendance.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¡Que disfrutes tu clase!
              </p>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                style={{ marginTop: '12px' }}
                onClick={() => setSelectedStudent(null)}
              >
                Fichar a otra persona
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-success btn-lg pulse-success"
              style={{ width: '100%', padding: '16px', fontSize: '1.15rem' }}
              onClick={handleFichar}
            >
              <UserCheck size={24} /> ¡FICHAR ASISTENCIA DE HOY!
            </button>
          )}
        </div>
      )}
    </div>
  );
}
