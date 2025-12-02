/**
 * LISTA DE PACIENTES CON PAGINACIÓN Y BÚSQUEDA
 * =============================================
 * Versión mejorada de pacienteList.js con paginación y búsqueda del backend
 * 
 * Uso en HTML:
 * <div id="searchContainer"></div>
 * <table id="pacienteTable">
 *   <tbody></tbody>
 * </table>
 * <div id="paginationContainer"></div>
 * 
 * <script src="js/searchComponent.js"></script>
 * <script src="js/paginationComponent.js"></script>
 * <script src="js/pacienteListWithPagination.js"></script>
 */

(() => {
  const tbody = document.querySelector('#pacienteTable tbody');
  const noData = document.getElementById('noPacienteData');
  const loadingIndicator = document.getElementById('loadingIndicator');

  let consultorios = {};
  let searchComponent;
  let paginationComponent;

  // Estado de filtros
  const filters = {
    search: '',
    consultorio_id: null,
    solo_hoy: true,
    is_visible: true,
    atendido: null
  };

  // Inicializar componentes
  function init() {
    // Inicializar búsqueda
    searchComponent = new SearchComponent('searchContainer', {
      placeholder: '🔍 Buscar por nombre, documento, empresa, tipo de examen...',
      onSearch: (searchTerm) => {
        filters.search = searchTerm;
        loadPacientes();
      },
      debounceMs: 500
    });

    // Inicializar paginación
    paginationComponent = new PaginationComponent('paginationContainer', {
      perPage: 20,
      onPageChange: (page, perPage) => {
        loadPacientes(page, perPage);
      },
      showPageInfo: true,
      showPerPageSelector: true,
      perPageOptions: [10, 20, 50, 100]
    });

    // Cargar consultorios
    loadConsultorios();

    // Cargar primera página
    loadPacientes();
  }

  async function loadConsultorios() {
    try {
      const cons = await consultorioService.list();
      consultorios = {};
      cons.filter((c) => c.is_visible).forEach((c) => (consultorios[c.id] = c));
    } catch (error) {
      console.error('Error cargando consultorios:', error);
    }
  }

  async function loadPacientes(page = 1, perPage = null) {
    try {
      showLoading(true);

      // Construir parámetros de consulta
      const params = new URLSearchParams();
      
      // Paginación
      const itemsPerPage = perPage || paginationComponent.getPerPage();
      const skip = (page - 1) * itemsPerPage;
      params.append('skip', skip);
      params.append('limit', itemsPerPage);

      // Búsqueda
      if (filters.search) {
        params.append('search', filters.search);
      }

      // Filtros
      if (filters.consultorio_id) {
        params.append('consultorio_id', filters.consultorio_id);
      }
      if (filters.solo_hoy) {
        params.append('solo_hoy', 'true');
      }
      if (filters.is_visible !== null) {
        params.append('is_visible', filters.is_visible);
      }
      if (filters.atendido !== null) {
        params.append('atendido', filters.atendido);
      }

      // Llamar API con paginación
      const response = await fetch(`${config.API_BASE_URL}/pacientes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar pacientes');

      const pacientes = await response.json();

      // Contar total de registros (necesitamos llamar al endpoint de count)
      const totalResponse = await fetch(
        `${config.API_BASE_URL}/pacientes/count?${new URLSearchParams({
          is_visible: filters.is_visible,
          ...(filters.consultorio_id && { consultorio_id: filters.consultorio_id }),
          ...(filters.atendido !== null && { atendido: filters.atendido })
        }).toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      const { total } = await totalResponse.json();

      // Actualizar paginación
      paginationComponent.update(total);

      // Renderizar tabla
      renderTable(pacientes);

      showLoading(false);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      showError('Error al cargar los pacientes');
      showLoading(false);
    }
  }

  function renderTable(pacientes) {
    tbody.innerHTML = '';
    
    if (noData) {
      noData.style.display = pacientes.length ? 'none' : 'block';
    }

    if (pacientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
            <i class="material-icons" style="font-size: 48px;">search_off</i>
            <p style="margin-top: 10px;">No se encontraron pacientes</p>
          </td>
        </tr>
      `;
      return;
    }

    pacientes.forEach((p) => {
      const tr = document.createElement('tr');
      const cons = consultorios[p.consultorio_id];

      // Estado del paciente
      let badgeClass, badgeText;
      if (p.en_atencion) {
        badgeClass = 'chip en-atencion';
        badgeText = 'En Atención';
      } else if (p.atendido) {
        badgeClass = 'chip atendido';
        badgeText = 'Atendido';
      } else if (p.checked_in) {
        badgeClass = 'chip pendiente';
        badgeText = 'En Espera';
      } else {
        badgeClass = 'chip agendado';
        badgeText = 'Agendado';
      }

      const nombreCompleto = pacienteService.getNombreCompleto(p);
      const empresa = p.empresa || 'N/A';
      const tipoExamen = p.tipo_examen || 'N/A';
      const documento = p.numero_documento || p.cedula || 'N/A';
      const consultorioFull = cons ? cons.consultorio : 'N/A';
      const consultorioNum = consultorioFull.replace(/[^0-9]/g, '') || consultorioFull;
      const valor = `$${p.valor.toLocaleString('es-CO')}`;
      const turno = p.turno > 0 ? p.turno : '—';

      tr.innerHTML = `
        <td title="${p.id}">${p.id}</td>
        <td title="${nombreCompleto}">${nombreCompleto}</td>
        <td title="${documento}">${documento}</td>
        <td title="${tipoExamen}">${tipoExamen}</td>
        <td title="${empresa}">${empresa}</td>
        <td title="${valor}">${valor}</td>
        <td title="${consultorioFull}">${consultorioNum}</td>
        <td title="Turno ${turno}">${turno}</td>
        <td><span class="${badgeClass}">${badgeText}</span></td>
        <td class="actions-cell">
          <div class="dropdown-menu-container">
            <button class="menu-btn" onclick="toggleMenu(event, ${p.id})" aria-label="Opciones">
              <i class="material-icons">more_vert</i>
            </button>
            <div class="dropdown-menu" id="menu-${p.id}">
              <button onclick="verDetallePaciente(${p.id})">
                <i class="material-icons">visibility</i> Ver Detalles
              </button>
              ${!p.atendido ? `
                <button onclick="editarPaciente(${p.id})">
                  <i class="material-icons">edit</i> Editar
                </button>
              ` : ''}
              <button onclick="eliminarPaciente(${p.id})">
                <i class="material-icons">delete</i> Eliminar
              </button>
            </div>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  function showLoading(show) {
    if (loadingIndicator) {
      loadingIndicator.style.display = show ? 'block' : 'none';
    }
    
    if (tbody) {
      tbody.style.opacity = show ? '0.5' : '1';
    }
  }

  function showError(message) {
    // Implementar según tu sistema de notificaciones
    console.error(message);
    if (window.Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
      });
    } else {
      alert(message);
    }
  }

  // Funciones públicas para filtros
  window.setFiltroConsultorio = (consultorioId) => {
    filters.consultorio_id = consultorioId;
    paginationComponent.reset();
    loadPacientes();
  };

  window.setFiltroAtendido = (atendido) => {
    filters.atendido = atendido;
    paginationComponent.reset();
    loadPacientes();
  };

  window.setFiltroSoloHoy = (soloHoy) => {
    filters.solo_hoy = soloHoy;
    paginationComponent.reset();
    loadPacientes();
  };

  window.refreshPacientes = () => {
    loadPacientes(paginationComponent.getCurrentPage());
  };

  // Escuchar eventos del eventBus
  if (window.eventBus) {
    eventBus.on('refresh-pacientes', () => {
      loadPacientes(paginationComponent.getCurrentPage());
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
