// src/services/excelExportService.js
// Servicio de exportación de reportes a formato Excel (.xlsx) con formato profesional
// Utiliza ExcelJS para soporte completo de estilos, tablas con filtros, filas alternadas, bordes y colores.

import { storageService } from './storageService';

// ═══════════════════════════════════════════════════════
//  CONSTANTES DE ESTILO
// ═══════════════════════════════════════════════════════

const COLORS = {
  headerBg: '2E7D32',       // Verde oscuro (encabezado de tabla como la imagen)
  headerFont: 'FFFFFF',     // Blanco
  bandedRow: 'E8F5E9',      // Verde muy claro (filas alternadas)
  white: 'FFFFFF',
  churchTitleBg: '1B5E20',  // Verde más oscuro para título de iglesia
  churchSubBg: 'C8E6C9',    // Verde suave para subtítulo
  borderColor: 'B0BEC5',    // Gris azulado suave para bordes
  accentBlue: '1565C0',     // Azul para títulos de secciones
  lightGray: 'F5F5F5',      // Gris claro
};

const FONT_HEADER = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: COLORS.headerFont },
};

const FONT_CHURCH_TITLE = {
  name: 'Calibri',
  size: 16,
  bold: true,
  color: { argb: COLORS.headerFont },
};

const FONT_CHURCH_SUB = {
  name: 'Calibri',
  size: 11,
  bold: false,
  color: { argb: '333333' },
};

const FONT_BODY = {
  name: 'Calibri',
  size: 10,
  color: { argb: '333333' },
};

const FONT_BODY_BOLD = {
  name: 'Calibri',
  size: 10,
  bold: true,
  color: { argb: '1E293B' },
};

const BORDER_THIN = {
  top: { style: 'thin', color: { argb: COLORS.borderColor } },
  left: { style: 'thin', color: { argb: COLORS.borderColor } },
  bottom: { style: 'thin', color: { argb: COLORS.borderColor } },
  right: { style: 'thin', color: { argb: COLORS.borderColor } },
};

const ALIGN_CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true };
const ALIGN_LEFT = { horizontal: 'left', vertical: 'middle', wrapText: true };

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Agrega el encabezado de la iglesia a una hoja de cálculo.
 * Retorna el número de fila siguiente disponible.
 */
function addChurchHeader(ws, churchInfo, colCount, subtitle) {
  const { churchName, churchAddress, churchPhone, churchPastor } = churchInfo;
  let row = 1;

  // Fila 1: Nombre de la iglesia (merge a todo el ancho)
  ws.mergeCells(row, 1, row, colCount);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = (churchName || 'IGLESIA CRISTIANA').toUpperCase();
  titleCell.font = FONT_CHURCH_TITLE;
  titleCell.alignment = ALIGN_CENTER;
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.churchTitleBg } };
  row++;

  // Fila 2: Subtítulo del reporte
  ws.mergeCells(row, 1, row, colCount);
  const subCell = ws.getCell(row, 1);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1B5E20' } };
  subCell.alignment = ALIGN_CENTER;
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.churchSubBg } };
  row++;

  // Fila 3: Dirección, Teléfono, Pastor (en una sola fila)
  const infoItems = [];
  if (churchAddress) infoItems.push(`📍 ${churchAddress}`);
  if (churchPhone) infoItems.push(`📞 ${churchPhone}`);
  if (churchPastor) infoItems.push(`👤 ${churchPastor}`);
  
  if (infoItems.length > 0) {
    ws.mergeCells(row, 1, row, colCount);
    const infoCell = ws.getCell(row, 1);
    infoCell.value = infoItems.join('    |    ');
    infoCell.font = FONT_CHURCH_SUB;
    infoCell.alignment = ALIGN_CENTER;
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.churchSubBg } };
    row++;
  }

  // Fila 4: Fecha de generación
  ws.mergeCells(row, 1, row, colCount);
  const dateCell = ws.getCell(row, 1);
  dateCell.value = `Generado: ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}`;
  dateCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '666666' } };
  dateCell.alignment = ALIGN_CENTER;
  row++;

  // Fila vacía de separación
  row++;

  return row;
}

