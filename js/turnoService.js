// js/turnoService.js

window.turnoService = {
  // Obtener turno actual
  getCurrentTurn: (id) =>
    fetch(API_URLS.getCurrentTurno(id)).then((r) => r.json()),

  // Avanzar turno
  nextTurn: (id) =>
    fetch(API_URLS.nextTurno(id), {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Reiniciar turno
  resetTurn: (id) =>
    fetch(API_URLS.resetTurno(id), {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Pacientes en espera (no atendidos, turno != actual) - MEJORADO
  getPacientesEnEspera: (id) => {
    const params = new URLSearchParams({
      atendido: false,
      is_visible: true,
      limit: CONFIG.APP.MAX_PATIENTS_PER_CONSULTORIO,
    });
    
    // Solo agregar consultorio_id si es válido
    if (id !== null && id !== undefined && id !== '') {
      params.append('consultorio_id', id);
    }
    
    return fetch(`${API_URLS.getPacientes()}?${params.toString()}`).then((r) =>
      r.json()
    );
  },

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
    if (filtros.consultorio_id !== null && filtros.consultorio_id !== undefined && filtros.consultorio_id !== '')
      params.append('consultorio_id', filtros.consultorio_id);

    return fetch(`${API_URLS.getPacientes()}?${params.toString()}`).then((r) =>
      r.json()
    );
  },

  // Nuevo: Buscar pacientes con criterios avanzados
  buscarPacientes: (criterios = {}) => {
    const params = new URLSearchParams();

    // Criterios de búsqueda
    if (criterios.texto) params.append('texto', criterios.texto);
    if (criterios.cedula) params.append('cedula', criterios.cedula);
    if (criterios.consultorio_id !== null && criterios.consultorio_id !== undefined && criterios.consultorio_id !== '')
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

    return fetch(`${API_URLS.searchPacientes()}?${params.toString()}`).then(
      (r) => r.json()
    );
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

    return fetch(`${API_URLS.countPacientes()}?${params.toString()}`).then(
      (r) => r.json()
    );
  },

  // Nuevo: Obtener paciente en atención para un consultorio
  getPacienteEnAtencion: (consultorioId) =>
    turnoService
      .getPacientesConFiltros({
        consultorio_id: consultorioId,
        en_atencion: true,
        is_visible: true,
        limit: 1,
      })
      .then((pacientes) => (pacientes.length > 0 ? pacientes[0] : null)),

  // Alternativa: Buscar paciente en atención directamente
  getPacienteEnAtencionDirecto: async (consultorioId) => {
    try {
      console.log(
        `🔍 Búsqueda directa de paciente en atención para consultorio ${consultorioId}`
      );
      const params = new URLSearchParams({
        consultorio_id: consultorioId,
        is_visible: true,
        limit: CONFIG.APP.MAX_PATIENTS_PER_CONSULTORIO,
      });
      const url = `${API_URLS.getPacientes()}?${params.toString()}`;
      console.log(`📡 URL de consulta: ${url}`);

      const response = await fetch(url);
      const todosPacientes = await response.json();

      console.log(`📊 Total pacientes obtenidos: ${todosPacientes.length}`);
      todosPacientes.forEach((p, index) => {
        console.log(
          `   ${index + 1}. ${p.primer_nombre} ${p.primer_apellido} (Turno: ${
            p.turno
          }, en_atencion: ${p.en_atencion}, atendido: ${p.atendido})`
        );
      });

      // Buscar manualmente el que tiene en_atencion = true
      const pacienteEnAtencion = todosPacientes.find(
        (p) => p.en_atencion === true
      );

      if (pacienteEnAtencion) {
        console.log(
          `✅ Encontrado paciente con en_atencion=true:`,
          pacienteEnAtencion
        );
        console.log(
          `   - Nombre: ${pacienteEnAtencion.primer_nombre} ${pacienteEnAtencion.primer_apellido}`
        );
        console.log(`   - Turno: ${pacienteEnAtencion.turno}`);
        console.log(`   - en_atencion: ${pacienteEnAtencion.en_atencion}`);
      } else {
        console.log(`❌ No se encontró ningún paciente con en_atencion=true`);
        console.log(`🔍 Listado completo de pacientes y sus estados:`);
        todosPacientes.forEach((p) => {
          console.log(
            `     ${p.primer_nombre} ${p.primer_apellido} - Turno: ${p.turno} - en_atencion: ${p.en_atencion} - atendido: ${p.atendido}`
          );
        });
      }

      return pacienteEnAtencion || null;
    } catch (error) {
      console.error('❌ Error en getPacienteEnAtencionDirecto:', error);
      return null;
    }
  },

  // Nuevo: Volver a anunciar
  volverAnunciar: (id) =>
    fetch(API_URLS.replayTurno(id), {
      method: 'POST',
    }).then((r) => r.json()),

  // Nuevo: Cerrar lista del consultorio
  cerrarLista: (id) =>
    fetch(API_URLS.cerrarLista(id), {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Nuevo: Abrir lista del consultorio
  abrirLista: (id) =>
    fetch(API_URLS.abrirLista(id), {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Nuevo: Obtener estado de la lista
  getEstadoLista: (id) =>
    fetch(API_URLS.getEstadoLista(id)).then((r) => r.json()),
};
