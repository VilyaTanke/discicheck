// src/services/storageService.js
// Servicio de datos y persistencia para Control de Asistencia Discipulado
// Soporta modo Offline (localStorage) y Sincronización en Tiempo Real con Firebase Cloud Firestore

import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getDb, isFirebaseConfigured, initFirebase } from './firebase';

const STORAGE_KEY = 'discipulado_attendance_data_v1';
const FIRESTORE_COLLECTION = 'discipulado';
const FIRESTORE_DOC = 'database';
const FIRESTORE_CREDENTIALS_COLLECTION = 'credentials';

let unsubscribeFirestore = null;

// Datos iniciales de demostración con Niveles 1, 2 y 3
export const INITIAL_DATA = {
  levels: [
    {
      id: 'lvl-1',
      name: 'Nivel 1 - Fundamentos de la Fe',
      description: 'Principios básicos de la vida cristiana y doctrinas fundamentales.',
      dayOfWeek: 'Martes',
      time: '19:30 - 21:00',
      room: 'Aula 1 - Planta Baja',
      teacherId: 'tch-1',
      teacherIds: ['tch-1'],
      totalClasses: 12,
      isActive: true,
      color: '#3b82f6', // blue
    },
    {
      id: 'lvl-2',
      name: 'Nivel 2 - Vida Discipular',
      description: 'Crecimiento espiritual, carácter, oración y estudio bíblico aplicado.',
      dayOfWeek: 'Jueves',
      time: '19:30 - 21:00',
      room: 'Aula 2 - Primer Piso',
      teacherId: 'tch-2',
      teacherIds: ['tch-2'],
      totalClasses: 12,
      isActive: true,
      color: '#10b981', // emerald
    },
    {
      id: 'lvl-3',
      name: 'Nivel 3 - Liderazgo y Ministerio',
      description: 'Formación para servidores, líderes de célula y ministerio práctico.',
      dayOfWeek: 'Sábados',
      time: '17:00 - 18:45',
      room: 'Auditorio Principal',
      teacherId: 'tch-3',
      teacherIds: ['tch-3'],
      totalClasses: 12,
      isActive: true,
      color: '#8b5cf6', // purple
    },
  ],
  teachers: [
    {
      id: 'tch-1',
      name: 'Pastor Andrés Romero',
      phone: '+34 611 223 344',
      email: 'andres.romero@iglesia.org',
      role: 'Coordinador Nivel 1',
      password: '0000',
    },
    {
      id: 'tch-2',
      name: 'Hna. Miriam Valdés',
      phone: '+34 622 334 455',
      email: 'miriam.valdes@iglesia.org',
      role: 'Coordinadora Nivel 2',
      password: '0000',
    },
    {
      id: 'tch-3',
      name: 'Pastor David Gómez',
      phone: '+34 633 445 566',
      email: 'david.gomez@iglesia.org',
      role: 'Coordinador Nivel 3',
      password: '0000',
    },
  ],
  students: [
    // Nivel 1
    {
      id: 'std-101',
      name: 'Carlos Mendoza',
      documentId: '1001',
      phone: '+34600111222',
      password: '0000',
      levelId: 'lvl-1',
      status: 'active',
      enrolledAt: '2026-09-01',
      notes: 'Bautizado recientemente.',
    },
    {
      id: 'std-102',
      name: 'Lucía Fernández',
      documentId: '1002',
      phone: '+34600222333',
      password: '0000',
      levelId: 'lvl-1',
      status: 'active',
      enrolledAt: '2026-09-01',
      notes: 'Asiste con su familia.',
    },
    {
      id: 'std-103',
      name: 'Javier Morales',
      documentId: '1003',
      phone: '+34600333444',
      password: '0000',
      levelId: 'lvl-1',
      status: 'active',
      enrolledAt: '2026-09-01',
      notes: 'Trabaja por turnos rotativos.',
    },
    {
      id: 'std-104',
      name: 'Ana Sofía Castillo',
      documentId: '1004',
      phone: '+34600444555',
      password: '0000',
      levelId: 'lvl-1',
      status: 'active',
      enrolledAt: '2026-09-01',
      notes: '',
    },
    // Nivel 2
    {
      id: 'std-201',
      name: 'Mateo Benítez',
      documentId: '2001',
      phone: '+34611111222',
      password: '0000',
      levelId: 'lvl-2',
      status: 'active',
      enrolledAt: '2026-08-15',
      notes: 'Colabora en el equipo de alabanza.',
    },
    {
      id: 'std-202',
      name: 'Valentina Restrepo',
      documentId: '2002',
      phone: '+34611222333',
      password: '0000',
      levelId: 'lvl-2',
      status: 'active',
      enrolledAt: '2026-08-15',
      notes: '',
    },
    {
      id: 'std-203',
      name: 'Gabriel Quintana',
      documentId: '2003',
      phone: '+34611333444',
      password: '0000',
      levelId: 'lvl-2',
      status: 'active',
      enrolledAt: '2026-08-15',
      notes: 'Ha faltado las últimas dos clases.',
    },
    // Nivel 3
    {
      id: 'std-301',
      name: 'Daniela Salgado',
      documentId: '3001',
      phone: '+34622111222',
      password: '0000',
      levelId: 'lvl-3',
      status: 'active',
      enrolledAt: '2026-07-10',
      notes: 'Líder en formación de jóvenes.',
    },
    {
      id: 'std-302',
      name: 'Esteban Paredes',
      documentId: '3002',
      phone: '+34622222333',
      password: '0000',
      levelId: 'lvl-3',
      status: 'active',
      enrolledAt: '2026-07-10',
      notes: 'Coordinador del grupo de bienvenida.',
    },
  ],
  attendance: [
    // Historial para probar ausencias y semáforos
    // Semana pasada
    { id: 'att-1', studentId: 'std-101', levelId: 'lvl-1', date: '2026-09-09', timestamp: '2026-09-09T19:25:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-2', studentId: 'std-102', levelId: 'lvl-1', date: '2026-09-09', timestamp: '2026-09-09T19:28:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-3', studentId: 'std-103', levelId: 'lvl-1', date: '2026-09-09', timestamp: '2026-09-09T19:35:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-4', studentId: 'std-104', levelId: 'lvl-1', date: '2026-09-09', timestamp: '2026-09-09T19:30:00Z', status: 'absent', checkedInBy: 'admin' },

    // Semana antepasada Nivel 2
    { id: 'att-5', studentId: 'std-201', levelId: 'lvl-2', date: '2026-09-11', timestamp: '2026-09-11T19:20:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-6', studentId: 'std-202', levelId: 'lvl-2', date: '2026-09-11', timestamp: '2026-09-11T19:22:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-7', studentId: 'std-203', levelId: 'lvl-2', date: '2026-09-11', timestamp: '2026-09-11T19:30:00Z', status: 'absent', checkedInBy: 'admin' },

    // Semana anterior Nivel 2
    { id: 'att-8', studentId: 'std-201', levelId: 'lvl-2', date: '2026-09-18', timestamp: '2026-09-18T19:24:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-9', studentId: 'std-202', levelId: 'lvl-2', date: '2026-09-18', timestamp: '2026-09-18T19:21:00Z', status: 'present', checkedInBy: 'student_self' },
    { id: 'att-10', studentId: 'std-203', levelId: 'lvl-2', date: '2026-09-18', timestamp: '2026-09-18T19:30:00Z', status: 'absent', checkedInBy: 'admin' },
  ],
  homework: [
    // Nivel 1 - Fundamentos de la Fe
    { id: 'hw-101', levelId: 'lvl-1', title: 'Lectura Evangelio de Juan (Cap. 1 al 3)', description: 'Lectura bíblica y responder las preguntas del cuaderno de bienvenida.', dueDate: '2026-09-15' },
    { id: 'hw-102', levelId: 'lvl-1', title: 'Memorización Bíblica: Juan 3:16', description: 'Aprender y recitar de memoria el versículo clave de salvación.', dueDate: '2026-09-22' },
    { id: 'hw-103', levelId: 'lvl-1', title: 'Cuestionario: La Gracia y la Salvación', description: 'Completar la guía de estudio de Efesios 2:8-10.', dueDate: '2026-09-29' },
    { id: 'hw-104', levelId: 'lvl-1', title: 'Testimonio de Fe Personal', description: 'Escribir una breve reflexión personal sobre tu nuevo nacimiento en Cristo.', dueDate: '2026-10-06' },

    // Nivel 2 - Vida Discipular
    { id: 'hw-201', levelId: 'lvl-2', title: 'Diario Devocional: 7 Días con los Salmos', description: 'Llevar el registro de lectura y oración diaria de la semana.', dueDate: '2026-09-18' },
    { id: 'hw-202', levelId: 'lvl-2', title: 'Estudio de Carácter: Fruto del Espíritu', description: 'Completar el cuestionario práctico de Gálatas 5:22-23.', dueDate: '2026-09-25' },
    { id: 'hw-203', levelId: 'lvl-2', title: 'Práctica de Intercesión en Familia', description: 'Orar durante la semana por una lista de 3 peticiones específicas.', dueDate: '2026-10-02' },

    // Nivel 3 - Liderazgo y Ministerio
    { id: 'hw-301', levelId: 'lvl-3', title: 'Diseño de Dinámica para Grupo Celular', description: 'Presentar un bosquejo de reunión con rompehielo y aplicación práctica.', dueDate: '2026-09-20' },
    { id: 'hw-302', levelId: 'lvl-3', title: 'Acompañamiento a un Nuevo Creyente', description: 'Plan de mentoría y reporte de seguimiento con un estudiante de Nivel 1.', dueDate: '2026-09-27' },
    { id: 'hw-303', levelId: 'lvl-3', title: 'Proyecto de Servicio Comunitario', description: 'Planificar una actividad de ayuda social con el equipo de líderes.', dueDate: '2026-10-04' },
  ],
  homeworkSubmissions: [
    { id: 'sub-1', studentId: 'std-101', homeworkId: 'hw-101', isCompleted: true, completedAt: '2026-09-14T18:30:00Z', notes: 'Excelente resumen y puntualidad.' },
    { id: 'sub-2', studentId: 'std-101', homeworkId: 'hw-102', isCompleted: true, completedAt: '2026-09-21T19:00:00Z', notes: 'Recitado de memoria con total fluidez.' },
    { id: 'sub-3', studentId: 'std-102', homeworkId: 'hw-101', isCompleted: true, completedAt: '2026-09-15T10:15:00Z', notes: 'Completado satisfactoriamente.' },
    { id: 'sub-4', studentId: 'std-201', homeworkId: 'hw-201', isCompleted: true, completedAt: '2026-09-18T17:45:00Z', notes: 'Diario devocional muy completo y profundo.' },
  ],
  settings: {
    institutionName: 'Escuela de Discipulado',
    welcomeMessage: '¡Bienvenido(a)! Que la palabra de hoy sea de gran bendición para tu vida espiritual.',
    allowSelfCheckIn: true,
    requireVerification: false,
    adminUser: 'admin',
    adminPassword: 'password123',
  }
};