/**
 * Aplica estilos de tabla profesional: encabezados verdes, filas alternadas, bordes, auto-filtros.
 */
function styleTableRows(ws, headerRow, dataStartRow, dataEndRow, colCount) {
  // Estilizar encabezado
  for (let col = 1; col <= colCount; col++) {
    const cell = ws.getCell(headerRow, col);
    cell.font = FONT_HEADER;
    cell.alignment = ALIGN_CENTER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.border = BORDER_THIN;
  }

  // Estilizar filas de datos con bandas alternadas
  for (let r = dataStartRow; r <= dataEndRow; r++) {
    const isEven = (r - dataStartRow) % 2 === 0;
    for (let col = 1; col <= colCount; col++) {
      const cell = ws.getCell(r, col);
      cell.font = FONT_BODY;
      cell.alignment = ALIGN_LEFT;
      cell.border = BORDER_THIN;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.white : COLORS.bandedRow },
      };
    }
  }

  // Auto-filtro en el encabezado
  ws.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: dataEndRow, column: colCount },
  };
}

// ═══════════════════════════════════════════════════════
//  EXPORT PRINCIPAL
// ═══════════════════════════════════════════════════════

/**
 * Genera y descarga un reporte completo en formato .xlsx
 * con encabezado de la iglesia, tablas formateadas por nivel,
 * listado de estudiantes y registro de asistencias.
 * 
 * @param {string|null} filterLevelId - Si se pasa un levelId, solo exporta ese nivel
 */
