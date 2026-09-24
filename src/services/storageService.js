// src/services/storageService.js
// Servicio de datos y persistencia para Control de Asistencia Discipulado

const STORAGE_KEY = 'discipulado_attendance_data_v1';

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
    },
    {
      id: 'tch-2',
      name: 'Hna. Miriam Valdés',
      phone: '+34 622 334 455',
      email: 'miriam.valdes@iglesia.org',
      role: 'Coordinadora Nivel 2',
    },
    {
      id: 'tch-3',
      name: 'Pastor David Gómez',
      phone: '+34 633 445 566',
      email: 'david.gomez@iglesia.org',
      role: 'Coordinador Nivel 3',
    },
  ],
  students: [
    // Nivel 1
    {
      id: 'std-101',
      name: 'Carlos Mendoza',
      documentId: '1001',
      phone: '+34600111222',
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
      password: '1234',
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
            password: s.password || '1234'
          }));
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
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners(data);
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
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

  // Fichar asistencia
  recordAttendance({ studentId, levelId, date = null, status = 'present', checkedInBy = 'student_self', notes = '' }) {
    const data = this.getData();
    const recordDate = date || new Date().toISOString().slice(0, 10);
    
    // Buscar si ya existe un registro de asistencia para este alumno en esta fecha
    const existingIndex = data.attendance.findIndex(
      a => a.studentId === studentId && a.levelId === levelId && a.date === recordDate
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      // Actualizar registro existente
      data.attendance[existingIndex] = {
        ...data.attendance[existingIndex],
        status,
        timestamp: nowIso,
        checkedInBy,
        notes: notes || data.attendance[existingIndex].notes,
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
        notes,
      };
      data.attendance.push(newRecord);
    }

    this.saveData(data);
    return { success: true, date: recordDate, timestamp: nowIso };
  },

  // Gestión de Niveles
  saveLevel(level) {
    const data = this.getData();
    if (level.id) {
      const idx = data.levels.findIndex(l => l.id === level.id);
      if (idx >= 0) data.levels[idx] = { ...data.levels[idx], ...level };
    } else {
      const newLevel = {
        ...level,
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
    if (teacher.id) {
      const idx = data.teachers.findIndex(t => t.id === teacher.id);
      if (idx >= 0) data.teachers[idx] = { ...data.teachers[idx], ...teacher };
    } else {
      const newTeacher = {
        ...teacher,
        id: `tch-${Date.now()}`,
      };
      data.teachers.push(newTeacher);
    }
    this.saveData(data);
  },

  deleteTeacher(teacherId) {
    const data = this.getData();
    data.teachers = data.teachers.filter(t => t.id !== teacherId);
    this.saveData(data);
  },

  // Gestión de Estudiantes
  saveStudent(student) {
    const data = this.getData();
    if (student.id) {
      const idx = data.students.findIndex(s => s.id === student.id);
      if (idx >= 0) {
        data.students[idx] = { 
          ...data.students[idx], 
          ...student,
          password: student.password || data.students[idx].password || '1234'
        };
      }
    } else {
      const newStudent = {
        ...student,
        id: `std-${Date.now()}`,
        password: student.password || '1234',
        status: student.status || 'active',
        enrolledAt: student.enrolledAt || new Date().toISOString().slice(0, 10),
      };
      data.students.push(newStudent);
    }
    this.saveData(data);
  },

  deleteStudent(studentId) {
    const data = this.getData();
    data.students = data.students.filter(s => s.id !== studentId);
    // Eliminar también sus asistencias
    data.attendance = data.attendance.filter(a => a.studentId !== studentId);
    this.saveData(data);
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

    const expectedPass = student.password || '1234';
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
    return username.trim() === expectedUser && password === expectedPass;
  },

  // Actualizar credenciales de administrador
  updateAdminCredentials(newUsername, newPassword) {
    const data = this.getData();
    if (!data.settings) data.settings = {};
    if (newUsername) data.settings.adminUser = newUsername.trim();
    if (newPassword) data.settings.adminPassword = newPassword;
    this.saveData(data);
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
  }
};
