# 📖 Sistema de Control de Asistencia - Discipulado

Aplicación web progresiva moderna, responsiva y optimizada para teléfonos móviles y computadoras, diseñada para gestionar la asistencia en cursos de Discipulado multivariable (Niveles 1, 2, 3 y más), profesores, estudiantes y seguimiento de ausencias.

Desplegable de forma 100% gratuita en **GitHub Pages**.

---

## ✨ Características Principales

1. **📱 Fichaje Móvil para Estudiantes**:
   - Cada participante accede desde su propio teléfono móvil a la URL web.
   - Selección de su nivel de discipulado (Nivel 1, Nivel 2, Nivel 3 o nuevos).
   - Buscador rápido por nombre, apellido o DNI.
   - Botón de fichaje instantáneo con animación de celebración (confeti) y versículo bíblico inspirador.
   - **Prevención de doble fichaje**: No permite registrar dos veces la asistencia en la misma sesión/día.

2. **⚙️ Panel de Administración (PIN por defecto: `1234`)**:
   - **Gestión de Niveles**: Crear nuevos niveles, configurar día de la semana, horario, aula y asignar profesor responsable.
   - **Gestión de Profesores**: Registro de maestros/líderes con teléfono de contacto, email y cursos a cargo.
   - **Gestión de Estudiantes**: Alta de nuevos alumnos, asignación o promoción de nivel (ej. avanzar de Nivel 1 a Nivel 2) y estado activo/graduado.
   - **Control de Inasistencias**:
     - Vista de roll-call en vivo por fecha y nivel.
     - Marcado rápido de Presente / Ausente.
     - **Semáforo de ausencias** (detecta automáticamente a estudiantes con 2 o más faltas consecutivas).
     - **Seguimiento Pastoral por WhatsApp**: Botón directo que abre una conversación de WhatsApp con un mensaje prediseñado cariñoso y pastoral para reconectar con el alumno.

3. **💾 Copias de Seguridad y Reportes**:
   - Exportación de listados de asistencia a **Excel / CSV**.
   - Descarga de copia de seguridad completa en **JSON** y restauración con 1 clic.
   - Persistencia local y compatibilidad con sincronización en la nube (Google Firebase Firestore).

---

## 🚀 Cómo Ejecutar Localmente

```bash
# 1. Instalar dependencias (si no lo has hecho aún)
npm install

# 2. Iniciar servidor de desarrollo local
npm run dev
```

Abre en tu navegador la dirección indicada (usualmente `http://localhost:5173/`).

---

## 🌐 Cómo Publicar Gratuitamente en GitHub Pages

Este proyecto ya incluye el flujo de trabajo automatizado en `.github/workflows/deploy.yml`. Para publicarlo:

1. **Crea un nuevo repositorio en GitHub** (público o privado).
2. **Sube el código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Asistencia Discipulado"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
3. **Activar GitHub Pages en el repositorio**:
   - Entra en tu repositorio en GitHub.
   - Ve a **Settings** (Configuración) > **Pages** (en el menú lateral izquierdo).
   - En **Build and deployment** > **Source**, selecciona: **`GitHub Actions`**.
4. ¡Listo! En 1-2 minutos tu aplicación estará publicada en:  
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

---

## 📋 Credenciales Iniciales
- **Acceso al Panel Admin**: PIN `1234` (o pulsa *Acceder* directamente).
