// src/components/admin/AbsenceTracker.jsx
// Control de Asistencias, Inasistencias y Seguimiento Pastoral por WhatsApp

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Phone, 
  Send, 
  MessageCircle, 
  Filter, 
  Download,
  Clock,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { exportExcelReport } from '../../services/excelExportService';

export default function AbsenceTracker({ data }) {
  const { levels = [], students = [], attendance = [], teachers = [] } = data;

  // Fecha seleccionada (por defecto hoy)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  // Nivel seleccionado
  const [selectedLevelId, setSelectedLevelId] = useState(() => levels[0]?.id || '');
  // Filtro de estado en la lista (todos, solo ausentes, solo presentes)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Nivel y profesor activo
  const currentLevel = useMemo(() => {
    return levels.find(l => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  const currentTeachers = useMemo(() => {
    return teachers.filter(t => 
      (Array.isArray(currentLevel?.teacherIds) && currentLevel.teacherIds.includes(t.id)) || t.id === currentLevel?.teacherId
    );
  }, [teachers, currentLevel]);
  const currentTeacher = currentTeachers[0] || null;

  // Estudiantes inscritos activos en este nivel
  const levelStudents = useMemo(() => {
    return students.filter(s => s.levelId === selectedLevelId && s.status === 'active');
  }, [students, selectedLevelId]);

  // Obtener todas las fechas únicas registradas para este nivel (ordenadas de más reciente a más antigua)
  const distinctSessionDates = useMemo(() => {
    const dates = new Set(
      attendance
        .filter(a => a.levelId === selectedLevelId)
        .map(a => a.date)
    );
    // Incluir la fecha seleccionada actual
    dates.add(selectedDate);
    return Array.from(dates).sort().reverse();
  }, [attendance, selectedLevelId, selectedDate]);

  // Calcular faltas consecutivas previas de un estudiante en este nivel
  const calculateConsecutiveAbsences = (studentId) => {
    // Buscar sesiones anteriores a la fecha seleccionada
    const pastDates = distinctSessionDates.filter(d => d < selectedDate);
    let consecutiveCount = 0;

    for (const d of pastDates) {
      const rec = attendance.find(a => a.studentId === studentId && a.levelId === selectedLevelId && a.date === d);
      if (!rec || rec.status === 'absent') {
        consecutiveCount++;
      } else if (rec.status === 'present') {
        break; // Rompe la racha de faltas
      }
    }
    return consecutiveCount;
  };

  // Mapeo del estado de asistencia de cada alumno para la fecha seleccionada
  const studentRows = useMemo(() => {
    return levelStudents.map(student => {
      const record = attendance.find(
        a => a.studentId === student.id && a.levelId === selectedLevelId && a.date === selectedDate
      );
      
      const isPresent = record ? record.status === 'present' : false;
      const pastConsecutive = calculateConsecutiveAbsences(student.id);
      // Total de faltas acumulando hoy si no ha asistido
      const totalConsecutive = isPresent ? 0 : pastConsecutive + 1;

      return {
        student,
        record,
        isPresent,
        pastConsecutive,
        totalConsecutive,
      };
    });
  }, [levelStudents, attendance, selectedLevelId, selectedDate, distinctSessionDates]);

  // Resumen numérico
  const stats = useMemo(() => {
    const total = studentRows.length;
    const presents = studentRows.filter(r => r.isPresent).length;
    const absents = total - presents;
    const percent = total > 0 ? Math.round((presents / total) * 100) : 0;
    const atRisk = studentRows.filter(r => !r.isPresent && r.totalConsecutive >= 2).length;

    return { total, presents, absents, percent, atRisk };
  }, [studentRows]);

  // Filtrado de filas
  const filteredRows = useMemo(() => {
    if (statusFilter === 'PRESENT') return studentRows.filter(r => r.isPresent);
    if (statusFilter === 'ABSENT') return studentRows.filter(r => !r.isPresent);
    if (statusFilter === 'AT_RISK') return studentRows.filter(r => !r.isPresent && r.totalConsecutive >= 2);
    return studentRows;
  }, [studentRows, statusFilter]);

  // Cambiar manualmente asistencia (marcar presente o ausente)
  const toggleAttendance = (studentId, currentIsPresent) => {
    const newStatus = currentIsPresent ? 'absent' : 'present';
    storageService.recordAttendance({
      studentId,
      levelId: selectedLevelId,
      date: selectedDate,
      status: newStatus,
      checkedInBy: 'admin',
    });
  };

  // Generador de enlace de WhatsApp con mensaje pastoral cariñoso
  const getWhatsAppLink = (student, consecutive) => {
    if (!student.phone) return null;
    const cleanPhone = student.phone.replace(/[^0-9]/g, '');

    const levelName = currentLevel?.name.split('-')[0].trim() || 'Discipulado';
    let text = `Hola ${student.name.split(' ')[0]}, ¡Dios te bendiga! Te extrañamos hoy en nuestra clase de ${levelName}.`;
    
    if (consecutive >= 2) {
      text += ` Notamos que no pudiste estar con nosotros las últimas clases y queríamos saber si todo está bien contigo y tu familia. ¿Podemos orar por ti en algo especial? Te enviamos un gran abrazo.`;
    } else {
      text += ` Esperamos que todo esté bien. ¡Nos vemos con mucho gozo en la próxima clase! Un saludo fraternal.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      {/* Encabezado y Selector de Nivel / Fecha */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem' }}>Control de Asistencia e Inasistencias</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Supervisa la asistencia por sesión, detecta estudiantes con faltas reiteradas y haz seguimiento pastoral.
            </p>
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => exportExcelReport(selectedLevelId)}
            title="Descargar historial de este nivel en Excel (.xlsx)"
          >
            <Download size={15} /> Exportar Excel
          </button>
        </div>

        {/* Filtros de Nivel y Fecha */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nivel de Discipulado</label>
            <select
              className="form-select"
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha de la Clase / Sesión</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de la Sesión */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Inscritos</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>{stats.total}</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.78rem', color: '#34d399', textTransform: 'uppercase', fontWeight: '700' }}>Presentes Hoy</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
            {stats.presents} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({stats.percent}%)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span style={{ fontSize: '0.78rem', color: '#f87171', textTransform: 'uppercase', fontWeight: '700' }}>Ausentes Hoy</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171', marginTop: '4px' }}>{stats.absents}</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: stats.atRisk > 0 ? 'rgba(245, 158, 11, 0.5)' : 'var(--border-card)' }}>
          <span style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: '700' }}>Faltas Reiteradas</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>
            {stats.atRisk}
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Estado */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('ALL')}
        >
          Todos ({studentRows.length})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'PRESENT' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('PRESENT')}
        >
          Presentes ({stats.presents})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'ABSENT' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('ABSENT')}
        >
          Ausentes ({stats.absents})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'AT_RISK' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('AT_RISK')}
          style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
        >
          ⚠️ En Riesgo (≥2 faltas) ({stats.atRisk})
        </button>
      </div>

      {/* Lista / Roll-call de Estudiantes */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border-card)', background: 'var(--c-sky-lightest)', color: '#1A365D' }}>
              <th style={{ padding: '12px 16px' }}>Estudiante</th>
              <th style={{ padding: '12px 16px' }}>Estado para {selectedDate}</th>
              <th style={{ padding: '12px 16px' }}>Hora Fichaje</th>
              <th style={{ padding: '12px 16px' }}>Faltas Consecutivas</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Seguimiento WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map(({ student, record, isPresent, totalConsecutive }) => {
                const waLink = getWhatsAppLink(student, totalConsecutive);
                const timeStr = record?.timestamp 
                  ? new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <tr 
                    key={student.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-card)',
                      background: !isPresent && totalConsecutive >= 2 ? '#FEF2F2' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ID: {student.documentId || '—'} {student.phone && `• ${student.phone}`}
                      </div>
                    </td>

                    {/* Botón rápido para alternar Presente / Ausente */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        type="button"
                        onClick={() => toggleAttendance(student.id, isPresent)}
                        className={`btn btn-sm ${isPresent ? 'btn-success' : 'btn-danger-outline'}`}
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle size={14} /> Presente
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Marcar Presente
                          </>
                        )}
                      </button>
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {isPresent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                          <Clock size={13} /> {timeStr} ({record?.checkedInBy === 'student_self' ? 'Móvil Alumno' : 'Profesor'})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>No ha fichado</span>
                      )}
                    </td>

                    {/* Semáforo de Faltas */}
                    <td style={{ padding: '12px 16px' }}>
                      {isPresent ? (
                        <span className="badge badge-present">Asistió</span>
                      ) : totalConsecutive >= 2 ? (
                        <span className="badge badge-absent" title="Alerta: 2 o más faltas seguidas">
                          <AlertCircle size={12} /> {totalConsecutive} faltas seguidas (Alerta)
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          1 falta
                        </span>
                      )}
                    </td>

                    {/* Botón WhatsApp de Seguimiento Pastoral */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isPresent && student.phone ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ textDecoration: 'none' }}
                          title="Contactar con mensaje pastoral prediseñado"
                        >
                          <MessageCircle size={14} /> Contactar
                        </a>
                      ) : isPresent ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>Al día</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay estudiantes que coincidan con el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
