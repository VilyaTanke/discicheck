// src/components/admin/AdminPanel.jsx
// Panel Principal de Administración del Discipulado

import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  UserCheck, 
  GraduationCap, 
  Settings, 
  ClipboardList, 
  CalendarCheck
} from 'lucide-react';
import LevelsManager from './LevelsManager';
import TeachersManager from './TeachersManager';
import StudentsManager from './StudentsManager';
import AbsenceTracker from './AbsenceTracker';
import BackupSettings from './BackupSettings';

export default function AdminPanel({ data }) {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: 'Inasistencias y Faltas', icon: CalendarCheck },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'levels', label: 'Niveles', icon: Layers },
    { id: 'teachers', label: 'Profesores', icon: GraduationCap },
    { id: 'backup', label: 'Datos y Respaldo', icon: Settings },
  ];

  return (
    <div>
      {/* Subnavegación del Panel Admin en Pastillas */}
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

      {/* Renderizado de la pestaña activa */}
      {activeTab === 'attendance' && <AbsenceTracker data={data} />}
      {activeTab === 'students' && <StudentsManager data={data} />}
      {activeTab === 'levels' && <LevelsManager data={data} />}
      {activeTab === 'teachers' && <TeachersManager data={data} />}
      {activeTab === 'backup' && <BackupSettings data={data} />}
    </div>
  );
}
