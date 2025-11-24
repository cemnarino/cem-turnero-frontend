// js/pacienteService.js

window.pacienteService = {
  list: () => fetch(API_URLS.getPacientes()).then((r) => r.json()),
  get: (id) => fetch(API_URLS.getPacienteById(id)).then((r) => r.json()),
  create: (p) =>
    fetch(API_URLS.createPaciente(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then((r) => r.json()),
  update: (id, p) =>
    fetch(API_URLS.updatePaciente(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then((r) => r.json()),

  // Mantener hide por compatibilidad (aunque no se usa en el nuevo backend)
  hide: (id) =>
    fetch(API_URLS.hidePaciente(id), {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Nuevo: Eliminar paciente permanentemente (solo si está en espera)
  delete: (id) =>
    fetch(API_URLS.deletePaciente(id), {
      method: 'DELETE',
    }).then((r) => {
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      return r.status === 204 ? { success: true } : r.json();
    }),

  // Nuevo: Obtener pacientes con paginación
  getPaginado: (params = {}) => {
    const searchParams = new URLSearchParams();

    // Paginación
    if (params.page) searchParams.append('page', params.page);
    if (params.per_page) searchParams.append('per_page', params.per_page);

    // Filtros
    if (params.consultorio_id)
      searchParams.append('consultorio_id', params.consultorio_id);
    if (params.atendido !== undefined)
      searchParams.append('atendido', params.atendido);
    if (params.en_atencion !== undefined)
      searchParams.append('en_atencion', params.en_atencion);
    if (params.is_visible !== undefined)
      searchParams.append('is_visible', params.is_visible);

    return fetch(
      `${API_URLS.getPacientesPaginado()}?${searchParams.toString()}`
    ).then((r) => r.json());
  },

  // Nuevo: Buscar pacientes con criterios avanzados
  buscar: (criterios = {}) => {
    const params = new URLSearchParams();

    // Criterios de búsqueda
    if (criterios.texto) params.append('texto', criterios.texto);
    if (criterios.numero_documento) params.append('numero_documento', criterios.numero_documento);
    if (criterios.cedula) params.append('numero_documento', criterios.cedula); // Compatibilidad
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

    return fetch(`${API_URLS.searchPacientes()}?${params.toString()}`).then(
      (r) => r.json()
    );
  },

  // Buscar por número de documento (múltiples registros)
  buscarPorCedula: (numeroDocumento) =>
    fetch(API_URLS.getPacienteByCedula(numeroDocumento)).then((r) => r.json()),
  
  // Alias para compatibilidad
  buscarPorNumeroDocumento: (numeroDocumento) =>
    fetch(API_URLS.getPacienteByCedula(numeroDocumento)).then((r) => r.json()),

  // Nuevo: Exportar a Excel
  exportarExcel: (filtros = {}) => {
    const params = new URLSearchParams();

    // Aplicar filtros disponibles
    if (filtros.is_visible !== undefined)
      params.append('is_visible', filtros.is_visible);
    if (filtros.atendido !== undefined)
      params.append('atendido', filtros.atendido);
    if (filtros.consultorio_id)
      params.append('consultorio_id', filtros.consultorio_id);

    // Construir URL con parámetros
    const url = `${API_URLS.exportPacientesExcel()}?${params.toString()}`;

    // Crear un enlace temporal para descargar el archivo
    const link = document.createElement('a');
    link.href = url;
    link.download = `pacientes_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.xlsx`;
    link.style.display = 'none';

    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return Promise.resolve({ success: true, message: 'Descarga iniciada' });
  },

  getNombreCompleto: (p) =>
    [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
      .filter(Boolean)
      .join(' '),
};
