// js/config.js

/**
 * Configuración centralizada de la aplicación
 */
const CONFIG = {
  // Configuración del servidor backend
  SERVER: {
    // IP y puerto del servidor FastAPI
    HOST: '192.168.1.8',
    PORT: 8000,

    // URLs base para HTTP y WebSocket
    get HTTP_BASE_URL() {
      return `http://${this.HOST}:${this.PORT}`;
    },

    get WS_BASE_URL() {
      return `ws://${this.HOST}:${this.PORT}/ws`;
    },
  },

  // Configuración de endpoints de la API
  API: {
    // Endpoints de pacientes
    PACIENTES: {
      LIST: '/pacientes',
      BY_ID: (id) => `/pacientes/${id}`,
      CREATE: '/pacientes',
      UPDATE: (id) => `/pacientes/${id}`,
      HIDE: (id) => `/pacientes/${id}/hide`,
      DELETE: (id) => `/pacientes/${id}`,
      PAGINATED: '/pacientes/paginado',
      SEARCH: '/pacientes/buscar',
      BY_CEDULA: (cedula) => `/pacientes/cedula/${encodeURIComponent(cedula)}`,
      EXCEL: '/pacientes/excel',
      COUNT: '/pacientes/count',
    },

    // Endpoints de consultorios
    CONSULTORIOS: {
      LIST: '/consultorios',
      BY_ID: (id) => `/consultorios/${id}`,
      CREATE: '/consultorios',
      UPDATE: (id) => `/consultorios/${id}`,
      HIDE: (id) => `/consultorios/${id}/hide`,
      CURRENT: (id) => `/consultorios/${id}/current`,
      NEXT: (id) => `/consultorios/${id}/next`,
      RESET: (id) => `/consultorios/${id}/reset`,
      REPLAY: (id) => `/consultorios/${id}/replay`,
      AUDIO: (id) => `/consultorios/${id}/audio`,
      TURNOS_DETALLADOS: '/consultorios/turnos/detallados',
    },
  },

  // Configuración de la aplicación
  APP: {
    // Intervalos de tiempo (en millisegundos)
    POLLING_INTERVAL: 10000,
    AUDIO_DELAY: 500,
    NOTIFICATION_DURATION: 3000,

    // Límites de paginación
    DEFAULT_PAGE_SIZE: 10,
    MAX_PATIENTS_PER_CONSULTORIO: 50,

    // Configuración del slider de promociones
    SLIDER: {
      AUTO_ADVANCE_INTERVAL: 10000, // 10 segundos
      MANUAL_RESTART_DELAY: 3000, // 3 segundos después de interacción manual
      TOTAL_SLIDES: 4,
    },
  },
};

/**
 * Funciones helper para construir URLs completas
 */
const API_URLS = {
  // Pacientes
  getPacientes: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.LIST}`,
  getPacienteById: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.BY_ID(id)}`,
  createPaciente: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.CREATE}`,
  updatePaciente: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.UPDATE(id)}`,
  hidePaciente: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.HIDE(id)}`,
  deletePaciente: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.DELETE(id)}`,
  getPacientesPaginado: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.PAGINATED}`,
  searchPacientes: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.SEARCH}`,
  getPacienteByCedula: (cedula) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.BY_CEDULA(cedula)}`,
  exportPacientesExcel: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.EXCEL}`,
  countPacientes: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.PACIENTES.COUNT}`,

  // Consultorios
  getConsultorios: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.LIST}`,
  getConsultorioById: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.BY_ID(id)}`,
  createConsultorio: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.CREATE}`,
  updateConsultorio: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.UPDATE(id)}`,
  hideConsultorio: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.HIDE(id)}`,
  getCurrentTurno: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.CURRENT(id)}`,
  nextTurno: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.NEXT(id)}`,
  resetTurno: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.RESET(id)}`,
  replayTurno: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.REPLAY(id)}`,
  getAudio: (id) =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.AUDIO(id)}`,
  getTurnosDetallados: () =>
    `${CONFIG.SERVER.HTTP_BASE_URL}${CONFIG.API.CONSULTORIOS.TURNOS_DETALLADOS}`,

  // WebSocket
  getWebSocketUrl: () => CONFIG.SERVER.WS_BASE_URL,
};

// Exportar la configuración para uso global
window.CONFIG = CONFIG;
window.API_URLS = API_URLS;

console.log('📋 Configuración cargada:', {
  servidor: `${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`,
  http: CONFIG.SERVER.HTTP_BASE_URL,
  websocket: CONFIG.SERVER.WS_BASE_URL,
});