export async function exportExcelReport(filterLevelId = null) {
  // Carga dinámica de ExcelJS para reducir bundle inicial
  const ExcelJS = await import('exceljs');
  const { saveAs } = await import('file-saver');

  const data = storageService.getData();
  const { students = [], levels = [], teachers = [], attendance = [], settings = {} } = data;

  const churchInfo = {
    churchName: settings.churchName || 'Iglesia Cristiana',
    churchAddress: settings.churchAddress || '',
    churchPhone: settings.churchPhone || '',
    churchPastor: settings.churchPastor || '',
  };

  const activeLevels = levels.filter(l => l.isActive !== false);
  const targetLevels = filterLevelId
    ? activeLevels.filter(l => l.id === filterLevelId)
    : activeLevels;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'DisciCheck - Control de Asistencia';
  wb.created = new Date();

  const today = new Date().toISOString().slice(0, 10);

  // ════════════════════════════════════════════════════════
  //  HOJA 1: REPORTE DE ASISTENCIA
  // ════════════════════════════════════════════════════════
  const wsAttendance = wb.addWorksheet('Reporte de Asistencia', {
    properties: { tabColor: { argb: '2E7D32' } },
  });

  const attHeaders = ['Nº', 'Fecha', 'Hora', 'Estudiante', 'Documento', 'Nivel', 'Estado', 'Registrado Por'];
  const attColCount = attHeaders.length;

  // Anchos de columna
  wsAttendance.columns = [
    { width: 6 },   // Nº
    { width: 14 },  // Fecha
    { width: 10 },  // Hora
    { width: 28 },  // Estudiante
    { width: 16 },  // Documento
    { width: 34 },  // Nivel
    { width: 12 },  // Estado
    { width: 22 },  // Registrado por
  ];

  // Encabezado de iglesia
  let attRow = addChurchHeader(wsAttendance, churchInfo, attColCount, 'REPORTE COMPLETO DE ASISTENCIA');

  // Encabezado de tabla
  const attHeaderRow = attRow;
  wsAttendance.getRow(attRow).values = attHeaders;
  attRow++;

  // Datos de asistencia
  let records = attendance;
  if (filterLevelId) {
    records = records.filter(r => r.levelId === filterLevelId);
  }

  // Ordenar por fecha descendente
  records = [...records].sort((a, b) => {
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    return (b.timestamp || '').localeCompare(a.timestamp || '');
  });

  const attDataStartRow = attRow;
  records.forEach((record, idx) => {
    const student = students.find(s => s.id === record.studentId) || { name: 'Desconocido', documentId: '' };
    const level = levels.find(l => l.id === record.levelId) || { name: 'Desconocido' };
    const time = record.timestamp
      ? new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '—';

    wsAttendance.getRow(attRow).values = [
      idx + 1,
      record.date || '—',
      time,
      student.name,
      student.documentId || '—',
      level.name,
      record.status === 'present' ? '✅ Presente' : record.status === 'absent' ? '❌ Ausente' : record.status,
      record.checkedInBy || '—',
    ];
    attRow++;
  });

  const attDataEndRow = Math.max(attRow - 1, attDataStartRow);

  // Si no hay registros, agregar fila vacía informativa
  if (records.length === 0) {
    wsAttendance.getRow(attRow).values = ['', '', '', 'Sin registros de asistencia', '', '', '', ''];
    attRow++;
  }

  // Aplicar formato de tabla
  styleTableRows(wsAttendance, attHeaderRow, attDataStartRow, attDataEndRow, attColCount);

  // Fila de totales al final
  attRow++;
  wsAttendance.mergeCells(attRow, 1, attRow, 3);
  const totalCell = wsAttendance.getCell(attRow, 1);
  totalCell.value = 'TOTAL REGISTROS:';
  totalCell.font = FONT_BODY_BOLD;
  totalCell.alignment = { horizontal: 'right', vertical: 'middle' };
  
  const totalValCell = wsAttendance.getCell(attRow, 4);
  totalValCell.value = records.length;
  totalValCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.headerBg } };

  // ════════════════════════════════════════════════════════
  //  HOJA 2: ESTUDIANTES INSCRITOS
  // ════════════════════════════════════════════════════════
  const wsStudents = wb.addWorksheet('Estudiantes Inscritos', {
    properties: { tabColor: { argb: '1565C0' } },
  });

  const stdHeaders = ['Nº', 'Nombre Completo', 'Documento/ID', 'Teléfono', 'Nivel', 'Día de Clase', 'Profesor', 'Estado', 'Asistencias', 'Observaciones'];
  const stdColCount = stdHeaders.length;

  wsStudents.columns = [
    { width: 6 },   // Nº
    { width: 28 },  // Nombre
    { width: 16 },  // Documento
    { width: 18 },  // Teléfono
    { width: 34 },  // Nivel
    { width: 14 },  // Día
    { width: 26 },  // Profesor
    { width: 14 },  // Estado
    { width: 12 },  // Asistencias
    { width: 30 },  // Observaciones
  ];

  let stdRow = addChurchHeader(wsStudents, churchInfo, stdColCount, 'LISTADO DE ESTUDIANTES INSCRITOS — PROGRAMA DE DISCIPULADO');

  // Encabezado de tabla
  const stdHeaderRow = stdRow;
  wsStudents.getRow(stdRow).values = stdHeaders;
  stdRow++;

  // Agrupar estudiantes por nivel
  const targetStudents = students
    .filter(s => !filterLevelId || s.levelId === filterLevelId)
    .sort((a, b) => {
      const la = levels.findIndex(l => l.id === a.levelId);
      const lb = levels.findIndex(l => l.id === b.levelId);
      if (la !== lb) return la - lb;
      return a.name.localeCompare(b.name);
    });

  const stdDataStartRow = stdRow;
  let currentLevelId = null;

  targetStudents.forEach((student, idx) => {
    const level = levels.find(l => l.id === student.levelId);
    const levelTeachers = teachers.filter(t => 
      (Array.isArray(level?.teacherIds) && level.teacherIds.includes(t.id)) || t.id === level?.teacherId
    );
    const teacherNames = levelTeachers.map(t => t.name).join(', ') || 'Sin Asignar';
    const presents = attendance.filter(a => a.studentId === student.id && a.status === 'present').length;

    const statusLabel = student.status === 'active' ? '✅ Activo'
      : student.status === 'graduated' ? '🎓 Graduado'
      : '⚠️ Inactivo';

    // Separador visual entre niveles: fila de grupo
    if (level && level.id !== currentLevelId) {
      currentLevelId = level.id;
      // Fila de separador de nivel
      wsStudents.mergeCells(stdRow, 1, stdRow, stdColCount);
      const groupCell = wsStudents.getCell(stdRow, 1);
      groupCell.value = `📘 ${level.name}  —  ${level.dayOfWeek || ''} ${level.time || ''}  —  ${teacherNames}`;
      groupCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerFont } };
      groupCell.alignment = { horizontal: 'left', vertical: 'middle' };
      groupCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accentBlue } };
      groupCell.border = BORDER_THIN;
      stdRow++;
    }

    wsStudents.getRow(stdRow).values = [
      idx + 1,
      student.name,
      student.documentId || '—',
      student.phone || '—',
      level?.name || 'Sin Nivel',
      level?.dayOfWeek || '—',
      teacher?.name || '—',
      statusLabel,
      presents,
      student.notes || '',
    ];
    stdRow++;
  });

  const stdDataEndRow = Math.max(stdRow - 1, stdDataStartRow);

  // Aplicar formato de tabla (solo a las filas de datos, no a los separadores de grupo)
  // Encabezado
  for (let col = 1; col <= stdColCount; col++) {
    const cell = wsStudents.getCell(stdHeaderRow, col);
    cell.font = FONT_HEADER;
    cell.alignment = ALIGN_CENTER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.border = BORDER_THIN;
  }

  // Filas de datos (excluyendo separadores de grupo que ya tienen estilo)
  let bandIdx = 0;
  for (let r = stdDataStartRow; r <= stdDataEndRow; r++) {
    const firstCellVal = wsStudents.getCell(r, 1).value;
    // Si es una celda de grupo mergeada (string que empieza con 📘), saltarla
    if (typeof firstCellVal === 'string' && firstCellVal.includes('📘')) {
      bandIdx = 0; // reset banding after group header
      continue;
    }
    for (let col = 1; col <= stdColCount; col++) {
      const cell = wsStudents.getCell(r, col);
      cell.font = FONT_BODY;
      cell.alignment = ALIGN_LEFT;
      cell.border = BORDER_THIN;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bandIdx % 2 === 0 ? COLORS.white : COLORS.bandedRow },
      };
    }
    // Bold para el nombre
    wsStudents.getCell(r, 2).font = FONT_BODY_BOLD;
    bandIdx++;
  }

  // Auto-filtro
  wsStudents.autoFilter = {
    from: { row: stdHeaderRow, column: 1 },
    to: { row: stdDataEndRow, column: stdColCount },
  };

  // Fila de resumen
  stdRow++;
  wsStudents.mergeCells(stdRow, 1, stdRow, 4);
  const stdTotalCell = wsStudents.getCell(stdRow, 1);
  stdTotalCell.value = `TOTAL ESTUDIANTES: ${targetStudents.length}`;
  stdTotalCell.font = FONT_BODY_BOLD;
  stdTotalCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // Resumen por nivel
  stdRow++;
  targetLevels.forEach(level => {
    const count = targetStudents.filter(s => s.levelId === level.id).length;
    stdRow++;
    wsStudents.mergeCells(stdRow, 1, stdRow, 4);
    wsStudents.getCell(stdRow, 1).value = `${level.name}:`;
    wsStudents.getCell(stdRow, 1).font = FONT_BODY;
    wsStudents.getCell(stdRow, 1).alignment = { horizontal: 'right', vertical: 'middle' };
    wsStudents.getCell(stdRow, 5).value = `${count} estudiantes`;
    wsStudents.getCell(stdRow, 5).font = FONT_BODY_BOLD;
  });

  // ════════════════════════════════════════════════════════
  //  FIJAR PANELES (freeze panes) para encabezados
  // ════════════════════════════════════════════════════════
  wsAttendance.views = [{ state: 'frozen', ySplit: attHeaderRow, activeCell: `A${attHeaderRow + 1}` }];
  wsStudents.views = [{ state: 'frozen', ySplit: stdHeaderRow, activeCell: `A${stdHeaderRow + 1}` }];

  // ════════════════════════════════════════════════════════
  //  GENERAR Y DESCARGAR
  // ════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const filename = filterLevelId
    ? `reporte_${levels.find(l => l.id === filterLevelId)?.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '_') || 'nivel'}_${today}.xlsx`
    : `reporte_discipulado_completo_${today}.xlsx`;

  saveAs(blob, filename);
}