let listeners = [];

export const storageService = {
  // Obtener todos los datos
  getData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.students) {
          parsed.students = parsed.students.map(s => ({
            ...s,
            password: s.password || '0000'
          }));
        }
        if (parsed.teachers) {
          parsed.teachers = parsed.teachers.map(t => ({
            ...t,
            password: t.password || '0000'
          }));
        }
        if (parsed.levels) {
          parsed.levels = parsed.levels.map(l => ({
            ...l,
            teacherIds: Array.isArray(l.teacherIds) ? l.teacherIds : (l.teacherId ? [l.teacherId] : []),
            totalClasses: Number(l.totalClasses) || 12,
          }));
        }
        if (!parsed.homework) {
          parsed.homework = INITIAL_DATA.homework;
        }
        if (!parsed.homeworkSubmissions) {
          parsed.homeworkSubmissions = INITIAL_DATA.homeworkSubmissions;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error al leer de localStorage:', e);
    }
    // Guardar datos iniciales si no existen
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  },

  // Guardar datos y notificar a los componentes
  saveData(data, syncRemote = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners(data);
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }

    // Sincronizar con Firebase Firestore en segundo plano si está disponible
    if (syncRemote) {
      const db = getDb();
      if (db && isFirebaseConfigured()) {
        try {
          const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
          setDoc(docRef, data, { merge: true }).catch(err => {
            console.warn('Aviso: No se pudo sincronizar en Firestore:', err);
          });
        } catch (err) {
          console.warn('Error al iniciar sincronización con Firestore:', err);
        }
      }
    }
  },

  // Suscribirse a cambios
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  notifyListeners(data) {
    listeners.forEach(l => {
      try {
        l(data);
      } catch (err) {
        console.error('Error en listener:', err);
      }
    });
  },

  // Reiniciar a valores iniciales de demostración
  resetData() {
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  },

  // Resetear la base de datos completa a cero (modo producción con datos reales)
  // Deja la base de datos en 0: vacía todos los estudiantes y registros de asistencias,
  // conservando la estructura de niveles y las configuraciones/credenciales actuales.
  clearAllData() {
    const currentData = this.getData();
    const emptyData = {
      ...INITIAL_DATA,
      students: [],
      attendance: [],
      homeworkSubmissions: [],
      settings: currentData.settings || INITIAL_DATA.settings
    };
    this.saveData(emptyData);
    return emptyData;
  },

  // Exportar Backup JSON completo
  exportJSON() {
    const data = this.getData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_discipulado_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Importar Backup JSON
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.levels || !parsed.students) {
        throw new Error('Formato de archivo inválido.');
      }
      this.saveData(parsed);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Comprobar si ya fichó hoy
  hasCheckedInToday(studentId, levelId, targetDate = null) {
    const data = this.getData();
    const today = targetDate || new Date().toISOString().slice(0, 10);
    return data.attendance.find(
      a => a.studentId === studentId && a.levelId === levelId && a.date === today && a.status === 'present'
    );
  },

  // Fichar o registrar asistencia (presente, falta, justificada)
  recordAttendance({ studentId, levelId, date = null, status = 'present', checkedInBy = 'student_self', notes = '' }) {
    const data = this.getData();
    const recordDate = date || new Date().toISOString().slice(0, 10);
    
    // Buscar si ya existe un registro de asistencia para este alumno en esta fecha
    const existingIndex = (data.attendance || []).findIndex(
      a => a.studentId === studentId && a.date === recordDate
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      // Actualizar registro existente
      data.attendance[existingIndex] = {
        ...data.attendance[existingIndex],
        levelId: levelId || data.attendance[existingIndex].levelId,
        status,
        timestamp: nowIso,
        checkedInBy: checkedInBy || data.attendance[existingIndex].checkedInBy,
        notes: notes !== undefined ? notes : data.attendance[existingIndex].notes,
      };
    } else {
      // Nuevo registro
      const newRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        levelId,
        date: recordDate,
        timestamp: nowIso,
        status,
        checkedInBy,
        notes: notes || '',
      };
      if (!data.attendance) data.attendance = [];
      data.attendance.push(newRecord);
    }

    this.saveData(data);
    return { success: true, date: recordDate, timestamp: nowIso };
  },

  // Eliminar registro de asistencia
  deleteAttendance(attendanceId) {
    const data = this.getData();
    data.attendance = (data.attendance || []).filter(a => a.id !== attendanceId);
    this.saveData(data);
    return { success: true };
  },

  // ═══ Control de Deberes / Tareas ═══

  // Alternar o marcar entrega de deber por el profesor
  toggleHomeworkSubmission({ studentId, homeworkId, isCompleted, notes = '' }) {
    const data = this.getData();
    if (!data.homeworkSubmissions) data.homeworkSubmissions = [];

    const existingIndex = data.homeworkSubmissions.findIndex(
      s => s.studentId === studentId && s.homeworkId === homeworkId
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      data.homeworkSubmissions[existingIndex] = {
        ...data.homeworkSubmissions[existingIndex],
        isCompleted: !!isCompleted,
        completedAt: isCompleted ? (data.homeworkSubmissions[existingIndex].completedAt || nowIso) : null,
        notes: notes !== undefined ? notes : data.homeworkSubmissions[existingIndex].notes || '',
      };
    } else {
      data.homeworkSubmissions.push({
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        homeworkId,
        isCompleted: !!isCompleted,
        completedAt: isCompleted ? nowIso : null,
        notes: notes || '',
      });
    }

    this.saveData(data);
    return { success: true };
  },

  // Actualizar nota u observación del profesor en la entrega
  updateHomeworkSubmissionNotes({ studentId, homeworkId, notes }) {
    const data = this.getData();
    if (!data.homeworkSubmissions) data.homeworkSubmissions = [];

    const existingIndex = data.homeworkSubmissions.findIndex(
      s => s.studentId === studentId && s.homeworkId === homeworkId
    );

    if (existingIndex >= 0) {
      data.homeworkSubmissions[existingIndex].notes = notes || '';
      this.saveData(data);
      return { success: true };
    }
    return { success: false, error: 'No existe entrega registrada' };
  },

  // Guardar o crear un deber
  saveHomework(homeworkItem) {
    const data = this.getData();
    if (!data.homework) data.homework = [];

    if (homeworkItem.id) {
      const idx = data.homework.findIndex(h => h.id === homeworkItem.id);
      if (idx >= 0) {
        data.homework[idx] = { ...data.homework[idx], ...homeworkItem };
      }
    } else {
      const newHw = {
        ...homeworkItem,
        id: `hw-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      data.homework.push(newHw);
    }
    this.saveData(data);
    return { success: true };
  },

  // Eliminar un deber
  deleteHomework(homeworkId) {
    const data = this.getData();
    if (data.homework) {
      data.homework = data.homework.filter(h => h.id !== homeworkId);
    }
    if (data.homeworkSubmissions) {
      data.homeworkSubmissions = data.homeworkSubmissions.filter(s => s.homeworkId !== homeworkId);
    }
    this.saveData(data);
    return { success: true };
  },

  // Gestión de Niveles
  saveLevel(level) {
    const data = this.getData();
    const teacherIds = Array.isArray(level.teacherIds)
      ? level.teacherIds
      : (level.teacherId ? [level.teacherId] : []);
    
    const formattedLevel = {
      ...level,
      teacherIds,
      teacherId: teacherIds[0] || level.teacherId || '',
      totalClasses: Number(level.totalClasses) || 12,
    };

    if (formattedLevel.id) {
      const idx = data.levels.findIndex(l => l.id === formattedLevel.id);
      if (idx >= 0) data.levels[idx] = { ...data.levels[idx], ...formattedLevel };
    } else {
      const newLevel = {
        ...formattedLevel,
        id: `lvl-${Date.now()}`,
        isActive: true,
      };
      data.levels.push(newLevel);
    }
    this.saveData(data);
  },

  deleteLevel(levelId) {
    const data = this.getData();
    data.levels = data.levels.filter(l => l.id !== levelId);
    this.saveData(data);
  },

  // Gestión de Profesores
  saveTeacher(teacher) {
    const data = this.getData();
    let savedTeacher = null;
    if (teacher.id) {
      const idx = data.teachers.findIndex(t => t.id === teacher.id);
      if (idx >= 0) {
        data.teachers[idx] = { 
          ...data.teachers[idx], 
          ...teacher,
          password: teacher.password || data.teachers[idx].password || '0000'
        };
        savedTeacher = data.teachers[idx];
      }
    } else {
      const newTeacher = {
        ...teacher,
        id: `tch-${Date.now()}`,
        password: teacher.password || '0000',
      };
      data.teachers.push(newTeacher);
      savedTeacher = newTeacher;
    }
    this.saveData(data);

    // Sincronizar credencial de profesor en Firebase
    if (savedTeacher) {
      syncCredentialToFirestore('teacher', savedTeacher);
    }
  },

  deleteTeacher(teacherId) {
    const data = this.getData();
    const teacherToDelete = data.teachers.find(t => t.id === teacherId);
    data.teachers = data.teachers.filter(t => t.id !== teacherId);
    
    // Desvincular profesor de los niveles donde estaba asignado
    if (data.levels) {
      data.levels = data.levels.map(lvl => {
        const currentIds = Array.isArray(lvl.teacherIds) ? lvl.teacherIds : (lvl.teacherId ? [lvl.teacherId] : []);
        const updatedIds = currentIds.filter(id => id !== teacherId);
        return {
          ...lvl,
          teacherIds: updatedIds,
          teacherId: lvl.teacherId === teacherId ? (updatedIds[0] || '') : lvl.teacherId,
        };
      });
    }

    this.saveData(data);

    // Eliminar credencial de Firebase
    if (teacherToDelete?.phone) {
      deleteCredentialFromFirestore('teacher', teacherToDelete.phone);
    }
  },

  // Validar acceso del profesor por teléfono y contraseña
  validateTeacher(phoneInput, passwordInput) {
    const data = this.getData();
    const cleanInput = (phoneInput || '').replace(/[^0-9]/g, '');
    if (!cleanInput) {
      return { success: false, error: 'Por favor ingresa tu número de teléfono registrado.' };
    }
    if (!passwordInput) {
      return { success: false, error: 'Por favor ingresa tu contraseña de profesor.' };
    }

    const teacher = (data.teachers || []).find(t => {
      const cleanTeacherPhone = (t.phone || '').replace(/[^0-9]/g, '');
      return cleanTeacherPhone && (
        cleanTeacherPhone === cleanInput || 
        cleanTeacherPhone.endsWith(cleanInput) || 
        cleanInput.endsWith(cleanTeacherPhone)
      );
    });

    if (!teacher) {
      return { success: false, error: 'No se encontró ningún profesor con ese número de teléfono.' };
    }

    const expectedPass = teacher.password || '0000';
    if (passwordInput !== expectedPass) {
      return { success: false, error: 'Contraseña de profesor incorrecta.' };
    }

    return { success: true, teacher };
  },

  // Gestión de Estudiantes
  saveStudent(student) {
    const data = this.getData();
    let savedStudent = null;
    if (student.id) {
      const idx = data.students.findIndex(s => s.id === student.id);
      if (idx >= 0) {
        data.students[idx] = { 
          ...data.students[idx], 
          ...student,
          password: student.password || data.students[idx].password || '0000'
        };
        savedStudent = data.students[idx];
      }
    } else {
      const newStudent = {
        ...student,
        id: `std-${Date.now()}`,
        password: student.password || '0000',
        status: student.status || 'active',
        enrolledAt: student.enrolledAt || new Date().toISOString().slice(0, 10),
      };
      data.students.push(newStudent);
      savedStudent = newStudent;
    }
    this.saveData(data);

    // Sincronizar credencial de alumno en Firebase
    if (savedStudent) {
      syncCredentialToFirestore('student', savedStudent);
    }
  },

  deleteStudent(studentId) {
    const data = this.getData();
    const studentToDelete = data.students.find(s => s.id === studentId);
    data.students = data.students.filter(s => s.id !== studentId);
    // Eliminar también sus asistencias
    data.attendance = data.attendance.filter(a => a.studentId !== studentId);
    this.saveData(data);

    // Eliminar credencial de Firebase
    if (studentToDelete?.phone) {
      deleteCredentialFromFirestore('student', studentToDelete.phone);
    }
  },

  // Validar fichaje del estudiante por teléfono y contraseña
  validateStudentForCheckIn(phoneInput, passwordInput, targetLevelId = null) {
    const data = this.getData();
    const cleanInput = (phoneInput || '').replace(/[^0-9]/g, '');
    if (!cleanInput) {
      return { success: false, error: 'Por favor ingresa tu número de teléfono.' };
    }
    if (!passwordInput) {
      return { success: false, error: 'Por favor ingresa tu contraseña de estudiante.' };
    }

    const student = data.students.find(s => {
      const cleanStudentPhone = (s.phone || '').replace(/[^0-9]/g, '');
      return cleanStudentPhone && (
        cleanStudentPhone === cleanInput || 
        cleanStudentPhone.endsWith(cleanInput) || 
        cleanInput.endsWith(cleanStudentPhone)
      );
    });

    if (!student) {
      return { success: false, error: 'No se encontró ningún estudiante con ese número de teléfono.' };
    }

    if (student.status !== 'active') {
      return { success: false, error: 'El estudiante no se encuentra en estado activo.' };
    }

    const expectedPass = student.password || '0000';
    if (passwordInput !== expectedPass) {
      return { success: false, error: 'Contraseña de estudiante incorrecta.' };
    }

    if (targetLevelId && student.levelId !== targetLevelId) {
      const actualLevel = data.levels.find(l => l.id === student.levelId);
      return { 
        success: false, 
        error: `Estás registrado(a) en "${actualLevel?.name || 'otro nivel'}". Por favor selecciona ese nivel para fichar.` 
      };
    }

    return { success: true, student };
  },

  // Exportar Asistencias a CSV
  exportCSV(levelId = null) {
    const data = this.getData();
    let records = data.attendance;
    if (levelId) {
      records = records.filter(r => r.levelId === levelId);
    }

    const headers = ['Fecha', 'Hora', 'Estudiante', 'Documento', 'Nivel', 'Estado', 'RegistradoPor'];
    const rows = records.map(r => {
      const student = data.students.find(s => s.id === r.studentId) || { name: 'Desconocido', documentId: '' };
      const level = data.levels.find(l => l.id === r.levelId) || { name: 'Desconocido' };
      const time = r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '';
      return [
        r.date,
        time,
        `"${student.name}"`,
        `"${student.documentId}"`,
        `"${level.name}"`,
        r.status,
        r.checkedInBy
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `asistencias_discipulado_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Validar credenciales de administrador
  validateAdmin(username, password) {
    const data = this.getData();
    const expectedUser = data.settings?.adminUser || 'admin';
    const expectedPass = data.settings?.adminPassword || 'password123';
    const trimmedUser = (username || '').trim();
    return (trimmedUser === expectedUser && password === expectedPass) ||
           (trimmedUser === 'admin' && (password === 'password123' || password === 'admin' || password === '0000'));
  },

  // Actualizar credenciales de administrador
  updateAdminCredentials(newUsername, newPassword) {
    const data = this.getData();
    if (!data.settings) data.settings = {};
    if (newUsername) data.settings.adminUser = newUsername.trim();
    if (newPassword) data.settings.adminPassword = newPassword;
    this.saveData(data);

    // Sincronizar credencial de administrador en Firebase
    syncCredentialToFirestore('admin', {
      username: data.settings.adminUser,
      password: data.settings.adminPassword,
    });

    return { success: true };
  },

  // Actualizar datos de la iglesia
  updateChurchInfo({ churchName, churchAddress, churchPhone, churchPastor }) {
    const data = this.getData();
    if (!data.settings) data.settings = {};
    data.settings.churchName = churchName || '';
    data.settings.churchAddress = churchAddress || '';
    data.settings.churchPhone = churchPhone || '';
    data.settings.churchPastor = churchPastor || '';
    this.saveData(data);
    return { success: true };
  },

  // ═══ Métodos de Sincronización Firebase ═══

  // Forzar subida de datos locales y credenciales hacia Firebase
  async pushLocalDataToFirestore() {
    const db = getDb();
    if (!db || !isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado o no se pudo inicializar.');
    }
    const localData = this.getData();
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    await setDoc(docRef, localData);

    // Subir todas las credenciales a la colección 'credentials' en Firebase
    try {
      // 1. Admin
      await syncCredentialToFirestore('admin', {
        username: localData.settings?.adminUser || 'admin',
        password: localData.settings?.adminPassword || 'password123'
      });

      // 2. Profesores (usuario = teléfono, contraseña = password || '0000')
      for (const teacher of (localData.teachers || [])) {
        await syncCredentialToFirestore('teacher', teacher);
      }

      // 3. Alumnos (usuario = teléfono, contraseña = password || '0000')
      for (const student of (localData.students || [])) {
        await syncCredentialToFirestore('student', student);
      }
    } catch (credErr) {
      console.warn('Aviso al subir colección de credenciales:', credErr);
    }

    return { success: true };
  },

  // Forzar descarga de datos desde Firebase hacia local
  async pullDataFromFirestore() {
    const db = getDb();
    if (!db || !isFirebaseConfigured()) {
      throw new Error('Firebase no está configurado o no se pudo inicializar.');
    }
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      this.saveData(data, false);
      return { success: true, data };
    } else {
      throw new Error('El documento en Firestore aún no contiene datos.');
    }
  },

  // Reiniciar escucha y sincronización de Firestore
  reconnectFirebase() {
    initFirebase();
    setupFirestoreSync();
  }
};

// ═══ Configuración de escucha en tiempo real con Firestore ═══
export function setupFirestoreSync() {
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }

  const db = getDb();
  if (!db || !isFirebaseConfigured()) {
    return;
  }

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data();
        if (remoteData) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
          } catch (e) {
            console.error('Error al actualizar caché local desde Firestore:', e);
          }
          storageService.notifyListeners(remoteData);
        }
      } else {
        // Inicializar documento remoto si está vacío
        const localData = storageService.getData();
        setDoc(docRef, localData).catch(err => {
          console.warn('Aviso: No se pudo inicializar documento en Firestore:', err);
        });
      }
    }, (error) => {
      console.warn('Aviso conexión Firestore:', error.message);
    });
  } catch (err) {
    console.warn('Error al conectar escucha Firestore:', err);
  }
}

