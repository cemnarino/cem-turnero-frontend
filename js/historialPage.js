// js/historialPage.js

(() => {
  const btnPendientes = document.getElementById('btnPendientes');
  const btnAtendidos = document.getElementById('btnAtendidos');
  const fechaDesde = document.getElementById('fechaDesde');
  const fechaHasta = document.getElementById('fechaHasta');
  const btnFiltrar = document.getElementById('btnFiltrarFechas');
  const btnLimpiar = document.getElementById('btnLimpiarFiltros');
  const btnExportarExcel = document.getElementById('btnExportarExcel');
  const searchInput = document.getElementById('searchInput');
  const tbody = document.querySelector('#historialTable tbody');
  const noResultados = document.getElementById('noResultados');

  let pacientes = [];
  let consultorios = {};
  let mostrarAtendidos = false;

  init();

  let paginaActual = 1;
  const itemsPorPagina = 20;
  let totalPaginas = 1;

  async function init() {
    // Cargar consultorios
    const cons = await consultorioService.list();
    cons.filter((c) => c.is_visible).forEach((c) => (consultorios[c.id] = c));

    // Cargar primera página de pacientes con paginación
    await cargarPacientesPaginados();
    bindEvents();
  }

  async function cargarPacientesPaginados() {
    try {
      const resultado = await pacienteService.getPaginado({
        page: paginaActual,
        per_page: itemsPorPagina,
        is_visible: true,
      });

      pacientes = resultado.items || [];
      totalPaginas = resultado.pages || 1;

      // Actualizar información de paginación
      actualizarInfoPaginacion(resultado);
      filtrar();
    } catch (error) {
      console.error('Error cargando pacientes paginados:', error);
      showToast('Error cargando historial', 'error');
    }
  }

  function actualizarInfoPaginacion(resultado) {
    // Buscar o crear elemento de información de paginación
    let paginacionInfo = document.getElementById('paginacion-info');
    if (!paginacionInfo) {
      paginacionInfo = document.createElement('div');
      paginacionInfo.id = 'paginacion-info';
      paginacionInfo.className = 'paginacion-info';

      // Insertar antes de la tabla
      const tabla = document.getElementById('historialTable');
      if (tabla && tabla.parentNode) {
        tabla.parentNode.insertBefore(paginacionInfo, tabla);
      }
    }

    paginacionInfo.innerHTML = `
      <div class="info-pagina">
        <span>Página ${resultado.page} de ${resultado.pages} - Total: ${
      resultado.total
    } registros</span>
        
      </div>
      <div class="controles-pagina">
        <button onclick="cambiarPagina(${resultado.page - 1})" ${
      !resultado.has_prev ? 'disabled' : ''
    }>
          <i class="material-icons">chevron_left</i> Anterior
        </button>
        <span class="pagina-actual">Página ${resultado.page}</span>
        <button onclick="cambiarPagina(${resultado.page + 1})" ${
      !resultado.has_next ? 'disabled' : ''
    }>
          Siguiente <i class="material-icons">chevron_right</i>
        </button>
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('paginacion-styles')) {
      const styles = document.createElement('style');
      styles.id = 'paginacion-styles';
      styles.textContent = `
        .paginacion-info {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
        }
        
        .info-pagina {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .estadisticas {
          display: flex;
          gap: 15px;
        }
        
        .stat {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .stat.pending { background: #fff3cd; color: #856404; }
        .stat.attention { background: #cce5ff; color: #004085; }
        .stat.completed { background: #d4edda; color: #155724; }
        
        .controles-pagina {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }
        
        .controles-pagina button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .controles-pagina button:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .controles-pagina button:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .pagina-actual {
          font-weight: 600;
          color: #495057;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Función global para cambiar página
  window.cambiarPagina = async (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;

    paginaActual = nuevaPagina;
    await cargarPacientesPaginados();
  };

  function bindEvents() {
    btnPendientes.addEventListener('click', () => cambiarVista(false));
    btnAtendidos.addEventListener('click', () => cambiarVista(true));
    btnFiltrar.addEventListener('click', () => {
      paginaActual = 1; // Resetear a primera página al filtrar
      cargarPacientesPaginados();
    });
    btnLimpiar.addEventListener('click', limpiar);
    searchInput.addEventListener('input', () => {
      // Debounce la búsqueda
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        paginaActual = 1;
        cargarPacientesPaginados();
      }, 500);
    });

    // Botón de exportación a Excel
    if (btnExportarExcel) {
      btnExportarExcel.addEventListener('click', exportarAExcel);
    }
  }

  function cambiarVista(atendidos) {
    mostrarAtendidos = atendidos;
    btnPendientes.classList.toggle('active', !atendidos);
    btnAtendidos.classList.toggle('active', atendidos);
    paginaActual = 1; // Resetear a primera página al cambiar vista
    cargarPacientesPaginados();
  }

  function filtrar() {
    // Usar la búsqueda avanzada del backend en lugar de filtrar en el frontend
    buscarConCriterios();
  }

  async function buscarConCriterios() {
    try {
      const criterios = {
        page: paginaActual,
        per_page: itemsPorPagina,
        is_visible: true,
      };

      // Filtro por estado de atención
      if (mostrarAtendidos) {
        criterios.atendido = true;
      } else {
        criterios.atendido = false;
      }

      // Filtro por texto de búsqueda
      const textoBusqueda = searchInput.value.trim();
      if (textoBusqueda) {
        criterios.texto = textoBusqueda;
      }

      // Filtros de fecha
      const fechaDesdeValue = fechaDesde.value;
      const fechaHastaValue = fechaHasta.value;

      if (fechaDesdeValue) {
        criterios.fecha_inicio = fechaDesdeValue;
      }

      if (fechaHastaValue) {
        criterios.fecha_fin = fechaHastaValue;
      }

      // Realizar búsqueda
      const resultado = await pacienteService.buscar(criterios);

      pacientes = resultado.items || [];
      totalPaginas = resultado.pages || 1;

      // Actualizar información de paginación
      actualizarInfoPaginacion(resultado);
      renderTabla(pacientes);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      showToast('Error en la búsqueda', 'error');
    }
  }

  function limpiar() {
    fechaDesde.value = '';
    fechaHasta.value = '';
    searchInput.value = '';
    cambiarVista(false);
  }

  function renderTabla(lista) {
    tbody.innerHTML = '';
    noResultados.style.display = lista.length ? 'none' : 'block';

    // obtener turno actual de cada consultorio (una vez)
    let turnoActual = {};
    for (const c of Object.values(consultorios)) {
      turnoActual[c.id] = c.current_turn || 0;
    }

    lista.forEach((p) => {
      const cons = consultorios[p.consultorio_id] || p.consultorio; // Soporte para datos incluidos del backend

      // Usar el nuevo campo en_atencion del backend
      let badgeClass, badgeText;
      if (p.en_atencion) {
        badgeClass = 'chip en-atencion';
        badgeText = 'En Atención';
      } else if (p.atendido) {
        badgeClass = 'chip atendido';
        badgeText = 'Atendido';
      } else {
        badgeClass = 'chip pendiente';
        badgeText = 'En Espera';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nombre_completo || pacienteService.getNombreCompleto(p)}</td>
      <td>${p.cedula}</td>
      <td>${p.tipo_examen}</td>
      <td>${p.empresa || 'N/A'}</td>
      <td>$${p.valor.toLocaleString('es-CO')}</td>
      <td>${cons?.nombre_medico || cons?.consultorio || 'N/A'}</td>
      <td>${p.turno_label || p.turno || '—'}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td>${new Date(p.hora_entrada).toLocaleString('es-CO')}</td>
    `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Exporta el historial a Excel con los filtros aplicados
   */
  async function exportarAExcel() {
    try {
      // Deshabilitar botón y mostrar loading
      btnExportarExcel.disabled = true;
      btnExportarExcel.innerHTML =
        '<i class="material-icons">hourglass_empty</i> Generando...';

      // Preparar filtros basados en el estado actual de la página
      const filtros = {
        is_visible: true,
      };

      // Aplicar filtro por estado de atención
      if (mostrarAtendidos) {
        filtros.atendido = true;
      } else {
        filtros.atendido = false;
      }

      // Llamar al servicio para descargar el Excel
      await pacienteService.exportarExcel(filtros);

      showToast('Descarga de Excel iniciada correctamente', 'success');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      showToast('Error al generar el archivo Excel', 'error');
    } finally {
      // Restaurar botón
      setTimeout(() => {
        btnExportarExcel.disabled = false;
        btnExportarExcel.innerHTML =
          '<i class="material-icons">file_download</i> Descargar Excel';
      }, 2000);
    }
  }

  // Primera carga
  eventBus.on('refresh-historial', () => {
    paginaActual = 1;
    cargarPacientesPaginados();
  });
})();
