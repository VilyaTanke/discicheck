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
  User,
  Trash2,
  Flame,
  Zap,
  CheckCircle2,
  Edit
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { exportExcelReport } from '../../services/excelExportService';
import { isFirebaseConfigured, getFirebaseConfig, saveFirebaseConfig } from '../../services/firebase';

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

  // ═══ Estado Firebase ═══
  const [isFirebaseActive, setIsFirebaseActive] = useState(() => isFirebaseConfigured());
  const [currentFbConfig, setCurrentFbConfig] = useState(() => getFirebaseConfig());
  const [showFbForm, setShowFbForm] = useState(!isFirebaseConfigured());
  const [fbStatus, setFbStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fbForm, setFbForm] = useState({
    apiKey: currentFbConfig?.apiKey || '',
    authDomain: currentFbConfig?.authDomain || '',
    projectId: currentFbConfig?.projectId || '',
    storageBucket: currentFbConfig?.storageBucket || '',
    messagingSenderId: currentFbConfig?.messagingSenderId || '',
    appId: currentFbConfig?.appId || '',
  });
  const [rawSnippet, setRawSnippet] = useState('');

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
    if (window.confirm('¿Deseas restablecer los datos a los valores iniciales de demostración (Niveles 1, 2 y 3 con estudiantes de prueba)? Se perderán los cambios locales no exportados.')) {
      storageService.resetData();
      setImportStatus({ type: 'success', text: 'Datos restablecidos a la configuración de prueba inicial.' });
    }
  };

  // Autodetectar valores si el usuario pega el bloque de código de Firebase
  const handlePasteRawSnippet = (text) => {
    setRawSnippet(text);
    const extract = (key) => {
      const match = text.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`));
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const projectId = extract('projectId');
    const authDomain = extract('authDomain');
    const storageBucket = extract('storageBucket');
    const messagingSenderId = extract('messagingSenderId');
    const appId = extract('appId');

    if (apiKey || projectId) {
      setFbForm(prev => ({
        ...prev,
        apiKey: apiKey || prev.apiKey,
        projectId: projectId || prev.projectId,
        authDomain: authDomain || prev.authDomain,
        storageBucket: storageBucket || prev.storageBucket,
        messagingSenderId: messagingSenderId || prev.messagingSenderId,
        appId: appId || prev.appId,
      }));
      setFbStatus({ type: 'success', text: '¡Datos de Firebase detectados y cargados automáticamente en el formulario!' });
    }
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    if (!fbForm.apiKey.trim() || !fbForm.projectId.trim()) {
      setFbStatus({ type: 'error', text: 'Por favor ingresa al menos apiKey y projectId.' });
      return;
    }

    try {
      saveFirebaseConfig(fbForm);
      storageService.reconnectFirebase();
      const updatedConfig = getFirebaseConfig();
      setCurrentFbConfig(updatedConfig);
      setIsFirebaseActive(true);
      setShowFbForm(false);
      setFbStatus({ type: 'success', text: '¡Firebase Firestore conectado exitosamente! Sincronización en tiempo real activa.' });
    } catch (err) {
      setFbStatus({ type: 'error', text: `Error al guardar: ${err.message}` });
    }
  };

  const handlePushToFirebase = async () => {
    setIsSyncing(true);
    setFbStatus(null);
    try {
      await storageService.pushLocalDataToFirestore();
      setFbStatus({ type: 'success', text: '¡Datos locales subidos y sincronizados en la nube de Firebase!' });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permission-denied') || msg.includes('not been used in project')) {
        setFbStatus({ 
          type: 'error', 
          text: 'Firebase rechazó la conexión (PERMISSION_DENIED): Cloud Firestore aún no ha sido habilitado en tu proyecto Firebase "discipcheck". Ve a https://console.firebase.google.com/project/discipcheck/firestore y pulsa en "Crear base de datos" en Modo de prueba.' 
        });
      } else {
        setFbStatus({ type: 'error', text: `Error al subir: ${msg}` });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setIsSyncing(true);
    setFbStatus(null);
    try {
      await storageService.pullDataFromFirestore();
      setFbStatus({ type: 'success', text: '¡Datos descargados de Firebase y actualizados en este dispositivo!' });
    } catch (err) {
      setFbStatus({ type: 'error', text: `Error al descargar: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectFirebase = () => {
    if (window.confirm('¿Deseas desconectar Firebase de este navegador? La app volverá al modo de almacenamiento local independiente.')) {
      saveFirebaseConfig(null);
      storageService.reconnectFirebase();
      setIsFirebaseActive(false);
      setCurrentFbConfig(null);
      setShowFbForm(true);
      setFbStatus({ type: 'success', text: 'Firebase desconectado. Modo almacenamiento local activo.' });
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      '⚠️ ¿Estás completamente seguro de VACIAR LA BASE DE DATOS?\n\n' +
      '• Se eliminarán TODOS los estudiantes inscritos.\n' +
      '• Se borrarán TODOS los registros de asistencia.\n' +
      '• La aplicación quedará en 0, lista para empezar con datos reales.\n' +
      '• Se mantendrán los Niveles de discipulado, los datos de la iglesia y tus credenciales de admin.\n\n' +
      'Esta acción no se puede deshacer. ¿Deseas continuar?'
    );

    if (confirmed) {
      storageService.clearAllData();
      setImportStatus({ 
        type: 'success', 
        text: '¡Base de datos reseteada a 0! Se han eliminado todos los estudiantes y asistencias de prueba. Lista para uso real.' 
      });
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

      {/* ═══ Sincronización Firebase Firestore ═══ */}
      <div className="glass-panel" style={{
        padding: '22px',
        marginBottom: '20px',
        border: isFirebaseActive ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.35)',
        background: isFirebaseActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(255, 255, 255, 0.9))' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(255, 255, 255, 0.9))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} color={isFirebaseActive ? '#10B981' : '#F59E0B'} />
              <h4 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-main)' }}>
                Base de Datos en la Nube (Firebase Firestore)
              </h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Permite que los estudiantes fichen desde sus teléfonos móviles y que el administrador y los profesores vean los datos sincronizados en tiempo real.
            </p>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: isFirebaseActive ? '#D1FAE5' : '#FEF3C7',
            color: isFirebaseActive ? '#065F46' : '#92400E',
            border: isFirebaseActive ? '1px solid #A7F3D0' : '1px solid #FDE68A'
          }}>
            {isFirebaseActive ? <CheckCircle2 size={14} /> : <Zap size={14} />}
            {isFirebaseActive ? 'Conectado en Tiempo Real' : 'Modo Almacenamiento Local'}
          </span>
        </div>

        <StatusBanner status={fbStatus} />

        {isFirebaseActive && !showFbForm ? (
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)',
              marginBottom: '16px',
              fontSize: '0.85rem',
              lineHeight: '1.6'
            }}>
              <div><strong>Proyecto Firebase:</strong> <code style={{ color: '#047857' }}>{currentFbConfig?.projectId}</code></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                Todos los cambios realizados se sincronizan automáticamente con Cloud Firestore.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={handlePushToFirebase}
                disabled={isSyncing}
                style={{ background: '#10B981', borderColor: '#059669' }}
              >
                <Upload size={14} /> {isSyncing ? 'Sincronizando...' : 'Subir Datos Locales a Firebase'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={handlePullFromFirebase}
                disabled={isSyncing}
              >
                <Download size={14} /> Descargar Datos desde Firebase
              </button>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => setShowFbForm(true)}
              >
                <Edit size={14} /> Modificar Credenciales
              </button>
              <button 
                type="button" 
                className="btn btn-danger-outline btn-sm" 
                onClick={handleDisconnectFirebase}
              >
                Desconectar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Campo Rápido para Pegar el Bloque de Firebase */}
            <div style={{
              background: 'var(--c-sky-lightest)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px dashed var(--border-card)',
              marginBottom: '18px'
            }}>
              <label className="form-label" style={{ fontWeight: '700', color: '#1E3A8A' }}>
                📋 Atajo: Pega aquí la configuración de Firebase Console
              </label>
              <textarea
                className="form-input"
                rows="3"
                placeholder='const firebaseConfig = { apiKey: "AIza...", projectId: "...", ... };'
                value={rawSnippet}
                onChange={(e) => handlePasteRawSnippet(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Al pegar el texto de la consola de Firebase, los campos inferiores se autocompletarán automáticamente.
              </span>
            </div>

            {/* Formulario Manual de Credenciales */}
            <form onSubmit={handleSaveFirebase}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">API Key *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="AIzaSy..."
                    value={fbForm.apiKey}
                    onChange={(e) => setFbForm({ ...fbForm, apiKey: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Project ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="tu-proyecto-discipulado"
                    value={fbForm.projectId}
                    onChange={(e) => setFbForm({ ...fbForm, projectId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Auth Domain</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="tu-proyecto.firebaseapp.com"
                    value={fbForm.authDomain}
                    onChange={(e) => setFbForm({ ...fbForm, authDomain: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Bucket</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="tu-proyecto.appspot.com"
                    value={fbForm.storageBucket}
                    onChange={(e) => setFbForm({ ...fbForm, storageBucket: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Messaging Sender ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="1234567890"
                    value={fbForm.messagingSenderId}
                    onChange={(e) => setFbForm({ ...fbForm, messagingSenderId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">App ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="1:1234567890:web:abcdef..."
                    value={fbForm.appId}
                    onChange={(e) => setFbForm({ ...fbForm, appId: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ background: '#10B981', borderColor: '#059669' }}>
                  <Flame size={16} /> Guardar y Conectar a Firebase
                </button>
                {isFirebaseActive && (
                  <button type="button" className="btn btn-outline" onClick={() => setShowFbForm(false)}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
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
      <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> Zona de Mantenimiento
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px', lineHeight: '1.5' }}>
          Opciones para reiniciar la base de datos de la aplicación. Te sugerimos descargar una copia de seguridad en JSON o Excel antes de ejecutar estas acciones.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-danger-outline btn-sm" onClick={handleReset}>
            <RefreshCw size={14} /> Restablecer a Datos de Prueba Iniciales
          </button>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleClearAll}
            title="Elimina todos los estudiantes y asistencias para empezar de cero"
          >
            <Trash2 size={14} /> Resetear Base de Datos a Cero (Modo Real)
          </button>
        </div>
      </div>
    </div>
  );
}
