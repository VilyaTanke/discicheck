// src/components/admin/AbsenceTracker.jsx
// Control de Asistencias, Inasistencias y Seguimiento Pastoral por WhatsApp
// Enfocado en las clases reales asignadas e impartidas por nivel

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
  Sparkles,
  BookOpen,
  Users,
  CheckSquare,
  TrendingUp,
  Info
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { exportExcelReport } from '../../services/excelExportService';

export default function AbsenceTracker({ data, currentTeacher = null }) {
  const { levels = [], students = [], attendance = [], teachers = [] } = data;

  // Determinar si quien visualiza es admin (sin currentTeacher) o profesor
  const isAdmin = currentTeacher === null;

  // Niveles visibles: si es profesor, solo los que tiene asignados
  const visibleLevels = useMemo(() => {
    if (isAdmin) return levels;
    return levels.filter(l =>
      (Array.isArray(l.teacherIds) && l.teacherIds.includes(currentTeacher?.id)) ||
      l.teacherId === currentTeacher?.id
    );
  }, [levels, isAdmin, currentTeacher]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Nivel seleccionado (por defecto el primero de los niveles visibles)
  const [selectedLevelId, setSelectedLevelId] = useState(() => {
    const firstLevel = isAdmin ? levels[0] : (
      levels.find(l =>
        (Array.isArray(l.teacherIds) && l.teacherIds.includes(currentTeacher?.id)) ||
        l.teacherId === currentTeacher?.id
      )
    );
    return firstLevel?.id || '';
  });

  // Fechas reales en las que se han impartido clases para este nivel (donde hay al menos un registro de fichaje/asistencia)
  const heldClassDates = useMemo(() => {
    if (!selectedLevelId) return [];
    const datesSet = new Set(
      attendance
        .filter(a => a.levelId === selectedLevelId)
        .map(a => a.date)
    );
    return Array.from(datesSet).sort().reverse(); // Fechas ordenadas descendente (más reciente primero)
  }, [attendance, selectedLevelId]);

  // Fecha seleccionada: por defecto hoy si ya hay fichajes hoy, o la última clase impartida, o hoy
  const [selectedDate, setSelectedDate] = useState(() => {
    const firstLevel = isAdmin ? levels[0] : (
      levels.find(l =>
        (Array.isArray(l.teacherIds) && l.teacherIds.includes(currentTeacher?.id)) ||
        l.teacherId === currentTeacher?.id
      )
    );
    const firstLvlId = firstLevel?.id;
    const lvlDates = Array.from(new Set(
      attendance.filter(a => a.levelId === firstLvlId).map(a => a.date)
    )).sort().reverse();
    
    const today = new Date().toISOString().slice(0, 10);
    if (lvlDates.includes(today)) return today;
    if (lvlDates.length > 0) return lvlDates[0];
    return today;
  });

  // Filtro de estado en la lista (todos, solo presentes, solo ausentes/pendientes, en riesgo)
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Nivel y profesores asignados al nivel actual
  const currentLevel = useMemo(() => {
    return levels.find(l => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  const currentTeachers = useMemo(() => {
    return teachers.filter(t => 
      (Array.isArray(currentLevel?.teacherIds) && currentLevel.teacherIds.includes(t.id)) || t.id === currentLevel?.teacherId
    );
  }, [teachers, currentLevel]);

  // Manejo de cambio de nivel: reajustar fecha por defecto inteligentemente
  const handleLevelChange = (lvlId) => {
    setSelectedLevelId(lvlId);
    const lvlDates = Array.from(new Set(
      attendance.filter(a => a.levelId === lvlId).map(a => a.date)
    )).sort().reverse();

    if (lvlDates.includes(todayStr)) {
      setSelectedDate(todayStr);
    } else if (lvlDates.length > 0) {
      setSelectedDate(lvlDates[0]);
    } else {
      setSelectedDate(todayStr);
    }
    setStatusFilter('ALL');
  };

  // Estudiantes inscritos activos en este nivel
  const levelStudents = useMemo(() => {
    return students.filter(s => s.levelId === selectedLevelId && s.status === 'active');
  }, [students, selectedLevelId]);

  // Métricas del curso para este nivel
  const totalClasses = Number(currentLevel?.totalClasses) || 12;
  const classesGiven = heldClassDates.length;
  const classesRemaining = Math.max(0, totalClasses - classesGiven);
  const levelProgressPercent = totalClasses > 0 ? Math.min(100, Math.round((classesGiven / totalClasses) * 100)) : 0;

  // Estado de la fecha seleccionada respecto a las clases impartidas
  const isSelectedDateHeld = heldClassDates.includes(selectedDate);
  const isToday = selectedDate === todayStr;
  const isFuture = selectedDate > todayStr;
  const hasCheckinsOnSelectedDate = attendance.some(a => a.levelId === selectedLevelId && a.date === selectedDate);

  // Calcular faltas consecutivas de un estudiante basándose EXCLUSIVAMENTE en clases reales impartidas
  const calculateConsecutiveAbsences = (studentId) => {
    // Clases dadas anteriores a la fecha seleccionada
    const pastDates = heldClassDates.filter(d => d < selectedDate); // ordenadas de más reciente a más antigua
    let consecutiveCount = 0;

    // Registro del estudiante para la fecha seleccionada
    const currentRec = attendance.find(
      a => a.studentId === studentId && a.levelId === selectedLevelId && a.date === selectedDate
    );

    // 1. Si en la fecha seleccionada asistió, la racha es 0
    if (currentRec?.status === 'present') {
      return 0;
    }

    // 2. Si la fecha seleccionada fue una clase concluida en el pasado y no asistió:
    const isPastHeldClass = isSelectedDateHeld && selectedDate < todayStr;
    if (isPastHeldClass && (!currentRec || currentRec.status === 'absent')) {
      consecutiveCount = 1;
    } else if (currentRec?.status === 'absent') {
      // Si fue explícitamente marcado como ausente
      consecutiveCount = 1;
    }
    // NOTA CLAVE: Si la fecha es hoy o futura o no ha tenido clase aún, NO suma falta por la fecha seleccionada

    // 3. Revisar en orden hacia atrás las clases impartidas pasadas
    for (const d of pastDates) {
      const rec = attendance.find(
        a => a.studentId === studentId && a.levelId === selectedLevelId && a.date === d
      );
      if (!rec || rec.status === 'absent') {
        consecutiveCount++;
      } else if (rec.status === 'present') {
        break; // Rompe la racha de faltas
      }
    }

    return consecutiveCount;
  };

  // Mapeo detallado de estudiantes con su asistencia para la fecha seleccionada y su récord global
  const studentRows = useMemo(() => {
    return levelStudents.map(student => {
      const record = attendance.find(
        a => a.studentId === student.id && a.levelId === selectedLevelId && a.date === selectedDate
      );
      
      const isPresent = record ? record.status === 'present' : false;
      const isAbsent = record ? record.status === 'absent' : false;
      const isJustified = record ? record.status === 'justified' : false;
      
      const consecutiveAbsences = calculateConsecutiveAbsences(student.id);

      // Conteo de asistencias en las clases ya dadas
      const attendedHeldClasses = heldClassDates.filter(d => {
        const r = attendance.find(a => a.studentId === student.id && a.levelId === selectedLevelId && a.date === d);
        return r && r.status === 'present';
      }).length + (isPresent && !heldClassDates.includes(selectedDate) ? 1 : 0);

      const effectiveClassesGiven = heldClassDates.length + (!heldClassDates.includes(selectedDate) && isPresent ? 1 : 0);
      const attendancePercent = effectiveClassesGiven > 0 ? Math.round((attendedHeldClasses / effectiveClassesGiven) * 100) : 100;

      return {
        student,
        record,
        isPresent,
        isAbsent,
        isJustified,
        consecutiveAbsences,
        attendedHeldClasses,
        effectiveClassesGiven,
        attendancePercent,
      };
    });
  }, [levelStudents, attendance, selectedLevelId, selectedDate, heldClassDates, todayStr]);

  // Resumen estadístico
  const stats = useMemo(() => {
    const total = studentRows.length;
    const presents = studentRows.filter(r => r.isPresent).length;
    const pendingToday = studentRows.filter(r => !r.isPresent && !r.isAbsent).length;
    const absents = studentRows.filter(r => r.isAbsent || (!r.isPresent && selectedDate < todayStr && isSelectedDateHeld)).length;
    const percent = total > 0 ? Math.round((presents / total) * 100) : 0;
    const atRisk = studentRows.filter(r => r.consecutiveAbsences >= 2).length;

    return { total, presents, pendingToday, absents, percent, atRisk };
  }, [studentRows, selectedDate, todayStr, isSelectedDateHeld]);

  // Filtrado de filas
  const filteredRows = useMemo(() => {
    if (statusFilter === 'PRESENT') return studentRows.filter(r => r.isPresent);
    if (statusFilter === 'ABSENT') {
      return studentRows.filter(r => r.isAbsent || (!r.isPresent && (selectedDate < todayStr || isSelectedDateHeld)));
    }
    if (statusFilter === 'PENDING') {
      return studentRows.filter(r => !r.isPresent && !r.isAbsent);
    }
    if (statusFilter === 'AT_RISK') {
      return studentRows.filter(r => r.consecutiveAbsences >= 2);
    }
    return studentRows;
  }, [studentRows, statusFilter, selectedDate, todayStr, isSelectedDateHeld]);

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
  const getWhatsAppLink = (student, consecutive, isPresent) => {
    if (!student.phone) return null;
    const cleanPhone = student.phone.replace(/[^0-9]/g, '');

    const levelName = currentLevel?.name.split('-')[0].trim() || 'Discipulado';
    let text = `Hola ${student.name.split(' ')[0]}, ¡Dios te bendiga!`;
    
    if (consecutive >= 2) {
      text += ` Notamos que no pudiste estar con nosotros en las últimas clases de ${levelName} y queríamos saber si todo está bien contigo y tu familia. ¿Podemos orar por ti en algo especial? Te enviamos un gran abrazo.`;
    } else if (!isPresent) {
      text += ` Te extrañamos hoy en nuestra clase de ${levelName}. Esperamos que todo esté bien. ¡Nos vemos con mucho gozo en la próxima clase! Un saludo fraternal.`;
    } else {
      text += ` ¡Qué alegría contar con tu presencia en la clase de ${levelName}! Que tengas una semana muy bendecida.`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      {/* Encabezado Principal y Selector de Nivel */}
      <div className="glass-panel" style={{ padding: '22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--c-sky-lightest)',
                color: '#2A5D8A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '1.35rem', margin: 0 }}>Control de Asistencia e Inasistencias</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
              Seguimiento por sesiones reales asignadas. Las faltas solo se contabilizan sobre clases ya impartidas.
            </p>
          </div>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => exportExcelReport(selectedLevelId)}
            title="Descargar historial de este nivel en Excel (.xlsx)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={15} /> Exportar Excel
          </button>
        </div>

        {/* Selector de Nivel y Ficha Informativa del Nivel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '18px' }}>
          {/* Selector de Nivel */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
              Seleccionar Nivel de Discipulado
            </label>
            <select
              className="form-select"
              value={selectedLevelId}
              onChange={(e) => handleLevelChange(e.target.value)}
              style={{ fontSize: '0.95rem', padding: '10px 14px', fontWeight: '600' }}
              disabled={visibleLevels.length === 0}
            >
              {visibleLevels.length === 0 ? (
                <option value="">Sin niveles asignados</option>
              ) : (
                visibleLevels.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))
              )}
            </select>

            {/* Días y Horarios asignados para este nivel */}
            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="#3b82f6" /> 
                <strong>Día y Horario:</strong> {currentLevel?.dayOfWeek || 'Sin día'} ({currentLevel?.time || 'Horario por definir'})
              </span>
              {currentLevel?.room && (
                <span>• <strong>Lugar:</strong> {currentLevel.room}</span>
              )}
            </div>

            {/* Profesores del Nivel */}
            <div style={{ marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong>Profesor(es):</strong> {currentTeachers.length > 0 
                ? currentTeachers.map(t => t.name).join(', ') 
                : 'Sin profesor asignado'}
            </div>
          </div>

          {/* Tarjeta de Progreso del Nivel: Clases dadas vs faltantes */}
          <div style={{ 
            background: 'var(--c-sky-lightest)', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            border: '1.5px solid var(--border-card)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#1A365D' }}>
                Progreso del Nivel
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2563eb' }}>
                {levelProgressPercent}% completado
              </span>
            </div>

            {/* Métricas: Dadas, Faltan, Total */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Clases Dadas</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10b981' }}>{classesGiven}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Faltan</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#f59e0b' }}>{classesRemaining}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Curso</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>{totalClasses}</div>
              </div>
            </div>

            {/* Barra de Progreso Visual */}
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${levelProgressPercent}%`, 
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Barra de Selección de Sesión / Fecha de la Clase */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '14px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-card)'
        }}>
          {/* Selector de Sesiones Impartidas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Sesión a Visualizar:
            </span>

            {heldClassDates.length > 0 && (
              <select
                className="form-select form-select-sm"
                value={heldClassDates.includes(selectedDate) ? selectedDate : ''}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                style={{ width: 'auto', minWidth: '220px', fontWeight: '600' }}
              >
                <option value="" disabled>Seleccionar clase impartida...</option>
                {heldClassDates.map((date, idx) => {
                  const attendees = attendance.filter(a => a.levelId === selectedLevelId && a.date === date && a.status === 'present').length;
                  const isLatest = idx === 0;
                  return (
                    <option key={date} value={date}>
                      {isLatest ? '⭐ Última clase: ' : '📅 '} {date} ({attendees} asistentes)
                    </option>
                  );
                })}
              </select>
            )}

            {/* Botón rápido para ir a la clase de Hoy */}
            <button
              type="button"
              className={`btn btn-sm ${selectedDate === todayStr ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedDate(todayStr)}
            >
              🟢 Clase de Hoy ({todayStr})
            </button>
          </div>

          {/* Selector Manual de Fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Fecha específica:
            </label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Indicador contextual de la fecha seleccionada */}
        <div style={{ marginTop: '12px', fontSize: '0.82rem' }}>
          {isSelectedDateHeld ? (
            <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
              <CheckCircle size={14} /> Clase impartida registrada el {selectedDate} ({stats.presents} alumnos asistieron)
            </span>
          ) : isToday ? (
            <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
              <Clock size={14} /> Sesión de hoy en curso / abierta. Los alumnos pendientes no computan falta hasta cerrar asistencia.
            </span>
          ) : isFuture ? (
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} /> Fecha futura programada ({selectedDate}). Clase aún no impartida.
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Info size={14} /> Fecha sin registros previos de asistencia para este nivel.
            </span>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas de la Sesión Seleccionada */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Alumnos Activos
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>{stats.total}</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={{ fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', fontWeight: '700' }}>
            Presentes
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
            {stats.presents} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({stats.percent}%)</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: isToday ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
          <span style={{ fontSize: '0.78rem', color: isToday ? '#3b82f6' : '#ef4444', textTransform: 'uppercase', fontWeight: '700' }}>
            {isToday ? 'Pendientes de Fichar' : 'Ausentes'}
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: isToday ? '#3b82f6' : '#ef4444', marginTop: '4px' }}>
            {isToday ? stats.pendingToday : stats.absents}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', borderColor: stats.atRisk > 0 ? 'rgba(245, 158, 11, 0.5)' : 'var(--border-card)' }}>
          <span style={{ fontSize: '0.78rem', color: '#d97706', textTransform: 'uppercase', fontWeight: '700' }}>
            En Riesgo (≥2 faltas)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
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
        {isToday ? (
          <button
            className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pendientes ({stats.pendingToday})
          </button>
        ) : (
          <button
            className={`btn btn-sm ${statusFilter === 'ABSENT' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter('ABSENT')}
          >
            Ausentes ({stats.absents})
          </button>
        )}
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
              <th style={{ padding: '12px 16px' }}>Asistencia en Clases Dadas</th>
              <th style={{ padding: '12px 16px' }}>Faltas Consecutivas</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Seguimiento WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map(({ 
                student, 
                record, 
                isPresent, 
                isAbsent, 
                consecutiveAbsences, 
                attendedHeldClasses, 
                effectiveClassesGiven, 
                attendancePercent 
              }) => {
                const waLink = getWhatsAppLink(student, consecutiveAbsences, isPresent);
                const timeStr = record?.timestamp 
                  ? new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <tr 
                    key={student.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-card)',
                      background: consecutiveAbsences >= 2 ? '#FEF2F2' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Estudiante */}
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
                        className={`btn btn-sm ${isPresent ? 'btn-success' : 'btn-outline'}`}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.82rem',
                          borderColor: isPresent ? undefined : isAbsent ? '#ef4444' : undefined,
                          color: isPresent ? undefined : isAbsent ? '#ef4444' : undefined
                        }}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle size={14} /> Presente
                          </>
                        ) : isAbsent ? (
                          <>
                            <XCircle size={14} /> Falta (Clic marcar presente)
                          </>
                        ) : isToday ? (
                          <>
                            <Clock size={14} /> Marcar Presente
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} /> Marcar Presente
                          </>
                        )}
                      </button>
                    </td>

                    {/* Hora de Fichaje */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {isPresent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600' }}>
                          <Clock size={13} /> {timeStr} ({record?.checkedInBy === 'student_self' ? 'Móvil Alumno' : 'Profesor'})
                        </span>
                      ) : isAbsent ? (
                        <span style={{ color: '#ef4444', fontWeight: '600' }}>Marcado Ausente</span>
                      ) : isToday ? (
                        <span style={{ color: '#3b82f6', fontStyle: 'italic' }}>Pendiente de fichar</span>
                      ) : isSelectedDateHeld ? (
                        <span style={{ color: '#ef4444' }}>No asistió</span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>Sin registro</span>
                      )}
                    </td>

                    {/* Asistencia Acumulada en Clases Dadas */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.88rem', color: attendancePercent >= 75 ? '#059669' : attendancePercent >= 50 ? '#d97706' : '#dc2626' }}>
                          {attendedHeldClasses} de {effectiveClassesGiven}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ({attendancePercent}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {classesRemaining > 0 ? `Quedan ${classesRemaining} clases del curso` : 'Curso completado'}
                      </div>
                    </td>

                    {/* Semáforo de Faltas Consecutivas */}
                    <td style={{ padding: '12px 16px' }}>
                      {consecutiveAbsences >= 2 ? (
                        <span className="badge badge-absent" title="Alerta pastoral: 2 o más faltas seguidas en clases impartidas">
                          <AlertCircle size={12} /> {consecutiveAbsences} faltas seguidas (Alerta)
                        </span>
                      ) : consecutiveAbsences === 1 ? (
                        <span className="badge badge-warning" title="1 falta en la última clase impartida">
                          1 falta previa
                        </span>
                      ) : (
                        <span className="badge badge-present" title="Estudiante al día">
                          ✓ Al día (0 faltas)
                        </span>
                      )}
                    </td>

                    {/* Botón WhatsApp de Seguimiento Pastoral */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {student.phone ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-whatsapp btn-sm"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          title="Contactar con mensaje pastoral prediseñado"
                        >
                          <MessageCircle size={14} /> Contactar
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
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

