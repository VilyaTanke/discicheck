// src/components/admin/TeachersManager.jsx
// Gestión de Profesores y Facilitadores de los Cursos de Discipulado

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, BookOpen, User, Check, X, Key } from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function TeachersManager({ data }) {
  const { teachers = [], levels = [] } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    password: '0000',
  });

  const openNewModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'Profesor de Discipulado',
      password: '0000',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      phone: teacher.phone || '',
      email: teacher.email || '',
      role: teacher.role || '',
      password: teacher.password || '0000',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    storageService.saveTeacher({
      id: editingTeacher ? editingTeacher.id : null,
      ...formData,
    });

    setIsModalOpen(false);
  };

  const handleDelete = (teacherId, teacherName) => {
    const assignedLevels = levels.filter(l => 
      (Array.isArray(l.teacherIds) && l.teacherIds.includes(teacherId)) || l.teacherId === teacherId
    );
    let msg = `¿Deseas eliminar a "${teacherName}"?`;
    if (assignedLevels.length > 0) {
      msg += ` Está asignado como responsable en ${assignedLevels.length} nivel(es).`;
    }
    if (window.confirm(msg)) {
      storageService.deleteTeacher(teacherId);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem' }}>Profesores y Facilitadores</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Registra a los maestros responsables de impartir y acompañar cada nivel.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Registrar Nuevo Profesor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
        {teachers.map(teacher => {
          const assignedLevels = levels.filter(l => 
            (Array.isArray(l.teacherIds) && l.teacherIds.includes(teacher.id)) || l.teacherId === teacher.id
          );

          return (
            <div key={teacher.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1.1rem'
                    }}>
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{teacher.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {teacher.role || 'Profesor'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => openEditModal(teacher)}
                      title="Editar profesor"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn btn-danger-outline btn-sm" 
                      onClick={() => handleDelete(teacher.id, teacher.name)}
                      title="Eliminar profesor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', margin: '14px 0' }}>
                  {teacher.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="#34d399" />
                      <a 
                        href={`tel:${teacher.phone}`}
                        style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        {teacher.phone}
                      </a>
                    </div>
                  )}
                  {teacher.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} color="#818cf8" />
                      <span>{teacher.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                    <Key size={13} color="#f59e0b" />
                    <span>Clave de acceso: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{teacher.password || '0000'}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-card)'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Niveles a su cargo:
                </span>
                {assignedLevels.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {assignedLevels.map(lvl => (
                      <span key={lvl.id} className="badge badge-level" style={{ fontSize: '0.72rem' }}>
                        <BookOpen size={11} /> {lvl.name.split('-')[0].trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    Sin cursos asignados actualmente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Profesor */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>
                {editingTeacher ? 'Editar Profesor' : 'Registrar Nuevo Profesor'}
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
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej. Pastor Juan Carlos Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol o Título</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Coordinador de Nivel 1 / Diácono"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="profesor@iglesia.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} color="#f59e0b" /> Contraseña de Acceso al Panel
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0000"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    El profesor usará su teléfono y esta clave para acceder a su panel.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> {editingTeacher ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
