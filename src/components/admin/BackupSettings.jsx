// src/components/admin/BackupSettings.jsx
// Respaldos, Exportación a Excel/JSON y Configuración de Datos para GitHub Pages

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
  ExternalLink
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function BackupSettings({ data }) {
  const [importStatus, setImportStatus] = useState(null);

  const handleExportJSON = () => {
    storageService.exportJSON();
  };

  const handleExportCSV = () => {
    storageService.exportCSV();
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.3rem' }}>Copias de Seguridad y Datos (GitHub Pages)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Gestiona las copias de seguridad de estudiantes y asistencias, exporta a Excel y conoce las opciones de sincronización.
        </p>
      </div>

      {importStatus && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          background: importStatus.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          color: importStatus.type === 'success' ? '#34d399' : '#f87171',
          border: `1px solid ${importStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {importStatus.text}
        </div>
      )}

      {/* Tarjeta de Exportación */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} color="#818cf8" /> Exportar Datos y Reportes
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Descarga un archivo con toda la información de estudiantes, niveles y asistencias para archivar o abrir en Excel.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <FileSpreadsheet size={16} /> Descargar Reporte Completo (Excel / CSV)
          </button>
          <button className="btn btn-outline" onClick={handleExportJSON}>
            <Database size={16} /> Guardar Copia de Seguridad (.json)
          </button>
        </div>
      </div>

      {/* Tarjeta de Restauración / Importación */}
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

      {/* Información sobre el Servidor Gratuito GitHub Pages */}
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

      {/* Restablecer Datos de Demostración */}
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
