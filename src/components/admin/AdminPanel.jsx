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
      {/* Subnavegación del Panel Admin */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-card)',
        scrollbarWidth: 'none',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{
                fontSize: '0.85rem',
                padding: '8px 14px',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-full)'
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
