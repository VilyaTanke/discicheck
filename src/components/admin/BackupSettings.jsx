// src/components/admin/BackupSettings.jsx
// Respaldos, Exportación a Excel/JSON, Datos de la Iglesia y Configuración

import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  Cloud, 
  ShieldCheck, 
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  Lock,
  Key,
  Check,
  Church,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { exportExcelReport } from '../../services/excelExportService';

export default function BackupSettings({ data }) {
  const [importStatus, setImportStatus] = useState(null);
  const [newAdminUser, setNewAdminUser] = useState(data.settings?.adminUser || 'admin');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [credStatus, setCredStatus] = useState(null);

  // Datos de la iglesia
  const [churchName, setChurchName] = useState(data.settings?.churchName || '');
  const [churchAddress, setChurchAddress] = useState(data.settings?.churchAddress || '');
  const [churchPhone, setChurchPhone] = useState(data.settings?.churchPhone || '');
  const [churchPastor, setChurchPastor] = useState(data.settings?.churchPastor || '');
  const [churchStatus, setChurchStatus] = useState(null);

  const handleSaveChurchInfo = (e) => {
    e.preventDefault();
    storageService.updateChurchInfo({ churchName, churchAddress, churchPhone, churchPastor });
    setChurchStatus({ type: 'success', text: '¡Datos de la iglesia guardados correctamente!' });
    setTimeout(() => setChurchStatus(null), 4000);
  };

  const handleUpdateCreds = (e) => {
    e.preventDefault();
    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      setCredStatus({ type: 'error', text: 'Por favor introduce un usuario y una nueva contraseña válidos.' });
      return;
    }
    storageService.updateAdminCredentials(newAdminUser, newAdminPass);
    setCredStatus({ type: 'success', text: '¡Credenciales de administrador actualizadas correctamente!' });
    setNewAdminPass('');
  };

  const handleExportJSON = () => {
    storageService.exportJSON();
  };

  const handleExportExcel = () => {
    exportExcelReport();
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = storageService.importJSON(content);
      if (res.success) {
        setImportStatus({ type: 'success', text: '¡Datos restaurados con éxito desde la copia de seguridad!' });
      } else {
        setImportStatus({ type: 'error', text: `Error al restaurar: ${res.error}` });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restablecer los datos a los valores iniciales de demostración (Niveles 1, 2 y 3)? Se perderán los cambios locales no exportados.')) {
      storageService.resetData();
      setImportStatus({ type: 'success', text: 'Datos restablecidos a la configuración inicial.' });
    }
  };

  const StatusBanner = ({ status }) => {
    if (!status) return null;
    return (
      <div style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '14px',
        background: status.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
        color: status.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
        fontSize: '0.85rem',
        border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}>
        {status.text}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.3rem' }}>Copias de Seguridad y Datos (GitHub Pages)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Gestiona las copias de seguridad de estudiantes y asistencias, exporta a Excel y conoce las opciones de sincronización.
        </p>
      </div>

      <StatusBanner status={importStatus} />

      {/* ═══ Datos de la Iglesia ═══ */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: '1.5px solid var(--c-sky-soft)' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Church size={18} color="var(--c-sky-accent)" /> Datos de la Iglesia
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Estos datos aparecerán en el encabezado de los reportes Excel exportados.
        </p>

        <StatusBanner status={churchStatus} />

        <form onSubmit={handleSaveChurchInfo}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Church size={14} /> Nombre de la Iglesia
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Iglesia Cristiana Vida Nueva"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Ubicación / Dirección
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. C/ Gran Vía 45, Madrid, España"
                value={churchAddress}
                onChange={(e) => setChurchAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> Teléfono de Contacto
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="+34 600 000 000"
                value={churchPhone}
                onChange={(e) => setChurchPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Pastor Principal
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Pastor Juan Pérez"
              value={churchPastor}
              onChange={(e) => setChurchPastor(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }}>
            <Check size={16} /> Guardar Datos de la Iglesia
          </button>
        </form>
      </div>

      {/* ═══ Exportación ═══ */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} color="#818cf8" /> Exportar Datos y Reportes
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Descarga un archivo Excel (.xlsx) profesional con encabezado de la iglesia, resumen por nivel, listado de estudiantes y registros detallados de asistencia.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} /> Descargar Reporte Completo (.xlsx)
          </button>
          <button className="btn btn-outline" onClick={handleExportJSON}>
            <Database size={16} /> Guardar Copia de Seguridad (.json)
          </button>
        </div>
      </div>

      {/* ═══ Restauración ═══ */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} color="#34d399" /> Restaurar Copia de Seguridad
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
          Sube un archivo de copia de seguridad (.json) generado previamente para restaurar todos los registros.
        </p>

        <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          <Upload size={16} /> Seleccionar archivo JSON
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* ═══ Info GitHub Pages ═══ */}
      <div className="glass-panel" style={{
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        background: 'rgba(99, 102, 241, 0.05)'
      }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
          <Cloud size={18} /> ¿Cómo funciona la persistencia en GitHub Pages?
        </h4>
        <div style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>GitHub Pages</strong> es un servidor web gratuito y de alta velocidad para páginas estáticas. Actualmente, la app guarda los datos en el almacenamiento local seguro de cada navegador (PWA con LocalStorage).
          </p>
          <p style={{ marginBottom: '8px' }}>
            Para que <strong>múltiples teléfonos de estudiantes y el panel del administrador sincronicen en la nube en tiempo real</strong> sin coste alguno, la mejor opción gratuita es conectar <strong>Google Firebase Firestore</strong> (Google Cloud ofrece un plan 100% gratuito de 50.000 lecturas diarias, más que suficiente para una iglesia o ministerio).
          </p>
          <p>
            Mientras tanto, puedes usar la app directamente, exportar tus respaldos periódicamente en Excel o JSON, y compartir la URL pública de GitHub Pages con los hermanos.
          </p>
        </div>
      </div>

      {/* ═══ Seguridad Admin ═══ */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
          <Key size={18} /> Seguridad: Usuario y Contraseña de Administrador
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Cambia el usuario o la contraseña para restringir el acceso a este panel solo a la persona autorizada.
        </p>

        <StatusBanner status={credStatus} />

        <form onSubmit={handleUpdateCreds} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nombre de Usuario Admin</label>
            <input
              type="text"
              className="form-input"
              required
              value={newAdminUser}
              onChange={(e) => setNewAdminUser(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="password"
              className="form-input"
              required
              value={newAdminPass}
              onChange={(e) => setNewAdminPass(e.target.value)}
              placeholder="Nueva contraseña secreta"
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Check size={16} /> Guardar Credenciales
            </button>
          </div>
        </form>
      </div>

      {/* ═══ Zona de Mantenimiento ═══ */}
      <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Zona de Mantenimiento
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
          Si deseas reiniciar la aplicación a los datos de prueba iniciales (Niveles 1, 2 y 3 con ejemplos de estudiantes y asistencias):
        </p>
        <button className="btn btn-danger-outline btn-sm" onClick={handleReset}>
          <RefreshCw size={14} /> Restablecer a Datos de Prueba Iniciales
        </button>
      </div>
    </div>
  );
}
