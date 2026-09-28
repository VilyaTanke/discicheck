import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Clock, MapPin, User, Users, Check, X } from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function LevelsManager({ data }) {
  const { levels = [], teachers = [], students = [] } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayOfWeek: 'Martes',
    time: '19:30 - 21:00',
    room: '',
    teacherIds: [],
  });

  const openNewModal = () => {
    setEditingLevel(null);
    setFormData({
      name: `Nivel ${levels.length + 1} - `,
      description: '',
      dayOfWeek: 'Martes',
      time: '19:30 - 21:00',
      room: '',
      teacherIds: teachers[0]?.id ? [teachers[0].id] : [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (level) => {
    setEditingLevel(level);
    const initialTeacherIds = Array.isArray(level.teacherIds)
      ? level.teacherIds
      : (level.teacherId ? [level.teacherId] : []);

    setFormData({
      name: level.name,
      description: level.description || '',
      dayOfWeek: level.dayOfWeek || 'Martes',
      time: level.time || '19:30 - 21:00',
      room: level.room || '',
      teacherIds: initialTeacherIds,
    });
    setIsModalOpen(true);
  };

  const toggleTeacherSelection = (teacherId) => {
    setFormData(prev => {
      const exists = prev.teacherIds.includes(teacherId);
      const updated = exists 
        ? prev.teacherIds.filter(id => id !== teacherId)
        : [...prev.teacherIds, teacherId];
      return { ...prev, teacherIds: updated };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    storageService.saveLevel({
      id: editingLevel ? editingLevel.id : null,
      ...formData,
      teacherId: formData.teacherIds[0] || '',
    });

    setIsModalOpen(false);
  };

  const handleDelete = (levelId, levelName) => {
    const studentCount = students.filter(s => s.levelId === levelId).length;
    let msg = `¿Estás seguro de eliminar "${levelName}"?`;
    if (studentCount > 0) {
      msg += ` Hay ${studentCount} estudiante(s) asignado(s) a este nivel.`;
    }
    if (window.confirm(msg)) {
      storageService.deleteLevel(levelId);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>Niveles de Discipulado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Configura los cursos activos, días de la semana, horarios y maestros asignados.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Crear Nuevo Nivel
        </button>
      </div>

      {/* Grid de Tarjetas de Niveles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
        {levels.map(level => {
          const assignedTeachers = teachers.filter(t => 
            (Array.isArray(level.teacherIds) && level.teacherIds.includes(t.id)) || t.id === level.teacherId
          );
          const studentCount = students.filter(s => s.levelId === level.id).length;

          return (
            <div key={level.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--c-sky-lightest)',
                    color: '#2A5D8A',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700'
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => openEditModal(level)}
                      title="Editar nivel"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-danger-outline btn-sm" 
                      onClick={() => handleDelete(level.id, level.name)}
                      title="Eliminar nivel"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{level.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px', minHeight: '38px' }}>
                  {level.description || 'Sin descripción.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} color="#818cf8" />
                    <span><strong>{level.dayOfWeek}</strong> • {level.time}</span>
                  </div>
                  {level.room && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="#34d399" />
                      <span>{level.room}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={15} color="#f59e0b" />
                      <span>Profesores ({assignedTeachers.length}):</span>
                    </div>
                    {assignedTeachers.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '21px' }}>
                        {assignedTeachers.map(t => (
                          <span key={t.id} style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#b45309',
                            fontSize: '0.74rem',
                            fontWeight: '600',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <User size={10} /> {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ paddingLeft: '21px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Sin profesores asignados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '18px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className="badge badge-level">
                  {studentCount} estudiante(s) inscritos
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                  ID: {level.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Nivel */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>
                {editingLevel ? 'Editar Nivel de Discipulado' : 'Crear Nuevo Nivel'}
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
                  <label className="form-label">Nombre del Nivel *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej. Nivel 4 - Liderazgo Práctico"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción u Objetivos</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Breve resumen del propósito de este nivel..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Día de la Semana</label>
                    <select
                      className="form-select"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    >
                      <option value="Lunes">Lunes</option>
                      <option value="Martes">Martes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Viernes">Viernes</option>
                      <option value="Sábados">Sábados</option>
                      <option value="Domingos">Domingos</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horario</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. 19:30 - 21:00"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Aula / Salón</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Aula 3, Segundo Piso"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Profesores Asignados al Nivel</span>
                    <span style={{ fontSize: '0.78rem', color: formData.teacherIds.length > 0 ? '#059669' : 'var(--text-muted)', fontWeight: '700' }}>
                      {formData.teacherIds.length} seleccionado(s)
                    </span>
                  </label>

                  <div style={{
                    maxHeight: '190px',
                    overflowY: 'auto',
                    border: '1.5px solid var(--border-card)',
                    borderRadius: '10px',
                    padding: '6px',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {teachers.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No hay profesores registrados en el sistema.
                      </div>
                    ) : (
                      teachers.map(t => {
                        const isSelected = formData.teacherIds.includes(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTeacherSelection(t.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                              border: isSelected ? '1.5px solid #93c5fd' : '1px solid transparent',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by parent div onClick
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? '700' : '500', color: 'var(--text-main)' }}>
                                  {t.name}
                                </div>
                                {t.role && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {t.role}
                                  </div>
                                )}
                              </div>
                            </div>
                            {t.phone && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                                {t.phone}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Puedes asignar varios profesores para que todos compartan la administración y los fichajes de este nivel.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> {editingLevel ? 'Guardar Cambios' : 'Crear Nivel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
