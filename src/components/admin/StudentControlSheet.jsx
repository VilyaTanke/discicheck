// src/components/admin/StudentControlSheet.jsx
// Ficha de Control Individual del Alumno:
// 1. Historial y gestión de fichajes de cada clase (Asistencias, Faltas y Justificaciones)
// 2. Control de Deberes y Tareas (Marcar como entregado, fecha de entrega y notas del profesor)

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  CalendarCheck, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Phone, 
  MessageCircle, 
  IdCard, 
  UserCheck, 
  GraduationCap, 
  Edit3, 
  FileText,
  Calendar,
  Award,
  Sparkles,
  Check,
  RotateCcw
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function StudentControlSheet({ student, data, onBack, currentTeacher = null }) {
  const { levels = [], attendance = [], homework = [], homeworkSubmissions = [], teachers = [] } = data;

  const [activeTab, setActiveTab] = useState('homework'); // 'homework' | 'attendance'
  const [filterHomeworkStatus, setFilterHomeworkStatus] = useState('ALL'); // 'ALL' | 'completed' | 'pending'

  // Modal para registrar fichaje manual de clase
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    notes: '',
  });

  // Modal para crear nuevo deber/tarea
  const [isNewHomeworkModalOpen, setIsNewHomeworkModalOpen] = useState(false);
  const [newHomeworkForm, setNewHomeworkForm] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    levelId: student.levelId || levels[0]?.id || '',
  });

  // Modal para editar nota de entrega de deber
  const [editingNoteHomework, setEditingNoteHomework] = useState(null);
  const [noteFormText, setNoteFormText] = useState('');

  // Nivel y profesores asignados (soporta múltiples profesores)
  const level = levels.find(l => l.id === student.levelId);
  const assignedTeachers = (teachers || []).filter(t => 
    (Array.isArray(level?.teacherIds) && level.teacherIds.includes(t.id)) || t.id === level?.teacherId
  );

  // Historial de asistencias de este estudiante
  const studentAttendance = useMemo(() => {
    return (attendance || [])
      .filter(a => a.studentId === student.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, student.id]);

  // Cálculos de KPI de asistencia
  const totalClassesRecorded = studentAttendance.length;
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
  const justifiedCount = studentAttendance.filter(a => a.status === 'justified').length;
  const attendanceRate = totalClassesRecorded > 0 
    ? Math.round((presentCount / totalClassesRecorded) * 100) 
    : 100;

  // Deberes correspondientes al nivel del estudiante
  const levelHomework = useMemo(() => {
    return (homework || [])
      .filter(h => h.levelId === student.levelId || !h.levelId)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [homework, student.levelId]);

  // Deberes con su estado de entrega para este estudiante
  const homeworkWithStatus = useMemo(() => {
    return levelHomework.map(hw => {
      const submission = (homeworkSubmissions || []).find(
        s => s.studentId === student.id && s.homeworkId === hw.id
      );
      const isCompleted = !!submission?.isCompleted;
      return {
        ...hw,
        isCompleted,
        completedAt: submission?.completedAt || null,
        notes: submission?.notes || '',
        submissionId: submission?.id || null,
      };
    });
  }, [levelHomework, homeworkSubmissions, student.id]);

  // Filtrado de deberes
  const filteredHomework = useMemo(() => {
    if (filterHomeworkStatus === 'completed') {
      return homeworkWithStatus.filter(h => h.isCompleted);
    }
    if (filterHomeworkStatus === 'pending') {
      return homeworkWithStatus.filter(h => !h.isCompleted);
    }
    return homeworkWithStatus;
  }, [homeworkWithStatus, filterHomeworkStatus]);

  // Cálculos de KPI de deberes
  const totalHomework = homeworkWithStatus.length;
  const completedHomeworkCount = homeworkWithStatus.filter(h => h.isCompleted).length;
  const homeworkCompletionRate = totalHomework > 0 
    ? Math.round((completedHomeworkCount / totalHomework) * 100) 
    : 0;

  // Manejo de marcado de deber como entregado / pendiente
  const handleToggleHomework = (hwItem, forceStatus = null) => {
    const newStatus = forceStatus !== null ? forceStatus : !hwItem.isCompleted;
    storageService.toggleHomeworkSubmission({
      studentId: student.id,
      homeworkId: hwItem.id,
      isCompleted: newStatus,
      notes: hwItem.notes || (newStatus ? 'Entregado al profesor' : ''),
    });
  };

  // Abrir modal de nota del deber
  const openNoteModal = (hwItem) => {
    setEditingNoteHomework(hwItem);
    setNoteFormText(hwItem.notes || '');
  };

  // Guardar nota del profesor en el deber
  const handleSaveHomeworkNote = (e) => {
    e.preventDefault();
    if (!editingNoteHomework) return;
    storageService.toggleHomeworkSubmission({
      studentId: student.id,
      homeworkId: editingNoteHomework.id,
      isCompleted: true, // Si el profesor añade nota, se confirma como entregado
      notes: noteFormText,
    });
    setEditingNoteHomework(null);
  };

  // Crear nuevo deber
  const handleCreateHomework = (e) => {
    e.preventDefault();
    if (!newHomeworkForm.title.trim()) return;

    storageService.saveHomework({
      title: newHomeworkForm.title.trim(),
      description: newHomeworkForm.description.trim(),
      dueDate: newHomeworkForm.dueDate,
      levelId: newHomeworkForm.levelId || student.levelId,
    });

    setIsNewHomeworkModalOpen(false);
    setNewHomeworkForm({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      levelId: student.levelId,
    });
  };

  // Guardar asistencia manual de clase
  const handleSaveAttendance = (e) => {
    e.preventDefault();
    if (!attendanceForm.date) return;

    storageService.recordAttendance({
      studentId: student.id,
      levelId: student.levelId,
      date: attendanceForm.date,
      status: attendanceForm.status,
      checkedInBy: currentTeacher?.name ? `prof_${currentTeacher.name}` : 'profesor',
      notes: attendanceForm.notes,
    });

    setIsAttendanceModalOpen(false);
    setAttendanceForm({
      date: new Date().toISOString().slice(0, 10),
      status: 'present',
      notes: '',
    });
  };

  // Cambio rápido de estado en una fila de asistencia
  const handleQuickStatusChange = (attRecord, newStatus) => {
    storageService.recordAttendance({
      studentId: student.id,
      levelId: student.levelId,
      date: attRecord.date,
      status: newStatus,
      checkedInBy: currentTeacher?.name ? `prof_${currentTeacher.name}` : 'profesor',
      notes: attRecord.notes || '',
    });
  };

  // Eliminar registro de asistencia
  const handleDeleteAttendance = (attId, date) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro de asistencia del ${date}?`)) {
      storageService.deleteAttendance(attId);
    }
  };

  // Teléfono formateado para WhatsApp
  const cleanPhone = (student.phone || '').replace(/[^0-9]/g, '');

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Botón de Retorno */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}
        >
          <ArrowLeft size={16} /> Volver a Lista de Estudiantes
        </button>
      </div>

      {/* Tarjeta de Encabezado del Estudiante (Ficha de Perfil) */}
      <div className="glass-panel" style={{
        padding: '24px',
        marginBottom: '24px',
        border: '1.5px solid var(--c-sky-soft)',
        background: 'linear-gradient(135deg, rgba(235, 245, 255, 0.8), rgba(255, 255, 255, 0.95))',
        boxShadow: '0 8px 24px rgba(127, 183, 230, 0.15)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Avatar y Datos Personales */}
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: '800',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
              flexShrink: 0
            }}>
              {student.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)', fontWeight: '800' }}>
                  {student.name}
                </h2>
                <span className={`badge ${student.status === 'active' ? 'badge-present' : 'badge-absent'}`} style={{ textTransform: 'capitalize' }}>
                  {student.status === 'active' ? '● Alumno Activo' : student.status}
                </span>
                <span className="badge badge-level">
                  <BookOpen size={12} /> {level?.name.split('-')[0].trim() || 'Sin Nivel'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {student.documentId && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IdCard size={14} style={{ color: 'var(--c-sky-accent)' }} /> <strong>ID/Doc:</strong> {student.documentId}
                  </span>
                )}
                {student.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ color: 'var(--c-sky-accent)' }} />
                    <a 
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#059669', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Abrir chat en WhatsApp"
                    >
                      <MessageCircle size={14} /> {student.phone} (WhatsApp)
                    </a>
                  </span>
                )}
                {student.enrolledAt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} style={{ color: 'var(--c-sky-accent)' }} /> <strong>Inscrito:</strong> {student.enrolledAt}
                  </span>
                )}
              </div>

              {student.notes && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid var(--c-sky-accent)' }}>
                  Nota del estudiante: "{student.notes}"
                </div>
              )}
            </div>
          </div>

          {/* Información del Facilitador / Curso */}
          <div style={{
            background: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-card)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {assignedTeachers.length > 1 ? 'Profesores Encargados' : 'Profesor Encargado'}
            </div>
            {assignedTeachers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {assignedTeachers.map(t => (
                  <div key={t.id} style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span>{t.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Por asignar
              </div>
            )}
            {level?.dayOfWeek && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                📅 Horario: {level.dayOfWeek} {level.time}
              </div>
            )}
          </div>

        </div>

        {/* Tarjetas KPI de Resumen (Asistencia y Deberes) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '22px'
        }}>
          {/* KPI Asistencia */}
          <div style={{
            background: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: attendanceRate >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: attendanceRate >= 80 ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Asistencia a Clases
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {attendanceRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {presentCount} presentes de {totalClassesRecorded} clases
              </div>
            </div>
          </div>

          {/* KPI Deberes Entregados */}
          <div style={{
            background: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: homeworkCompletionRate === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: homeworkCompletionRate === 100 ? '#059669' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Control de Deberes
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {completedHomeworkCount} / {totalHomework}
              </div>
              <div style={{ fontSize: '0.72rem', color: homeworkCompletionRate === 100 ? '#059669' : 'var(--text-muted)' }}>
                {homeworkCompletionRate}% deberes entregados
              </div>
            </div>
          </div>

          {/* KPI Semáforo / Estado de Seguimiento */}
          <div style={{
            background: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: absentCount === 0 && homeworkCompletionRate >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: absentCount === 0 && homeworkCompletionRate >= 75 ? '#059669' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Rendimiento Integral
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                {absentCount === 0 && homeworkCompletionRate >= 75 ? 'Excelente Rendimiento' : absentCount > 2 ? 'Atención Requerida' : 'Buen Progreso'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {absentCount > 0 ? `${absentCount} falta(s) registrada(s)` : 'Sin faltas a clase'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de la Ficha: 1. Control de Deberes | 2. Fichajes de Clases */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid var(--border-card)',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('homework')}
          className={`nav-pill ${activeTab === 'homework' ? 'active' : ''}`}
          style={{
            fontSize: '0.92rem',
            padding: '10px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            background: activeTab === 'homework' ? 'var(--c-sky-accent)' : '#FFFFFF',
            color: activeTab === 'homework' ? '#1A365D' : 'var(--text-main)',
            border: '1.5px solid var(--border-card)',
            boxShadow: activeTab === 'homework' ? '0 4px 12px rgba(127, 183, 230, 0.35)' : 'none'
          }}
        >
          <BookOpen size={18} />
          Control de Deberes ({completedHomeworkCount}/{totalHomework})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`nav-pill ${activeTab === 'attendance' ? 'active' : ''}`}
          style={{
            fontSize: '0.92rem',
            padding: '10px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            background: activeTab === 'attendance' ? 'var(--c-sky-accent)' : '#FFFFFF',
            color: activeTab === 'attendance' ? '#1A365D' : 'var(--text-main)',
            border: '1.5px solid var(--border-card)',
            boxShadow: activeTab === 'attendance' ? '0 4px 12px rgba(127, 183, 230, 0.35)' : 'none'
          }}
        >
          <CalendarCheck size={18} />
          Fichajes de Clase ({studentAttendance.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: CONTROL DE DEBERES */}
      {/* ========================================================= */}
      {activeTab === 'homework' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Barra superior de deberes: Filtro y Botón Añadir */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} style={{ color: 'var(--c-sky-accent)' }} />
                Deberes Asignados - {level?.name || 'Nivel del Estudiante'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Marca con un clic cuando el estudiante te entregue cada tarea o lectura bíblica.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                value={filterHomeworkStatus}
                onChange={(e) => setFilterHomeworkStatus(e.target.value)}
              >
                <option value="ALL">Todos los deberes ({totalHomework})</option>
                <option value="pending">Solo Pendientes ({totalHomework - completedHomeworkCount})</option>
                <option value="completed">Solo Entregados ({completedHomeworkCount})</option>
              </select>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsNewHomeworkModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Asignar Nuevo Deber
              </button>
            </div>
          </div>

          {/* Barra de Progreso Visual de Deberes */}
          <div style={{ marginBottom: '24px', background: 'rgba(226, 232, 240, 0.6)', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${homeworkCompletionRate}%`,
              height: '100%',
              background: homeworkCompletionRate === 100 
                ? 'linear-gradient(90deg, #10b981, #059669)' 
                : 'linear-gradient(90deg, #3b82f6, #2563eb)',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {/* Lista de Deberes */}
          {filteredHomework.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem' }}>No se encontraron deberes con el filtro seleccionado.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredHomework.map((hw) => {
                const isDelivered = hw.isCompleted;

                return (
                  <div
                    key={hw.id}
                    style={{
                      background: isDelivered ? 'linear-gradient(135deg, rgba(236, 253, 245, 0.9), #FFFFFF)' : '#FFFFFF',
                      border: isDelivered ? '1.5px solid #a7f3d0' : '1.5px solid var(--border-card)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Contenido del Deber */}
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isDelivered ? '#D1FAE5' : '#FEF3C7',
                          color: isDelivered ? '#047857' : '#B45309',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isDelivered ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {isDelivered ? 'ENTREGADO' : 'PENDIENTE'}
                        </span>

                        <h4 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)', fontWeight: '700' }}>
                          {hw.title}
                        </h4>
                      </div>

                      {hw.description && (
                        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {hw.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                        {hw.dueDate && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} /> <strong>Fecha límite:</strong> {hw.dueDate}
                          </span>
                        )}

                        {isDelivered && hw.completedAt && (
                          <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <Check size={13} /> Entregado: {new Date(hw.completedAt).toLocaleDateString()} {new Date(hw.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Nota u observación del profesor */}
                      {isDelivered && hw.notes && (
                        <div style={{
                          marginTop: '8px',
                          fontSize: '0.82rem',
                          color: '#065f46',
                          background: 'rgba(16, 185, 129, 0.08)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          borderLeft: '3px solid #10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}>
                          <span><strong>Observación del profesor:</strong> "{hw.notes}"</span>
                          <button
                            type="button"
                            onClick={() => openNoteModal(hw)}
                            style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: 0 }}
                            title="Editar comentario"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción para el Profesor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {isDelivered ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openNoteModal(hw)}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                            title="Añadir o editar notas sobre el deber"
                          >
                            <Edit3 size={14} /> {hw.notes ? 'Editar Nota' : 'Añadir Nota'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleHomework(hw, false)}
                            className="btn btn-outline btn-sm"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              fontSize: '0.8rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5'
                            }}
                            title="Desmarcar entrega (volver a pendiente)"
                          >
                            <RotateCcw size={14} /> Desmarcar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleHomework(hw, true)}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            background: '#10b981',
                            borderColor: '#059669',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                          title="Marcar como entregado por el estudiante"
                        >
                          <CheckCircle2 size={16} /> Marcar como Entregado
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: HISTORIAL Y FICHAJES DE CADA CLASE */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Barra superior de asistencias */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={20} style={{ color: 'var(--c-sky-accent)' }} />
                Historial de Fichajes y Asistencias a Clases
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Revisa cada clase registrada, modifica el estado de asistencia o registra un fichaje manual.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAttendanceModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Registrar Fichaje Manual
            </button>
          </div>

          {/* Tabla de Fichajes */}
          {studentAttendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CalendarCheck size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem' }}>No hay registros de asistencias o faltas para este alumno.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsAttendanceModalOpen(true)}
                style={{ marginTop: '8px' }}
              >
                Registrar primera clase
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-card)', background: 'var(--c-sky-lightest)', color: '#1A365D' }}>
                    <th style={{ padding: '12px 14px' }}>Fecha de Clase</th>
                    <th style={{ padding: '12px 14px' }}>Hora</th>
                    <th style={{ padding: '12px 14px' }}>Estado Actual</th>
                    <th style={{ padding: '12px 14px' }}>Cambio Rápido</th>
                    <th style={{ padding: '12px 14px' }}>Registrado Por</th>
                    <th style={{ padding: '12px 14px' }}>Observaciones</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendance.map((att) => {
                    const isPresent = att.status === 'present';
                    const isAbsent = att.status === 'absent';
                    const isJustified = att.status === 'justified';
                    const timeStr = att.timestamp ? new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                    return (
                      <tr 
                        key={att.id}
                        style={{ borderBottom: '1px solid var(--border-card)', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-sky-lightest)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-main)' }}>
                          {att.date}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                          {timeStr}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {isPresent && (
                            <span className="badge badge-present" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Presente
                            </span>
                          )}
                          {isAbsent && (
                            <span className="badge badge-absent" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Falta
                            </span>
                          )}
                          {isJustified && (
                            <span style={{ 
                              background: '#FEF3C7', 
                              color: '#B45309', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.75rem', 
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={12} /> Justificada
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {/* Botones de alternancia rápida de estado */}
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(att, 'present')}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: isPresent ? '#059669' : '#d1d5db',
                                background: isPresent ? '#10b981' : '#ffffff',
                                color: isPresent ? '#ffffff' : '#374151',
                                cursor: 'pointer',
                                fontWeight: isPresent ? '700' : 'normal'
                              }}
                              title="Marcar como presente"
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(att, 'absent')}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: isAbsent ? '#dc2626' : '#d1d5db',
                                background: isAbsent ? '#ef4444' : '#ffffff',
                                color: isAbsent ? '#ffffff' : '#374151',
                                cursor: 'pointer',
                                fontWeight: isAbsent ? '700' : 'normal'
                              }}
                              title="Marcar como falta"
                            >
                              Falta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(att, 'justified')}
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: isJustified ? '#d97706' : '#d1d5db',
                                background: isJustified ? '#f59e0b' : '#ffffff',
                                color: isJustified ? '#ffffff' : '#374151',
                                cursor: 'pointer',
                                fontWeight: isJustified ? '700' : 'normal'
                              }}
                              title="Marcar como justificada"
                            >
                              Justificada
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {att.checkedInBy === 'student_self' ? '👤 Alumno (Auto-fichaje)' : att.checkedInBy || 'Profesor'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {att.notes || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttendance(att.id, att.date)}
                            className="btn btn-danger-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Eliminar este fichaje"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR FICHAJE MANUAL DE CLASE */}
      {/* ========================================================= */}
      {isAttendanceModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck size={18} style={{ color: 'var(--c-sky-accent)' }} />
              Registrar Fichaje de Clase
            </h3>

            <form onSubmit={handleSaveAttendance}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Fecha de la Clase *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Estado de Asistencia *</label>
                <select
                  className="form-select"
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                >
                  <option value="present">Presente ✅</option>
                  <option value="absent">Falta / Ausente ❌</option>
                  <option value="justified">Falta Justificada ⏳</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Observación o Nota (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Llegó puntual, avisó que salía antes..."
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAttendanceModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Fichaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASIGNAR NUEVO DEBER */}
      {/* ========================================================= */}
      {isNewHomeworkModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card" style={{ maxWidth: '480px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--c-sky-accent)' }} />
              Asignar Nuevo Deber / Tarea
            </h3>

            <form onSubmit={handleCreateHomework}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Título del Deber *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Lectura bíblica Romanos 8..."
                  value={newHomeworkForm.title}
                  onChange={(e) => setNewHomeworkForm({ ...newHomeworkForm, title: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Descripción o Instrucciones</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Detalla qué debe hacer el estudiante..."
                  value={newHomeworkForm.description}
                  onChange={(e) => setNewHomeworkForm({ ...newHomeworkForm, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Fecha Límite de Entrega</label>
                <input
                  type="date"
                  className="form-input"
                  value={newHomeworkForm.dueDate}
                  onChange={(e) => setNewHomeworkForm({ ...newHomeworkForm, dueDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsNewHomeworkModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Deber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR NOTA / OBSERVACIÓN DE ENTREGA */}
      {/* ========================================================= */}
      {editingNoteHomework && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card" style={{ maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} style={{ color: 'var(--c-sky-accent)' }} />
              Nota del Profesor
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Para el deber: <strong>{editingNoteHomework.title}</strong>
            </p>

            <form onSubmit={handleSaveHomeworkNote}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Ej: Excelente respuesta en el cuestionario, cumplió a tiempo..."
                  value={noteFormText}
                  onChange={(e) => setNoteFormText(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingNoteHomework(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