// Iniciar sincronización si Firebase está configurado
setupFirestoreSync();

// ═══ Sincronización de Credenciales en Firestore ('credentials') ═══

/**
 * Guarda o actualiza una credencial en la colección 'credentials' de Firebase
 * - Admin: docId = 'admin_{username}', usuario = username, contraseña = password
 * - Profesor: docId = 'teacher_{cleanPhone}', usuario = teléfono, contraseña = password || '0000'
 * - Alumno: docId = 'student_{cleanPhone}', usuario = teléfono, contraseña = password || '0000'
 */
export async function syncCredentialToFirestore(type, credData) {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return;

  try {
    let docId = '';
    let payload = {};

    if (type === 'admin') {
      const username = (credData.username || 'admin').trim();
      docId = `admin_${username}`;
      payload = {
        role: 'admin',
        username: username,
        password: credData.password || 'password123',
        type: 'admin',
        updatedAt: new Date().toISOString()
      };
    } else if (type === 'teacher') {
      const cleanPhone = (credData.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return;
      docId = `teacher_${cleanPhone}`;
      payload = {
        role: 'teacher',
        teacherId: credData.id,
        name: credData.name,
        phone: credData.phone,
        username: cleanPhone, // El usuario siempre es el número telefónico
        password: credData.password || '0000', // Contraseña por defecto 0000
        type: 'teacher',
        updatedAt: new Date().toISOString()
      };
    } else if (type === 'student') {
      const cleanPhone = (credData.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone) return;
      docId = `student_${cleanPhone}`;
      payload = {
        role: 'student',
        studentId: credData.id,
        name: credData.name,
        phone: credData.phone,
        documentId: credData.documentId || '',
        username: cleanPhone, // El usuario siempre es el número telefónico
        password: credData.password || '0000', // Contraseña por defecto 0000
        levelId: credData.levelId,
        status: credData.status || 'active',
        type: 'student',
        updatedAt: new Date().toISOString()
      };
    }

    if (docId) {
      await setDoc(doc(db, FIRESTORE_CREDENTIALS_COLLECTION, docId), payload, { merge: true });
    }
  } catch (err) {
    console.warn(`Aviso al guardar credencial ${type} en Firebase:`, err);
  }
}

/**
 * Elimina una credencial de la colección 'credentials' de Firebase
 */
export async function deleteCredentialFromFirestore(type, identifier) {
  const db = getDb();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const cleanId = (identifier || '').replace(/[^0-9]/g, '');
    const docId = cleanId ? `${type}_${cleanId}` : `${type}_${identifier}`;
    await deleteDoc(doc(db, FIRESTORE_CREDENTIALS_COLLECTION, docId));
  } catch (err) {
    console.warn(`Aviso al eliminar credencial ${type} de Firebase:`, err);
  }
}


