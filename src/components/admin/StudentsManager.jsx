import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, BookOpen, User, Check, X, Filter, MessageCircle, Key, CheckCircle2, AlertTriangle, GraduationCap, IdCard, ClipboardList } from 'lucide-react';
import { storageService } from '../../services/storageService';
import StudentControlSheet from './StudentControlSheet';

export default function StudentsManager({ data, currentTeacher = null }) {
  const { students = [], levels = [], attendance = [] } = data;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('active');

  const [selectedStudentForSheet, setSelectedStudentForSheet] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Popover state: which student's popover is open
  const [popoverStudentId, setPopoverStudentId] = useState(null);
  const popoverRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    phone: '',
    password: '0000',
    levelId: '',
    status: 'active',
    notes: '',
  });

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverStudentId(null);
      }
    };
    if (popoverStudentId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverStudentId]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Filtro por nivel
      if (filterLevelId !== 'ALL' && s.levelId !== filterLevelId) return false;
      // Filtro por estado
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      // Filtro por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(term);
        const matchDoc = s.documentId && s.documentId.toLowerCase().includes(term);
        const matchPhone = s.phone && s.phone.includes(term);
        if (!matchName && !matchDoc && !matchPhone) return false;
      }
      return true;
    });
  }, [students, filterLevelId, filterStatus, searchTerm]);

  const openNewModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      documentId: '',
      phone: '',
      password: '0000',
      levelId: levels[0]?.id || '',
      status: 'active',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      documentId: student.documentId || '',
      phone: student.phone || '',
      password: student.password || '0000',
      levelId: student.levelId || levels[0]?.id || '',
      status: student.status || 'active',
      notes: student.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    storageService.saveStudent({
      id: editingStudent ? editingStudent.id : null,
      ...formData,
    });

    setIsModalOpen(false);
  };

  const handleDelete = (studentId, studentName) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${studentName}" y su historial de asistencia?`)) {
      storageService.deleteStudent(studentId);
    }
  };

  // Calcular cantidad de asistencias
  const getAttendanceCount = (studentId) => {
    return attendance.filter(a => a.studentId === studentId && a.status === 'present').length;
  };

  // Render status icon based on student status
  const renderStatusIcon = (status) => {
    if (status === 'active') {
      return (
        <span className="status-icon status-icon--active" title="Activo">
          <CheckCircle2 size={17} />
        </span>
      );
    }
    if (status === 'inactive') {
      return (
        <span className="status-icon status-icon--inactive" title="Inactivo">
          <AlertTriangle size={17} />
        </span>
      );
    }
    if (status === 'graduated') {
      return (
        <span className="status-icon status-icon--graduated" title="Graduado">
          <GraduationCap size={17} />
        </span>
      );
    }
    return <span>—</span>;
  };

  const togglePopover = (studentId) => {
    setPopoverStudentId(prev => prev === studentId ? null : studentId);
  };

  // Si se ha seleccionado un estudiante, mostramos su Ficha de Control individual
  if (selectedStudentForSheet) {
    const currentStudent = students.find(s => s.id === selectedStudentForSheet.id) || selectedStudentForSheet;
    return (
      <StudentControlSheet
        student={currentStudent}
        data={data}
        currentTeacher={currentTeacher}
        onBack={() => setSelectedStudentForSheet(null)}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>Estudiantes Inscritos ({students.length})</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Inscribe nuevos estudiantes, asígnalos o promuévelos de nivel y mantén sus datos de contacto.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Inscribir Estudiante
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', paddingBottom: '8px', paddingTop: '8px' }}
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
            value={filterLevelId}
            onChange={(e) => setFilterLevelId(e.target.value)}
          >
            <option value="ALL">Todos los Niveles</option>
            {levels.map(l => (
              <option key={l.id} value={l.id}>{l.name.split('-')[0].trim()}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="graduated">Graduados</option>
          </select>
        </div>
      </div>

      {/* Tabla / Lista de Estudiantes */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border-card)', background: 'var(--c-sky-lightest)', color: '#1A365D' }}>
              <th style={{ padding: '12px 16px' }}>Estudiante</th>
              <th style={{ padding: '12px 16px' }}>Nivel Asignado</th>
              <th style={{ padding: '12px 16px' }}>Contraseña</th>
              <th style={{ padding: '12px 16px' }}>Asistencias</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const level = levels.find(l => l.id === student.levelId);
                const presents = getAttendanceCount(student.id);
                const isPopoverOpen = popoverStudentId === student.id;

                return (
                  <tr 
                    key={student.id} 
                    style={{ borderBottom: '1px solid var(--border-card)', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-sky-lightest)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div className="student-name-cell" ref={isPopoverOpen ? popoverRef : null}>
                        <span
                          className="student-name-link"
                          onClick={() => togglePopover(student.id)}
                        >
                          {student.name}
                        </span>
                        {student.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>{student.notes}</div>
                        )}

                        {/* Popover con datos ocultos */}
                        {isPopoverOpen && (
                          <div className="student-popover">
                            <div className="popover-row">
                              <IdCard size={14} style={{ color: 'var(--c-sky-accent)', flexShrink: 0 }} />
                              <span className="popover-row-label">Doc/ID</span>
                              <span className="popover-row-value" style={{ fontFamily: 'monospace' }}>
                                {student.documentId || '—'}
                              </span>
                            </div>
                            <div className="popover-row">
                              <Phone size={14} style={{ color: 'var(--c-sky-accent)', flexShrink: 0 }} />
                              <span className="popover-row-label">Teléfono</span>
                              <span className="popover-row-value">
                                {student.phone ? (
                                  <a 
                                    href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#34d399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Enviar WhatsApp"
                                  >
                                    <MessageCircle size={12} /> {student.phone}
                                  </a>
                                ) : '—'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-level">
                        <BookOpen size={12} /> {level?.name.split('-')[0].trim() || 'Sin Nivel'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>
                        {student.password || '0000'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-present">
                        {presents} clases
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {renderStatusIcon(student.status)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={() => setSelectedStudentForSheet(student)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 12px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            border: 'none',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                            cursor: 'pointer'
                          }}
                          title="Abrir Ficha de Control, Fichajes y Deberes"
                        >
                          <ClipboardList size={13} /> Ficha
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => openEditModal(student)}
                          title="Editar o cambiar de nivel"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          className="btn btn-danger-outline btn-sm" 
                          onClick={() => handleDelete(student.id, student.name)}
                          title="Eliminar estudiante"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron estudiantes con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Estudiante */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>
                {editingStudent ? 'Editar Estudiante' : 'Inscribir Estudiante'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre y Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej. Mateo Benítez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">DNI / Cédula / Identificador</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. 12345678A"
                      value={formData.documentId}
                      onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono (con prefijo país)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+34 600 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Contraseña para Fichar *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="0000"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="graduated">Graduado</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nivel Asignado *</label>
                  <select
                    className="form-select"
                    required
                    value={formData.levelId}
                    onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                  >
                    {levels.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas Pastorales / Observaciones</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Ej. Miembro nuevo, sirve en ujieres..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> {editingStudent ? 'Actualizar Estudiante' : 'Inscribir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
