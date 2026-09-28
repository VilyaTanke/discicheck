// src/components/teacher/TeacherPanel.jsx
// Panel Exclusivo para Profesores y Facilitadores
// Acceso restringido únicamente a "Inasistencias y Faltas" y "Estudiantes"

import React, { useState } from 'react';
import { 
  Users, 
  CalendarCheck,
  GraduationCap,
  BookOpen,
  LogOut,
  Phone
} from 'lucide-react';
import StudentsManager from '../admin/StudentsManager';
import AbsenceTracker from '../admin/AbsenceTracker';

export default function TeacherPanel({ data, currentTeacher, onLogout }) {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: 'Inasistencias y Faltas', icon: CalendarCheck },
    { id: 'students', label: 'Estudiantes', icon: Users },
  ];

  // Niveles asignados a este profesor (soporta múltiples profesores por nivel)
  const assignedLevels = (data.levels || []).filter(l => 
    (Array.isArray(l.teacherIds) && l.teacherIds.includes(currentTeacher?.id)) || l.teacherId === currentTeacher?.id
  );

  return (
    <div>
      {/* Banner de Bienvenida del Profesor */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1.5px solid var(--c-sky-soft)',
        background: 'linear-gradient(135deg, rgba(235, 245, 255, 0.7), rgba(255, 255, 255, 0.9))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            flexShrink: 0
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#047857', background: '#D1FAE5', padding: '2px 8px', borderRadius: '12px' }}>
                Panel de Profesor
              </span>
              {currentTeacher?.phone && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {currentTeacher.phone}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: 'var(--text-main)' }}>
              {currentTeacher?.name || 'Profesor de Discipulado'}
            </h3>
            {assignedLevels.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cursos a su cargo:</span>
                {assignedLevels.map(lvl => (
                  <span key={lvl.id} className="badge badge-level" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    <BookOpen size={11} /> {lvl.name.split('-')[0].trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onLogout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        )}
      </div>

      {/* Subnavegación del Panel de Profesores en Pastillas */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginBottom: '24px',
        borderBottom: '1.5px solid var(--border-card)',
        scrollbarWidth: 'none',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-pill ${isActive ? 'active' : ''}`}
              style={{
                fontSize: '0.88rem',
                padding: '8px 18px',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--c-sky-accent)' : 'var(--c-sky-lightest)',
                color: isActive ? '#1A365D' : 'var(--text-main)',
                border: '1.5px solid var(--border-card)',
                boxShadow: isActive ? '0 4px 12px rgba(127, 183, 230, 0.35)' : 'none'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Renderizado de la pestaña activa (Solo Inasistencias y Estudiantes) */}
      {activeTab === 'attendance' && <AbsenceTracker data={data} />}
      {activeTab === 'students' && <StudentsManager data={data} currentTeacher={currentTeacher} />}
    </div>
  );
}
