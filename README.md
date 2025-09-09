# Sistema de Gestión de Turnos Médicos - CEM Nariño

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración e Instalación](#configuración-e-instalación)
6. [Funcionalidades Principales](#funcionalidades-principales)
7. [API y Endpoints](#api-y-endpoints)
8. [WebSockets y Tiempo Real](#websockets-y-tiempo-real)
9. [Frontend - Módulos JavaScript](#frontend---módulos-javascript)
10. [Estilos CSS Modulares](#estilos-css-modulares)
11. [Base de Datos](#base-de-datos)
12. [Guía de Uso](#guía-de-uso)
13. [Desarrollo y Mantenimiento](#desarrollo-y-mantenimiento)
14. [Troubleshooting](#troubleshooting)
15. [Changelog](#changelog)

---

## 📝 Descripción General

El **Sistema de Gestión de Turnos Médicos** es una aplicación web completa diseñada para el Centro Médico de Especialistas de Nariño (CEM Nariño). Permite gestionar de forma eficiente los turnos de pacientes en múltiples consultorios médicos con funcionalidades en tiempo real.

### 🎯 Objetivos Principales

- **Gestión Integral**: Administrar consultorios, pacientes y turnos desde una interfaz unificada
- **Tiempo Real**: Sincronización instantánea entre todas las pantallas usando WebSockets
- **Audio Automático**: Generación y reproducción de anuncios de turnos por voz
- **Informante Visual**: Pantalla dedicada para mostrar turnos actuales en salas de espera
- **Exportación de Datos**: Generación de reportes en Excel
- **Modularidad**: Arquitectura escalable y mantenible

### 🏥 Consultorios Soportados

1. **Consultorio 1** - Dr. Julio Contreras (Piso 1)
2. **Consultorio 2** - Dr. Miguel Salas (Piso 1)
3. **Consultorio 3** - Dra. Carolina Velez (Piso 2)
4. **Laboratorio** - Dr. Andrés Rivera (Piso 1)

---

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de       │
│   (HTML/JS/CSS) │◄──►│   (FastAPI)     │◄──►│   Datos         │
│                 │    │                 │    │   (SQLite)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              WebSockets
```

### Componentes Principales

1. **Frontend SPA (Single Page Application)**

   - HTML5 + CSS3 + JavaScript ES6+
   - Interfaz de pestañas para diferentes módulos
   - WebSocket para actualizaciones en tiempo real
   - Reproductor de audio automático

2. **Backend API REST**

   - FastAPI (Python)
   - SQLModel para ORM
   - WebSocket Manager para conexiones en tiempo real
   - Generación de audio con gTTS (Google Text-to-Speech)

3. **Base de Datos**

   - SQLite para desarrollo
   - Modelos: Consultorios, Pacientes (EntradaPaciente)

4. **Sistema de Audio**
   - Generación automática de archivos MP3
   - Reproducción sincronizada en múltiples dispositivos

---

## 💻 Tecnologías Utilizadas

### Frontend

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modulares con variables CSS
- **JavaScript ES6+**: Módulos, async/await, classes
- **Material Icons**: Iconografía
- **WebSocket API**: Comunicación en tiempo real

### Backend

- **Python 3.12+**
- **FastAPI**: Framework web moderno
- **SQLModel**: ORM basado en SQLAlchemy + Pydantic
- **SQLite**: Base de datos
- **gTTS**: Generación de texto-a-voz
- **asyncio**: Programación asíncrona

### Herramientas de Desarrollo

- **Git**: Control de versiones
- **VS Code**: Editor recomendado
- **Python venv**: Entornos virtuales
- **HTTP Server**: Servidor de desarrollo local

---

## 📁 Estructura del Proyecto

```
cem-turnero-legacy/
├── 📄 index.html                 # Punto de entrada principal
├── 🎨 css/                       # Estilos CSS modulares
│   ├── common.css               # Estilos compartidos
│   ├── consultorios.css         # Estilos de consultorios
│   ├── pacientes.css           # Estilos de pacientes
│   ├── turnos.css              # Estilos de turnos
│   ├── historial.css           # Estilos de historial
│   ├── informante.css          # Estilos del informante
│   └── README.md               # Documentación CSS
├── ⚙️ js/                        # Módulos JavaScript
│   ├── config.js               # Configuración centralizada
│   ├── eventBus.js             # Sistema de eventos
│   ├── webSocketManager.js     # Gestión WebSockets
│   ├── consultorioService.js   # API consultorios
│   ├── consultorioForm.js      # Formulario consultorios
│   ├── consultorioList.js      # Lista consultorios
│   ├── pacienteService.js      # API pacientes
│   ├── pacienteForm.js         # Formulario pacientes
│   ├── pacienteList.js         # Lista pacientes
│   ├── turnoService.js         # API turnos
│   ├── turnosPage.js           # Gestión de turnos
│   ├── historialPage.js        # Historial de pacientes
│   ├── informantePage.js       # Pantalla informante
│   ├── fragmentLoader.js       # Carga de fragmentos
│   └── router.js               # Enrutamiento SPA
├── 🖼️ assets/                    # Recursos multimedia
│   ├── notification_sound.mp3  # Sonido de notificación
│   └── slider/                 # Imágenes promocionales
│       └── promo-1.png
├── 🔧 backend_changes/           # Backend FastAPI
│   ├── main.py                 # Punto de entrada
│   ├── websocket_config.json   # Configuración WebSockets
│   └── app/                    # Aplicación principal
│       ├── __init__.py
│       ├── database.py         # Configuración BD
│       ├── models.py           # Modelos de datos
│       ├── websocket.py        # Manager WebSockets
│       └── routers/           # Endpoints API
│           ├── consultorios.py # API consultorios
│           ├── pacientes.py    # API pacientes
│           └── websockets.py   # Endpoints WebSocket
├── 📄 favicon.ico               # Icono del sitio
├── 📋 CAMBIOS_LABORATORIO.md    # Documentación cambios
└── 📖 README.md                # Esta documentación
```

---

## ⚙️ Configuración e Instalación

### Requisitos Previos

- **Python 3.12+**
- **Node.js** (opcional, para desarrollo)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

### Instalación del Backend

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd cem-turnero-legacy
```

2. **Crear entorno virtual**

```bash
cd backend_changes
python -m venv venv
```

3. **Activar entorno virtual**

```bash
# Windows
venv\\Scripts\\activate

# Linux/Mac
source venv/bin/activate
```

4. **Instalar dependencias**

```bash
pip install fastapi uvicorn sqlmodel sqlite3 gtts asyncio
```

5. **Ejecutar servidor**

```bash
python main.py
```

### Configuración del Frontend

1. **Editar configuración**

```javascript
// js/config.js
const CONFIG = {
  SERVER: {
    HOST: '192.168.1.12', // IP del servidor backend
    PORT: 8000, // Puerto del backend
  },
  // ...
};
```

2. **Iniciar servidor web** (desde directorio raíz)

```bash
# Python
python -m http.server 8080

# Node.js (si está instalado)
npx serve .
```

3. **Acceder a la aplicación**

```
http://localhost:8080
```

### Variables de Configuración

| Variable                      | Descripción                     | Valor por Defecto |
| ----------------------------- | ------------------------------- | ----------------- |
| `CONFIG.SERVER.HOST`          | IP del servidor backend         | `192.168.1.12`    |
| `CONFIG.SERVER.PORT`          | Puerto del backend              | `8000`            |
| `CONFIG.APP.POLLING_INTERVAL` | Intervalo de actualización (ms) | `10000`           |
| `CONFIG.APP.AUDIO_DELAY`      | Retraso del audio (ms)          | `500`             |

---

## 🔧 Funcionalidades Principales

### 1. 🏥 Gestión de Consultorios

**Características:**

- Crear, editar y ocultar consultorios
- Asignar médicos responsables
- Definir ubicación (piso)
- Gestión de turnos actuales
- Reset automático diario

**Campos del Consultorio:**

- `nombre_medico`: Nombre del médico responsable
- `consultorio`: Nombre del consultorio
- `piso`: Ubicación física
- `current_turn`: Turno actual
- `is_visible`: Estado de visibilidad

### 2. 👤 Gestión de Pacientes

**Características:**

- Registro completo de pacientes
- Búsqueda por cédula con historial
- Asignación automática de turnos
- Categorización por tipo de examen
- Gestión de empresas y valores

**Campos del Paciente:**

- `primer_nombre`, `segundo_nombre`: Nombres
- `primer_apellido`, `segundo_apellido`: Apellidos
- `cedula`: Documento de identidad (único)
- `tipo_examen`: Tipo de consulta/examen
- `empresa`: Empresa o EPS
- `valor`: Costo del servicio
- `consultorio_id`: Consultorio asignado
- `turno`: Número de turno asignado
- `hora_entrada`: Timestamp de registro
- `atendido`: Estado de atención
- `en_atencion`: Paciente actualmente siendo atendido

### 3. 🔄 Gestión de Turnos

**Características:**

- Avance automático de turnos
- Marcado de pacientes como atendidos
- Visualización de pacientes en espera
- Sistema de anuncios por audio
- Notificaciones en tiempo real

**Flujo de Turnos:**

1. Paciente llega y se registra → Obtiene turno automático
2. Personal médico selecciona consultorio en módulo Turnos
3. Sistema muestra turno actual y pacientes en espera
4. Clic en "Siguiente Turno" → Marca actual como atendido, avanza al siguiente
5. Genera audio automático y notifica a todas las pantallas

### 4. 📊 Historial y Reportes

**Características:**

- Filtros por estado (Pendientes/Atendidos)
- Filtros por rango de fechas
- Búsqueda de texto libre
- Exportación a Excel con formato completo
- Visualización en tiempo real

**Datos del Reporte Excel:**

- Información completa del paciente
- Datos del consultorio y médico
- Timestamps de entrada y atención
- Estados y valores económicos

### 5. 📺 Pantalla Informante

**Características:**

- Diseño optimizado para pantallas grandes y TVs
- **Modo pantalla completa automático** al entrar en la pestaña Informante
- Slider automático de promociones
- Visualización de turnos actuales de todos los consultorios
- Reproducción automática de audio
- Actualización en tiempo real
- Resaltado del consultorio con cambios recientes

**Modo Pantalla Completa:**

- **Activación automática**: Se activa al seleccionar la pestaña "Informante"
- **Botón de toggle**: Permite alternar entre pantalla completa y modo normal
- **Teclas de acceso rápido**: F11 o Escape para alternar el modo
- **Interfaz limpia**: Oculta navbar y pestañas para máxima visibilidad
- **Optimizado para TVs**: Tipografía y espaciado mejorado para visualización a distancia

**Audio Automático:**

- Formato: "Consultorio X Turno 05 Paciente Juan Pérez"
- Generado automáticamente al avanzar turno
- Reproducción sincronizada en múltiples dispositivos
- Soporte para texto-a-voz en español

---

## 🌐 API y Endpoints

### Base URL

```
http://192.168.1.12:8000
```

### Endpoints de Consultorios

| Método  | Endpoint                          | Descripción                   |
| ------- | --------------------------------- | ----------------------------- |
| `GET`   | `/consultorios`                   | Listar todos los consultorios |
| `POST`  | `/consultorios`                   | Crear nuevo consultorio       |
| `GET`   | `/consultorios/{id}`              | Obtener consultorio por ID    |
| `PATCH` | `/consultorios/{id}`              | Actualizar consultorio        |
| `PATCH` | `/consultorios/{id}/hide`         | Ocultar consultorio           |
| `GET`   | `/consultorios/{id}/current`      | Obtener turno actual          |
| `PATCH` | `/consultorios/{id}/next`         | Avanzar al siguiente turno    |
| `PATCH` | `/consultorios/{id}/reset`        | Reiniciar turnos              |
| `POST`  | `/consultorios/{id}/replay`       | Repetir anuncio de audio      |
| `GET`   | `/consultorios/{id}/audio`        | Descargar archivo de audio    |
| `GET`   | `/consultorios/turnos/detallados` | Turnos con datos de pacientes |

### Endpoints de Pacientes

| Método  | Endpoint                     | Descripción                  |
| ------- | ---------------------------- | ---------------------------- |
| `GET`   | `/pacientes`                 | Listar pacientes con filtros |
| `POST`  | `/pacientes`                 | Registrar nuevo paciente     |
| `GET`   | `/pacientes/{id}`            | Obtener paciente por ID      |
| `PATCH` | `/pacientes/{id}`            | Actualizar paciente          |
| `PATCH` | `/pacientes/{id}/hide`       | Ocultar paciente             |
| `GET`   | `/pacientes/cedula/{cedula}` | Buscar por cédula            |
| `GET`   | `/pacientes/excel`           | Exportar a Excel             |
| `GET`   | `/pacientes/count`           | Contar pacientes             |

### Parámetros de Consulta Comunes

| Parámetro        | Tipo   | Descripción                     |
| ---------------- | ------ | ------------------------------- |
| `skip`           | `int`  | Saltar N registros (paginación) |
| `limit`          | `int`  | Limitar a N registros           |
| `is_visible`     | `bool` | Filtrar por visibilidad         |
| `atendido`       | `bool` | Filtrar por estado de atención  |
| `consultorio_id` | `int`  | Filtrar por consultorio         |

### Respuestas de la API

**Formato de Éxito:**

```json
{
  "id": 1,
  "nombre_medico": "Dr. Julio Contreras",
  "consultorio": "Consultorio 1",
  "current_turn": 5
}
```

**Formato de Error:**

```json
{
  "detail": "Consultorio no encontrado"
}
```

---

## 🔄 WebSockets y Tiempo Real

### Configuración de Salas

El sistema utiliza WebSockets para comunicación en tiempo real entre todas las pantallas. Las salas están configuradas en `websocket_config.json`:

```json
{
  "websocket_rooms": {
    "notifications": {
      "id": "notifications",
      "name": "Notificaciones Generales",
      "type": "system",
      "generates_audio": false
    },
    "1": {
      "id": "1",
      "name": "Consultorio 1",
      "type": "consultorio",
      "audio_name": "Consultorio 1",
      "generates_audio": true
    }
    // ... más consultorios
  }
}
```

### Tipos de Mensajes WebSocket

#### 1. Nuevo Paciente

```json
{
  "action": "new_patient",
  "patient": {
    "id": 123,
    "turno": 5,
    "turno_label": "Consultorio 1-05",
    "nombre": "Juan Pérez"
  }
}
```

#### 2. Cambio de Turno

```json
{
  "action": "turn_changed",
  "consultorio_id": 1,
  "current_turn": 6,
  "turn_label": "Consultorio 1-06",
  "previous_patient": {...},
  "next_patient": {...}
}
```

#### 3. Audio Listo

```json
{
  "action": "audio_ready",
  "consultorio_id": 1,
  "turn": 6,
  "audio_url": "/consultorios/1/audio"
}
```

#### 4. Repetir Audio

```json
{
  "action": "replay",
  "consultorio_id": 1,
  "turn": 6,
  "audio_url": "/consultorios/1/audio"
}
```

### Gestión de Conexiones

- **Límite por IP**: 15 conexiones simultáneas
- **Heartbeat**: Cada 30 segundos
- **Limpieza automática**: Cada 5 minutos
- **Reconexión automática**: Hasta 5 intentos

### Salas Activas

| Sala            | Propósito                           | Genera Audio |
| --------------- | ----------------------------------- | ------------ |
| `notifications` | Mensajes generales del sistema      | No           |
| `1`             | Consultorio 1 (Dr. Julio Contreras) | Sí           |
| `2`             | Consultorio 2 (Dr. Miguel Salas)    | Sí           |
| `3`             | Consultorio 3 (Dra. Carolina Velez) | Sí           |
| `4`             | Laboratorio (Dr. Andrés Rivera)     | Sí           |

---

## ⚡ Frontend - Módulos JavaScript

### Arquitectura Modular

El frontend está organizado en módulos especializados para facilitar el mantenimiento y escalabilidad:

### 1. 📋 Configuración (`config.js`)

**Propósito:** Centralizar todas las configuraciones del sistema

**Características:**

- URLs del servidor y API endpoints
- Intervalos de tiempo y límites
- Configuración del slider promocional
- Helper functions para construir URLs

**Ejemplo de uso:**

```javascript
// Obtener URL para listar pacientes
const url = API_URLS.getPacientes();

// Configurar intervalo de polling
setInterval(updateData, CONFIG.APP.POLLING_INTERVAL);
```

### 2. 🚌 Event Bus (`eventBus.js`)

**Propósito:** Sistema de comunicación entre módulos

**Características:**

- Patrón Pub/Sub para desacoplar módulos
- Eventos tipados para diferentes acciones
- Gestión automática de listeners

**Eventos Principales:**

- `refresh-consultorios`: Actualizar lista de consultorios
- `refresh-pacientes`: Actualizar lista de pacientes
- `refresh-turnos`: Actualizar estado de turnos
- `refresh-historial`: Actualizar historial
- `tab-changed`: Cambio de pestaña activa

**Ejemplo de uso:**

```javascript
// Emitir evento
eventBus.emit('refresh-pacientes');

// Escuchar evento
eventBus.on('refresh-pacientes', () => {
  loadPatientsList();
});
```

### 3. 🌐 WebSocket Manager (`webSocketManager.js`)

**Propósito:** Gestión centralizada de conexiones WebSocket

**Características:**

- Conexiones múltiples a diferentes salas
- Reconexión automática en caso de fallo
- Sistema de estadísticas y monitoreo
- Rate limiting y gestión de errores

**API Principal:**

```javascript
// Conectar a sala
wsManager.connect('1', messageHandler, errorHandler);

// Enviar mensaje
wsManager.send('1', { action: 'test', data: 'hello' });

// Desconectar
wsManager.disconnect('1');

// Obtener estadísticas
const stats = wsManager.getStats();
```

### 4. 🏥 Módulos de Consultorios

#### `consultorioService.js`

- Wrapper para API REST de consultorios
- Funciones async/await para todas las operaciones
- Manejo de errores centralizados

#### `consultorioForm.js`

- Gestión del formulario de consultorios
- Validación de campos
- Modo edición/creación

#### `consultorioList.js`

- Renderizado de tabla de consultorios
- Filtros y búsqueda
- Acciones de editar/ocultar

### 5. 👤 Módulos de Pacientes

#### `pacienteService.js`

- API wrapper para operaciones de pacientes
- Búsqueda por cédula con historial
- Construcción de nombres completos

#### `pacienteForm.js`

- Formulario avanzado con validaciones
- Búsqueda en tiempo real por cédula
- Carga dinámica de consultorios

#### `pacienteList.js`

- Tabla paginada de pacientes
- Filtros múltiples
- Acciones contextuales

### 6. 🔄 Módulos de Turnos

#### `turnoService.js`

- API para gestión de turnos
- Obtener pacientes en espera
- Avanzar turnos y estados

#### `turnosPage.js`

- Interfaz principal de gestión de turnos
- Selección de consultorio
- Botones de siguiente turno y replay
- Integración completa con WebSockets
- Notificaciones visuales y de audio

### 7. 📊 Historial (`historialPage.js`)

**Características:**

- Filtros por estado y fechas
- Búsqueda de texto libre
- Exportación a Excel
- Actualización en tiempo real

### 8. 📺 Informante (`informantePage.js`)

**Características:**

- Diseño optimizado para pantallas grandes
- Conexión a múltiples salas WebSocket
- Reproducción automática de audio
- Slider de promociones
- Detección de cambios de turno con efectos visuales

**Audio Engine:**

```javascript
async function playAudio(consultorioId) {
  const audioUrl = API_URLS.getAudio(consultorioId);
  const audio = new Audio(audioUrl);
  await audio.play();
}
```

### 9. 🧩 Sistema de Fragmentos

#### `fragmentLoader.js`

- Carga dinámica de contenido HTML
- Sistema de caché para mejor rendimiento
- Manejo de errores y estados de carga

#### `router.js`

- Enrutamiento SPA (Single Page App)
- Gestión de pestañas
- Historia del navegador
- Integración con fragment loader

---

## 🎨 Estilos CSS Modulares

### Filosofía de Diseño

El sistema CSS está dividido en módulos especializados para mejorar la mantenibilidad y permitir desarrollo paralelo.

### Estructura de Archivos

```
css/
├── common.css        # 🎨 Base: variables, reset, componentes compartidos
├── consultorios.css  # 🏥 Estilos específicos de consultorios
├── pacientes.css     # 👤 Estilos específicos de pacientes
├── turnos.css        # 🔄 Estilos específicos de turnos
├── historial.css     # 📊 Estilos específicos de historial
├── informante.css    # 📺 Estilos específicos del informante
└── README.md         # 📖 Documentación CSS
```

### Variables CSS Principales

```css
:root {
  --primary: #3b82f6; /* Azul principal */
  --primary-foreground: #ffffff; /* Texto en elementos primarios */
  --background: #ffffff; /* Fondo principal */
  --foreground: #111827; /* Texto principal */
  --card: #ffffff; /* Fondo de tarjetas */
  --border: #e5e7eb; /* Bordes */
  --input: #f9fafb; /* Fondo de inputs */
  --muted: #6b7280; /* Texto secundario */
  --destructive: #ef4444; /* Rojo para errores */
  --radius: 0.5rem; /* Radio de bordes */
}
```

### Componentes Principales

#### 1. Sistema de Pestañas

```css
.tab-bar {
  display: flex;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.tab.active {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
}
```

#### 2. Formularios

```css
input,
select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--input);
}

input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--ring);
}
```

#### 3. Botones

```css
button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}

button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
```

#### 4. Chips de Estado

```css
.chip {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.chip.atendido {
  background: #22c55e;
  color: #fff;
}
.chip.pendiente {
  background: #f97316;
  color: #fff;
}
.chip.en-atencion {
  background: #3b82f6;
  color: #fff;
}
```

### Estilos Específicos por Módulo

#### Turnos (`turnos.css`)

- **Turno actual**: Diseño centrado con número grande y prominente
- **Botones de acción**: Gradientes y efectos hover
- **Panel de espera**: Tabla con información clara

#### Informante (`informante.css`)

- **Layout horizontal**: Optimizado para pantallas grandes
- **Tarjetas de turno**: Resaltado visual para cambios recientes
- **Tipografía grande**: Legible desde distancia

#### Historial (`historial.css`)

- **Botón de exportación**: Estilo distintivo con gradiente verde
- **Filtros**: Layout organizado para múltiples controles

### Responsive Design

```css
@media (max-width: 768px) {
  .tab-bar {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🗄️ Base de Datos

### Motor y Configuración

- **Motor**: SQLite
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Archivo**: `database.db` (creado automáticamente)

### Modelos de Datos

#### Consultorio

```python
class Consultorio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_medico: str = Field(max_length=100)
    consultorio: str = Field(max_length=50)
    piso: str = Field(max_length=20)
    is_visible: bool = Field(default=True)
    current_turn: int = Field(default=0)
    last_reset_date: Optional[date] = Field(default_factory=date.today)
```

**Descripción de Campos:**

- `id`: Identificador único (auto-incremental)
- `nombre_medico`: Nombre del médico responsable
- `consultorio`: Nombre/número del consultorio
- `piso`: Ubicación física
- `is_visible`: Control de visibilidad (soft delete)
- `current_turn`: Turno actual del consultorio
- `last_reset_date`: Fecha del último reset de turnos

#### EntradaPaciente

```python
class EntradaPaciente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    primer_nombre: str = Field(max_length=50)
    segundo_nombre: Optional[str] = Field(default=None, max_length=50)
    primer_apellido: str = Field(max_length=50)
    segundo_apellido: Optional[str] = Field(default=None, max_length=50)
    cedula: str = Field(max_length=20, index=True)
    tipo_examen: str = Field(max_length=100)
    empresa: Optional[str] = Field(default="Particular", max_length=100)
    valor: int = Field(ge=0)
    consultorio_id: int = Field(foreign_key="consultorio.id")
    turno: int = Field(ge=1)
    hora_entrada: datetime = Field(default_factory=datetime.now)
    atendido: bool = Field(default=False)
    en_atencion: bool = Field(default=False)
    is_visible: bool = Field(default=True)
```

**Propiedades Calculadas:**

```python
@property
def turno_label(self) -> str:
    return f"Consultorio {self.consultorio_id}-{self.turno:02d}"

@property
def nombre_completo(self) -> str:
    # Construye nombre completo desde los 4 campos
    return " ".join(filter(None, [
        self.primer_nombre,
        self.segundo_nombre,
        self.primer_apellido,
        self.segundo_apellido
    ]))
```

### Índices y Optimizaciones

```sql
-- Índices automáticos
CREATE INDEX ix_entradapaciente_cedula ON entradapaciente (cedula);
CREATE INDEX ix_entradapaciente_consultorio_id ON entradapaciente (consultorio_id);
CREATE INDEX ix_entradapaciente_hora_entrada ON entradapaciente (hora_entrada);

-- Índices compuestos para consultas frecuentes
CREATE INDEX ix_consultorio_turnos ON entradapaciente (consultorio_id, turno, atendido);
CREATE INDEX ix_visible_atendido ON entradapaciente (is_visible, atendido);
```

### Consultas Comunes

#### Obtener pacientes en espera

```sql
SELECT * FROM entradapaciente
WHERE consultorio_id = ?
  AND is_visible = true
  AND atendido = false
  AND turno > ?
ORDER BY turno ASC;
```

#### Buscar historial por cédula

```sql
SELECT * FROM entradapaciente
WHERE cedula = ?
  AND is_visible = true
ORDER BY hora_entrada DESC;
```

#### Paciente en atención actual

```sql
SELECT * FROM entradapaciente
WHERE consultorio_id = ?
  AND en_atencion = true
  AND is_visible = true
LIMIT 1;
```

### Migración y Backup

#### Reset Diario Automático

El sistema incluye lógica para resetear turnos automáticamente cada día:

```python
def verificar_reset_diario(consultorio: Consultorio, session):
    if consultorio.last_reset_date != date.today():
        consultorio.current_turn = 1
        consultorio.last_reset_date = date.today()
        session.add(consultorio)
        session.commit()
```

#### Backup Recomendado

```bash
# Backup diario
cp database.db "backup/database_$(date +%Y%m%d).db"

# Backup antes de actualizaciones
cp database.db "backup/database_pre_update.db"
```

---

## 📖 Guía de Uso

### Para Administradores del Sistema

#### Configuración Inicial

1. **Crear Consultorios**

   - Ir a pestaña "Consultorios"
   - Completar formulario: Médico, Consultorio, Piso
   - Guardar cada consultorio

2. **Configurar IP del Servidor**

   - Editar `js/config.js`
   - Cambiar `CONFIG.SERVER.HOST` por la IP correcta
   - Reiniciar navegador

3. **Verificar WebSockets**
   - Abrir múltiples pestañas en diferentes dispositivos
   - Comprobar sincronización en tiempo real
   - Usar herramientas de desarrollador para debug

#### Gestión Diaria

1. **Revisar Reset de Turnos**

   - Los turnos se resetean automáticamente cada día
   - Verificar que `current_turn` comience en 1

2. **Monitorear Audio**

   - Comprobar que el audio se genera correctamente
   - Verificar volumen en dispositivos informante

3. **Backup de Datos**
   - Respaldar base de datos regularmente
   - Exportar reportes Excel para registros históricos

### Para Personal Médico

#### Registro de Pacientes

1. **Acceder a "Pacientes"**

   - Completar todos los campos obligatorios
   - Usar búsqueda por cédula para verificar historial
   - Seleccionar consultorio apropiado

2. **Campos Importantes**
   - **Cédula**: Debe ser única, solo números
   - **Tipo de Examen**: Seleccionar de lista predefinida
   - **Empresa**: Particular por defecto
   - **Valor**: Costo en pesos colombianos

#### Gestión de Turnos

1. **Seleccionar Consultorio**

   - Ir a pestaña "Turnos"
   - Elegir consultorio del dropdown
   - Ver turno actual y pacientes en espera

2. **Avanzar Turnos**

   - Clic en "Siguiente Turno" cuando paciente esté listo
   - Sistema marca automáticamente como atendido
   - Audio se reproduce automáticamente en informante

3. **Repetir Anuncios**
   - Usar "Volver a Anunciar" si el paciente no escuchó
   - Audio se reproduce nuevamente en todas las pantallas

#### Consulta de Historial

1. **Filtros Disponibles**

   - **Estado**: Pendientes o Atendidos
   - **Fechas**: Rango específico
   - **Búsqueda**: Texto libre (nombre, cédula, etc.)

2. **Exportar Reportes**
   - Clic en "Descargar Excel"
   - Archivo incluye todos los datos filtrados
   - Útil para facturación y estadísticas

### Para Pacientes (Pantalla Informante)

#### Modo de Visualización

**Pantalla Completa Automática:**

- Al seleccionar "Informante", la pantalla entra automáticamente en modo pantalla completa
- Se ocultan menús y controles para máxima visibilidad
- Optimizado para TVs y pantallas grandes en salas de espera
- Personal puede usar F11 o Escape para alternar si necesario

#### Información Mostrada

1. **Turnos Actuales**

   - Cada consultorio muestra su turno actual
   - Nombre del paciente en atención
   - Destacado visual cuando hay cambios
   - Tipografía grande y legible desde distancia

2. **Audio Automático**

   - Se reproduce cuando avanza un turno
   - Formato: "Consultorio X Turno 05 Paciente Juan Pérez"
   - Volumen ajustable desde configuración del sistema
   - Reproducción sincronizada en múltiples pantallas

3. **Promociones**
   - Slider automático con información médica
   - Cambio cada 10 segundos
   - Pausado temporalmente cuando hay anuncios
   - Imágenes optimizadas para pantalla completa

---

## 🔧 Desarrollo y Mantenimiento

### Configuración del Entorno de Desarrollo

#### Editor Recomendado: VS Code

**Extensiones Útiles:**

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.live-server"
  ]
}
```

#### Configuración de Git

```bash
git config --local user.name "Desarrollador CEM"
git config --local user.email "dev@cem-narino.com"

# Ignorar archivos sensibles
echo "database.db" >> .gitignore
echo "*.log" >> .gitignore
echo "audios/" >> .gitignore
```

### Estructura de Desarrollo

#### Metodología de Commits

```bash
# Formato: tipo(scope): descripción
git commit -m "feat(turnos): agregar funcionalidad de replay de audio"
git commit -m "fix(websocket): corregir reconexión automática"
git commit -m "docs(readme): actualizar documentación de API"
git commit -m "style(css): mejorar responsive design en móviles"
```

**Tipos de Commit:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Documentación
- `style`: Cambios de estilo (CSS)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

#### Flujo de Desarrollo

1. **Branch Principal**: `main` (estable, producción)
2. **Branch de Desarrollo**: `develop` (integración)
3. **Feature Branches**: `feature/nueva-funcionalidad`
4. **Hotfix Branches**: `hotfix/correccion-critica`

```bash
# Crear nueva funcionalidad
git checkout -b feature/mejora-audio
# ... desarrollo ...
git commit -m "feat(audio): mejorar calidad de síntesis de voz"
git checkout develop
git merge feature/mejora-audio
```

### Testing y Quality Assurance

#### Tests Manuales Esenciales

1. **Flujo Completo de Paciente**

   ```
   ✅ Registrar paciente nuevo
   ✅ Verificar asignación de turno
   ✅ Avanzar turno desde gestión
   ✅ Verificar audio en informante
   ✅ Comprobar actualización en historial
   ```

2. **Conectividad WebSocket**

   ```
   ✅ Abrir múltiples pestañas
   ✅ Registrar paciente en una pestaña
   ✅ Verificar notificación en otras pestañas
   ✅ Probar reconexión tras pérdida de red
   ```

3. **Compatibilidad de Navegadores**
   ```
   ✅ Chrome (recomendado)
   ✅ Firefox
   ✅ Safari
   ✅ Edge
   ```

#### Métricas de Rendimiento

- **Tiempo de carga inicial**: < 3 segundos
- **Respuesta de API**: < 500ms promedio
- **Reconexión WebSocket**: < 5 segundos
- **Generación de audio**: < 2 segundos

### Configuración de Producción

#### Variables de Entorno

```python
# backend_changes/.env
DATABASE_URL=sqlite:///./production.db
DEBUG=False
AUDIO_QUALITY=high
MAX_AUDIO_CACHE=100
LOG_LEVEL=INFO
```

#### Configuración del Servidor Web

**nginx.conf (recomendado para producción):**

```nginx
server {
    listen 80;
    server_name turnos.cem-narino.com;

    # Frontend estático
    location / {
        root /var/www/cem-turnero;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### Deployment Script

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deployment..."

# Backup
cp database.db "backup/database_$(date +%Y%m%d_%H%M%S).db"

# Frontend
rsync -av --exclude='backend_changes' ./ /var/www/cem-turnero/

# Backend
cd backend_changes
source venv/bin/activate
pip install -r requirements.txt
systemctl restart cem-turnero-api

# Verificación
curl -f http://localhost:8000/consultorios || exit 1

echo "✅ Deployment completado exitosamente"
```

### Monitoreo y Logs

#### Logs del Backend

```python
# logging.conf
[loggers]
keys=root,uvicorn,websocket

[handlers]
keys=consoleHandler,fileHandler

[formatters]
keys=detailed

[logger_root]
level=INFO
handlers=consoleHandler,fileHandler

[handler_fileHandler]
class=FileHandler
level=INFO
formatter=detailed
args=('logs/app.log',)

[formatter_detailed]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

#### Métricas de Sistema

```bash
# Monitoreo básico
tail -f logs/app.log | grep ERROR
ps aux | grep python  # Procesos Python
netstat -tulpn | grep :8000  # Puerto del backend
```

#### Alertas Recomendadas

1. **Sistema fuera de línea** (> 5 min)
2. **Errores de base de datos** (> 5 por hora)
3. **Conexiones WebSocket fallidas** (> 10%)
4. **Espacio en disco bajo** (< 1GB)

---

## 🔍 Troubleshooting

### Problemas Comunes y Soluciones

#### 1. 🚫 WebSocket No Conecta

**Síntomas:**

- No hay actualizaciones en tiempo real
- Audio no se reproduce automáticamente
- Console muestra errores de WebSocket

**Diagnóstico:**

```javascript
// En DevTools Console
console.log(window.wsManager.getStats());
```

**Soluciones:**

1. **Verificar IP del servidor**

   ```javascript
   // En js/config.js
   HOST: '192.168.1.12',  // ¿Es la IP correcta?
   ```

2. **Comprobar firewall**

   ```bash
   # Windows
   netsh advfirewall firewall add rule name="CEM Turnero" dir=in action=allow protocol=TCP localport=8000

   # Linux
   sudo ufw allow 8000
   ```

3. **Verificar backend activo**

   ```bash
   curl http://192.168.1.12:8000/consultorios
   ```

4. **Limpiar cache del navegador**
   - Ctrl+F5 para recarga forzada
   - Limpiar cookies y localStorage

#### 2. 🔇 Audio No Se Reproduce

**Síntomas:**

- Turnos avanzan pero sin audio
- Error en consola del navegador

**Soluciones:**

1. **Verificar permisos de audio**

   ```javascript
   // DevTools Console
   navigator.mediaDevices
     .getUserMedia({ audio: true })
     .then(() => console.log('Audio permitido'))
     .catch((e) => console.log('Audio bloqueado:', e));
   ```

2. **Comprobar generación de audio**

   ```bash
   # Verificar endpoint de audio
   curl -I http://192.168.1.12:8000/consultorios/1/audio
   ```

3. **Verificar gTTS instalado**

   ```bash
   cd backend_changes
   pip install gtts
   ```

4. **Política de autoplay del navegador**
   - Chrome: chrome://settings/content/sound
   - Permitir autoplay para el sitio

#### 3. 💾 Base de Datos Corrupta

**Síntomas:**

- Errores 500 en API
- Datos inconsistentes
- Backend no inicia

**Soluciones:**

1. **Verificar integridad**

   ```bash
   sqlite3 database.db "PRAGMA integrity_check;"
   ```

2. **Restaurar desde backup**

   ```bash
   cp backup/database_20241201.db database.db
   ```

3. **Recrear base de datos**
   ```bash
   rm database.db
   # Reiniciar backend - SQLModel recreará las tablas
   ```

#### 4. 🐌 Rendimiento Lento

**Síntomas:**

- Carga lenta de páginas
- API responses lentas
- Interface no responsiva

**Soluciones:**

1. **Verificar red**

   ```bash
   ping 192.168.1.12
   speedtest-cli
   ```

2. **Optimizar base de datos**

   ```sql
   VACUUM;
   ANALYZE;
   REINDEX;
   ```

3. **Monitorear recursos**

   ```bash
   top
   df -h
   free -m
   ```

4. **Limpiar archivos temporales**
   ```bash
   rm -rf audios/  # Se regenerarán automáticamente
   ```

#### 5. 📱 Problemas de Responsive

**Síntomas:**

- Layout roto en móviles
- Botones no clickeables
- Texto muy pequeño

**Soluciones:**

1. **Verificar viewport**

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   ```

2. **Comprobar CSS**

   ```css
   @media (max-width: 768px) {
     /* Estilos móviles */
   }
   ```

3. **Testear en dispositivos**
   - Chrome DevTools > Device Mode
   - Probar diferentes resoluciones

#### 6. 🔄 Turnos No Avanzan

**Síntomas:**

- Botón "Siguiente Turno" no funciona
- Paciente no se marca como atendido
- Error en la API

**Diagnóstico:**

```bash
# Ver logs del backend
tail -f logs/app.log

# Verificar endpoint manualmente
curl -X PATCH http://192.168.1.12:8000/consultorios/1/next
```

**Soluciones:**

1. **Verificar pacientes en espera**

   ```sql
   SELECT * FROM entradapaciente
   WHERE consultorio_id = 1 AND atendido = false;
   ```

2. **Comprobar bloqueos de base de datos**

   ```sql
   PRAGMA busy_timeout = 30000;
   ```

3. **Reset manual de consultorio**
   ```bash
   curl -X PATCH http://192.168.1.12:8000/consultorios/1/reset
   ```

### Logs y Debugging

#### Habilitar Debug Frontend

```javascript
// En config.js
const CONFIG = {
  DEBUG: true, // Agregar para logs detallados
  // ...
};

// En cualquier módulo
if (CONFIG.DEBUG) {
  console.log('Debug info:', data);
}
```

#### Logs Detallados Backend

```python
# En main.py
import logging
logging.basicConfig(level=logging.DEBUG)

# En cualquier función
logger.debug(f"Procesando paciente: {paciente.id}")
logger.info(f"Turno avanzado a: {nuevo_turno}")
logger.warning(f"Conexión WebSocket perdida: {client_ip}")
logger.error(f"Error en base de datos: {str(e)}")
```

#### Herramientas de Debug Recomendadas

1. **Chrome DevTools**

   - Network tab: Verificar requests API
   - Console: Ver logs JavaScript
   - Application > WebSockets: Monitorear conexiones

2. **Postman/Insomnia**

   - Probar endpoints API manualmente
   - Verificar payloads JSON

3. **SQLite Browser**
   - Inspeccionar datos directamente
   - Ejecutar queries manuales

---

## 🆕 Changelog

### Version 2.1.0 (Septiembre 2025)

#### 🎉 Nuevas Funcionalidades

- **✅ Soporte para Laboratorio (Consultorio 4)**

  - Agregado Dr. Andrés Rivera - Laboratorio en Piso 1
  - WebSocket room "4" configurada con generación de audio
  - Frontend actualizado para soportar consultorios 1-4

- **🔄 Funcionalidad "Terminar Jornada"**

  - Nuevo botón en la página de Turnos para cerrar/abrir la atención del consultorio
  - Confirmación con alert antes de cerrar la jornada
  - Manejo del último paciente en atención al cerrar
  - Estados visuales para consultorios con jornada terminada
  - Endpoints backend: `/consultorios/{id}/cerrar-lista` y `/consultorios/{id}/abrir-lista`

- **🖥️ Modo Pantalla Completa para Informante**

  - Activación automática al entrar en la pestaña Informante
  - Oculta navbar y pestañas para máxima visibilidad en TVs
  - Botón de toggle para alternar entre modo normal y pantalla completa
  - Teclas de acceso rápido: F11 y Escape
  - Estilos optimizados para pantallas grandes y salas de espera
  - Tipografía y espaciado mejorado para visualización a distancia

- **📊 Exportación a Excel Mejorada**

  - Nuevo endpoint `/pacientes/excel` con StreamingResponse
  - Formato Excel completo con todos los campos
  - Filtros por estado y fechas aplicados en exportación

- **🎨 Sistema CSS Modular**
  - Dividido `base.css` en 6 módulos especializados
  - `common.css`: Estilos compartidos base
  - Módulos específicos por sección (consultorios, pacientes, turnos, historial, informante)
  - Mejor mantenibilidad y desarrollo paralelo

#### 🔧 Mejoras Técnicas

- **⚡ WebSocket Manager Optimizado**

  - Sistema de estadísticas y monitoreo
  - Reconexión automática mejorada
  - Límite de conexiones por IP (15 conexiones)
  - Heartbeat cada 30 segundos y limpieza automática

- **🌐 Configuración Centralizada**

  - `config.js` unificado con todas las URLs y configuraciones
  - Helper functions para construcción de URLs
  - Fácil cambio de IP del servidor en un solo lugar

- **🔄 Sistema de Fragmentos HTML**
  - `fragmentLoader.js` para carga dinámica de contenido
  - Sistema de caché para mejor rendimiento
  - Indicadores de carga y manejo de errores

#### 🐛 Correcciones de Bugs

- **🔊 Audio del Laboratorio**

  - Corregido hardcoding de consultorios 1-3 en frontend
  - Laboratorio ahora genera y reproduce audio correctamente
  - Notificaciones WebSocket funcionan para consultorio 4

- **🎵 Informante Audio Engine**

  - Mejorado sistema de reproducción de audio
  - Prevención de reproducciones múltiples simultáneas
  - Mejor manejo de errores de audio

- **📱 Validación de Botones**
  - "Siguiente Turno" se deshabilita cuando no hay pacientes en espera
  - Validaciones mejoradas antes de avanzar turnos
  - Mejor feedback visual del estado del sistema

#### 📚 Documentación

- **📖 Documentación Completa**

  - README.md exhaustivo con todas las secciones
  - Guías de instalación, configuración y uso
  - API reference completa
  - Troubleshooting detallado

- **🎨 Documentación CSS**
  - `css/README.md` explicando estructura modular
  - Ejemplos de uso y mejores prácticas
  - Guía de migración desde CSS monolítico

#### 🔒 Seguridad y Configuración

- **🔧 WebSocket Configuration**

  - `websocket_config.json` externalized configuration
  - Configuración granular por sala
  - Settings para timeouts y límites

- **🏥 Base de Datos**
  - Nuevos registros para el consultorio Laboratorio
  - Índices optimizados para consultas frecuentes
  - Reset diario automático mejorado

### Version 2.0.0 (Julio 2025)

#### 🎉 Funcionalidades Principales Implementadas

- **🏥 Gestión Completa de Consultorios**

  - CRUD completo con formularios validados
  - Sistema de visibilidad (soft delete)
  - Turnos automáticos con reset diario

- **👤 Gestión Avanzada de Pacientes**

  - Formulario completo con 4 campos de nombre
  - Búsqueda por cédula con historial
  - Asignación automática de turnos

- **🔄 Sistema de Turnos en Tiempo Real**

  - Avance automático de turnos
  - Gestión de estados (pendiente/en atención/atendido)
  - Notificaciones WebSocket sincronizadas

- **🎵 Sistema de Audio Automático**

  - Generación TTS con gTTS
  - Formato: "Consultorio X Turno Y Paciente Nombre"
  - Reproducción automática en pantallas informante

- **📺 Pantalla Informante**

  - Diseño optimizado para TV/pantallas grandes
  - Slider promocional automático
  - Turnos actuales de todos los consultorios
  - Audio sincronizado

- **📊 Historial y Reportes**
  - Filtros por estado, fechas y búsqueda libre
  - Exportación a Excel completa
  - Actualización en tiempo real

#### 🏗️ Arquitectura Base

- **Frontend SPA**

  - Sistema de pestañas sin recarga de página
  - Módulos JavaScript especializados
  - CSS responsive con variables

- **Backend FastAPI**

  - API REST completa
  - WebSocket para tiempo real
  - SQLModel ORM

- **Base de Datos SQLite**
  - Modelos Consultorio y EntradaPaciente
  - Índices optimizados
  - Migrations automáticas

---

## 📞 Soporte y Contacto

### Información del Proyecto

- **Nombre:** Sistema de Gestión de Turnos Médicos CEM Nariño
- **Versión:** 2.1.0
- **Última Actualización:** Septiembre 2025
- **Licencia:** Propietario CEM Nariño

### Soporte Técnico

**Para Problemas Urgentes:**

- Sistema no funciona: Verificar conectividad y estado del servidor
- Audio no reproduce: Comprobar permisos del navegador
- Datos inconsistentes: Contactar administrador del sistema

**Para Nuevas Funcionalidades:**

- Solicitudes de cambios a través del administrador
- Evaluación de impacto técnico requerida
- Timeline de desarrollo según prioridad

### Mantenimiento

**Rutinas Recomendadas:**

- **Diario**: Verificar funcionamiento general y audio
- **Semanal**: Backup de base de datos y limpieza de logs
- **Mensual**: Actualización de dependencias y revisión de seguridad
- **Trimestral**: Análisis de rendimiento y optimizaciones

### Recursos Adicionales

- **Código Fuente**: Git repository interno
- **Documentación Técnica**: Este archivo README.md
- **Logs del Sistema**: `backend_changes/logs/`
- **Backups**: `backup/` directory

---

## 📋 Apéndices

### A. Configuración de Red

#### Puertos Utilizados

- **8000**: Backend FastAPI (HTTP + WebSocket)
- **8080**: Frontend HTTP Server (desarrollo)
- **80/443**: Nginx proxy (producción)

#### Firewall Rules

```bash
# Windows
netsh advfirewall firewall add rule name="CEM Backend" dir=in action=allow protocol=TCP localport=8000

# Linux (ufw)
sudo ufw allow 8000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### B. Comandos Útiles

#### Backend Management

```bash
# Iniciar servidor desarrollo
cd backend_changes && python main.py

# Backup base de datos
cp database.db backup/database_$(date +%Y%m%d).db

# Ver logs en tiempo real
tail -f logs/app.log
```

#### Frontend Development

```bash
# Servidor local
python -m http.server 8080

# Verificar conectividad
curl http://192.168.1.12:8000/consultorios
```

### C. Estructura de Archivos Audio

```
audios/
├── turno_audio.mp3         # Audio temporal generado
└── cache/                  # Cache futuro (no implementado)
    ├── consultorio_1/
    ├── consultorio_2/
    ├── consultorio_3/
    └── laboratorio/
```

### D. Códigos de Estado HTTP

| Código | Descripción      | Uso en el Sistema             |
| ------ | ---------------- | ----------------------------- |
| 200    | OK               | Operación exitosa             |
| 201    | Created          | Paciente/Consultorio creado   |
| 400    | Bad Request      | Datos inválidos en formulario |
| 404    | Not Found        | Recurso no encontrado         |
| 422    | Validation Error | Error de validación SQLModel  |
| 500    | Internal Error   | Error del servidor            |

---

**📝 Fin de la Documentación**

_Este documento es mantenido por el equipo de desarrollo del Sistema de Gestión de Turnos CEM Nariño. Para sugerencias o correcciones, contactar al administrador del sistema._

---

_Última actualización: 8 de septiembre de 2025_
