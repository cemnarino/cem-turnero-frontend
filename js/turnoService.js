// js/turnoService.js

window.turnoService = {
  // Obtener turno actual
  getCurrentTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/current`).then((r) =>
      r.json()
    ),

  // Avanzar turno
  nextTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/next`, {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Reiniciar turno
  resetTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/reset`, {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Pacientes en espera (no atendidos, turno != actual) - MEJORADO
  getPacientesEnEspera: (id) =>
    fetch(
      `http://192.168.1.5:8000/pacientes/?consultorio_id=${id}&atendido=false&is_visible=true&limit=50`
    ).then((r) => r.json()),

  // Nuevo: Obtener pacientes con paginación y filtros avanzados
  getPacientesConFiltros: (filtros = {}) => {
    const params = new URLSearchParams();

    // Parámetros de paginación
    if (filtros.skip) params.append('skip', filtros.skip);
    if (filtros.limit) params.append('limit', filtros.limit);

    // Filtros de estado
    if (filtros.is_visible !== undefined)
      params.append('is_visible', filtros.is_visible);
    if (filtros.atendido !== undefined)
      params.append('atendido', filtros.atendido);
    if (filtros.consultorio_id)
      params.append('consultorio_id', filtros.consultorio_id);

    return fetch(
      `http://192.168.1.5:8000/pacientes/?${params.toString()}`
    ).then((r) => r.json());
  },

  // Nuevo: Buscar pacientes con criterios avanzados
  buscarPacientes: (criterios = {}) => {
    const params = new URLSearchParams();

    // Criterios de búsqueda
    if (criterios.texto) params.append('texto', criterios.texto);
    if (criterios.cedula) params.append('cedula', criterios.cedula);
    if (criterios.consultorio_id)
      params.append('consultorio_id', criterios.consultorio_id);
    if (criterios.fecha_inicio)
      params.append('fecha_inicio', criterios.fecha_inicio);
    if (criterios.fecha_fin) params.append('fecha_fin', criterios.fecha_fin);
    if (criterios.atendido !== undefined)
      params.append('atendido', criterios.atendido);
    if (criterios.en_atencion !== undefined)
      params.append('en_atencion', criterios.en_atencion);
    if (criterios.is_visible !== undefined)
      params.append('is_visible', criterios.is_visible);

    // Paginación
    if (criterios.page) params.append('page', criterios.page);
    if (criterios.per_page) params.append('per_page', criterios.per_page);

    return fetch(
      `http://192.168.1.5:8000/pacientes/buscar?${params.toString()}`
    ).then((r) => r.json());
  },

  // Nuevo: Contar pacientes según filtros
  contarPacientes: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.is_visible !== undefined)
      params.append('is_visible', filtros.is_visible);
    if (filtros.atendido !== undefined)
      params.append('atendido', filtros.atendido);
    if (filtros.consultorio_id)
      params.append('consultorio_id', filtros.consultorio_id);

    return fetch(
      `http://192.168.1.5:8000/pacientes/count?${params.toString()}`
    ).then((r) => r.json());
  },
};
