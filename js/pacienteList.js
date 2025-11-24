// js/pacienteList.js

(() => {
  const tbody = document.querySelector('#pacienteTable tbody');
  const filterInput = document.getElementById('pacienteFilter');
  const noData = document.getElementById('noPacienteData');

  let rows = [];
  let consultorios = {};

  eventBus.on('refresh-pacientes', load);

  filterInput.addEventListener('input', applyFilter);

  async function load() {
    const [pac, cons] = await Promise.all([
      pacienteService.list(),
      consultorioService.list(),
    ]);
    rows = pac.filter((p) => p.is_visible);
    consultorios = {};
    cons.filter((c) => c.is_visible).forEach((c) => (consultorios[c.id] = c));
    applyFilter();
  }

  function applyFilter() {
    const term = filterInput.value.toLowerCase();
    const filtered = rows.filter(
      (p) =>
        pacienteService.getNombreCompleto(p).toLowerCase().includes(term) ||
        (p.numero_documento || p.cedula || '').toString().includes(term)
    );
    render(filtered);
  }

  function render(list) {
    tbody.innerHTML = '';
    noData.style.display = list.length ? 'none' : 'block';
    list.forEach((p) => {
      const tr = document.createElement('tr');
      const cons = consultorios[p.consultorio_id];

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

      const nombreCompleto = pacienteService.getNombreCompleto(p);
      const empresa = p.empresa || 'N/A';
      const tipoExamen = p.tipo_examen || 'N/A';
      const documento = p.numero_documento || p.cedula || 'N/A';
      const consultorioFull = cons ? cons.consultorio : 'N/A';
      // Extraer solo el número del consultorio (ej: "Consultorio 1" -> "1")
      const consultorioNum = consultorioFull.replace(/[^0-9]/g, '') || consultorioFull;
      const valor = `$${p.valor.toLocaleString('es-CO')}`;

      tr.innerHTML = `
      <td title="${p.id}">${p.id}</td>
      <td title="${nombreCompleto}">${nombreCompleto}</td>
      <td title="${documento}">${documento}</td>
      <td title="${tipoExamen}">${tipoExamen}</td>
      <td title="${empresa}">${empresa}</td>
      <td title="${valor}">${valor}</td>
      <td title="${consultorioFull}">${consultorioNum}</td>
      <td title="${p.turno || 'Sin turno'}">${p.turno || '—'}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td class="actions-cell">
        <div class="dropdown-menu-container">
          <button class="menu-btn" onclick="toggleMenu(event, ${p.id})" aria-label="Opciones">
            <i class="material-icons">more_vert</i>
          </button>
          <div class="dropdown-menu" id="menu-${p.id}">
            <button class="dropdown-item" onclick="event.stopPropagation(); viewDetails(${p.id});">
              <i class="material-icons">visibility</i>
              Ver Detalles
            </button>
            <button class="dropdown-item" onclick="event.stopPropagation(); editPac(${p.id});">
              <i class="material-icons">edit</i>
              Editar
            </button>
            ${renderDeleteMenuItem(p)}
          </div>
        </div>
      </td>
    `;
      tbody.appendChild(tr);
    });
  }

  // Función para renderizar el item de menú de eliminar condicionalmente
  function renderDeleteMenuItem(paciente) {
    // Solo permitir eliminar si el paciente está en espera (no en atención ni atendido)
    if (!paciente.en_atencion && !paciente.atendido) {
      return `<button class="dropdown-item delete-item" onclick="event.stopPropagation(); deletePac(${paciente.id});">
                <i class="material-icons">delete</i>
                Eliminar
              </button>`;
    } else {
      // Mostrar item deshabilitado con explicación
      const razon = paciente.en_atencion ? 'en atención' : 'ya atendido';
      return `<button class="dropdown-item" disabled title="No se puede eliminar: paciente ${razon}">
                <i class="material-icons">block</i>
                No disponible
              </button>`;
    }
  }

  // Función para toggle del menú dropdown
  window.toggleMenu = function(event, id) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const menu = document.getElementById(`menu-${id}`);
    const allMenus = document.querySelectorAll('.dropdown-menu');
    
    // Cerrar todos los demás menús
    allMenus.forEach(m => {
      if (m.id !== `menu-${id}`) {
        m.classList.remove('show');
      }
    });
    
    // Calcular posición del menú
    const rect = button.getBoundingClientRect();
    const menuHeight = 150; // Altura aproximada del menú
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Decidir si mostrar arriba o abajo
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      // Mostrar arriba
      menu.style.top = (rect.top - menuHeight) + 'px';
    } else {
      // Mostrar abajo
      menu.style.top = rect.bottom + 'px';
    }
    
    menu.style.left = (rect.right - 180) + 'px'; // 180px = ancho del menú
    
    // Toggle del menú actual
    menu.classList.toggle('show');
  };

  // Cerrar menús al hacer click fuera
  document.addEventListener('click', (e) => {
    // No cerrar si el click fue en un botón de menú o dentro del menú
    if (e.target.closest('.dropdown-menu') || e.target.closest('.menu-btn')) {
      return;
    }
    
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
  });

  // Función para ver detalles - Navega a vista dedicada
  window.viewDetails = async (id) => {
    console.log('👁️ Ver detalles llamado con ID:', id);
    try {
      const p = await pacienteService.get(id);
      console.log('✅ Paciente obtenido:', p);
      // Obtener historial del paciente por documento
      const historial = await fetchPatientHistory(p.numero_documento || p.cedula);
      console.log('📜 Historial obtenido:', historial.length, 'visitas');
      
      // Navegar a la vista de detalles
      navigateToDetailView(p, historial);
    } catch (error) {
      console.error('❌ Error al cargar detalles:', error);
      showToast('Error al cargar detalles del paciente');
    }
  };

  // Función para navegar a la vista de detalles
  function navigateToDetailView(paciente, historial) {
    // Ocultar vista de pacientes y mostrar vista de detalles
    document.getElementById('pacientes-view').style.display = 'none';
    document.getElementById('paciente-detalle-view').style.display = 'block';
    
    // Llenar información del paciente
    fillPatientDetails(paciente, historial);
    
    // Configurar botón de volver
    document.getElementById('btnVolverListado').onclick = () => {
      document.getElementById('paciente-detalle-view').style.display = 'none';
      document.getElementById('pacientes-view').style.display = 'block';
    };
  }
  
  // Llenar datos del paciente en la vista
  function fillPatientDetails(p, historial) {
    const cons = consultorios[p.consultorio_id];
    const nombreCompleto = pacienteService.getNombreCompleto(p);
    
    // Información Personal
    document.getElementById('detalle-nombre').textContent = nombreCompleto;
    document.getElementById('detalle-documento').textContent = p.numero_documento || p.cedula || 'N/A';
    document.getElementById('detalle-tipo-doc').textContent = p.tipo_documento || 'N/A';
    document.getElementById('detalle-contacto').textContent = p.contacto || 'N/A';
    
    // Seguridad Social
    document.getElementById('detalle-eps').textContent = p.eps || 'N/A';
    document.getElementById('detalle-afp').textContent = p.afp || 'N/A';
    document.getElementById('detalle-arl').textContent = p.arl || 'N/A';
    
    // Información Laboral
    document.getElementById('detalle-empresa').textContent = p.empresa || 'N/A';
    document.getElementById('detalle-cargo').textContent = p.cargo || 'N/A';
    document.getElementById('detalle-responsable').textContent = p.responsable_empresa || 'N/A';
    
    // Información de Consulta
    document.getElementById('detalle-examen').textContent = p.tipo_examen || 'N/A';
    document.getElementById('detalle-consultorio').textContent = cons ? cons.consultorio : 'N/A';
    document.getElementById('detalle-turno').textContent = p.turno || 'Sin asignar';
    document.getElementById('detalle-valor').textContent = `$${p.valor.toLocaleString('es-CO')}`;
    document.getElementById('detalle-observacion').textContent = p.observacion || 'Sin observaciones';
    
    // Estado
    let estadoText = 'En Espera';
    if (p.en_atencion) {
      estadoText = 'En Atención';
    } else if (p.atendido) {
      estadoText = 'Atendido';
    }
    document.getElementById('detalle-estado').textContent = estadoText;
    
    // Llenar historial
    fillHistorial(p, historial);
  }
  
  // Llenar historial en la vista de detalles
  function fillHistorial(currentPatient, historial) {
    const tbody = document.getElementById('historial-tbody');
    const noHistorial = document.getElementById('no-historial');
    const table = document.getElementById('historial-table');
    
    if (!historial || historial.length === 0) {
      table.style.display = 'none';
      noHistorial.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    noHistorial.style.display = 'none';
    
    tbody.innerHTML = historial.map(visit => {
      const visitCons = consultorios[visit.consultorio_id];
      const visitDate = visit.hora_entrada ? new Date(visit.hora_entrada) : (visit.hora_agendada ? new Date(visit.hora_agendada) : null);
      const isCurrentVisit = visit.id === currentPatient.id;
      
      let estadoText = 'En Espera';
      if (visit.en_atencion) estadoText = 'En Atención';
      else if (visit.atendido) estadoText = 'Atendido';
      
      return `
        <tr class="${isCurrentVisit ? 'current-visit' : ''}">
          <td>${visitDate ? visitDate.toLocaleDateString('es-CO') + ' ' + visitDate.toLocaleTimeString('es-CO', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}</td>
          <td>${visit.tipo_examen || 'N/A'}</td>
          <td>${visitCons ? visitCons.consultorio : 'N/A'}</td>
          <td><span class="chip ${estadoText.toLowerCase().replace(' ', '-')}">${estadoText}</span></td>
          <td>${visit.observacion || 'Sin observaciones'}</td>
        </tr>
      `;
    }).join('');
  }

  // Función para obtener historial del paciente
  async function fetchPatientHistory(documento) {
    try {
      const response = await fetch(`${CONFIG.SERVER.HTTP_BASE_URL}/pacientes/`);
      const allPatients = await response.json();
      
      // Filtrar todas las visitas del paciente por documento
      return allPatients.filter(pac => 
        (pac.numero_documento === documento || pac.cedula === documento) &&
        pac.is_visible
      ).sort((a, b) => {
        // Usar hora_entrada o hora_agendada para ordenar
        const dateA = new Date(a.hora_entrada || a.hora_agendada || 0);
        const dateB = new Date(b.hora_entrada || b.hora_agendada || 0);
        return dateB - dateA; // Más reciente primero
      });
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }

  window.editPac = async (id) => {
    console.log('✏️ Editar llamado con ID:', id);
    try {
      const p = await pacienteService.get(id);
      console.log('✅ Paciente obtenido para editar:', p);
      eventBus.emit('edit-paciente', p);
      console.log('📢 Evento edit-paciente emitido');
    } catch (error) {
      console.error('❌ Error al cargar paciente:', error);
      showToast('Error al cargar paciente');
    }
  };

  window.hidePac = async (id) => {
    if (!confirm('¿Ocultar paciente?')) return;
    await pacienteService.hide(id);
    showToast('Paciente oculto');
    // Actualizar todas las vistas relacionadas
    load();
    eventBus.emit('refresh-turnos');
    eventBus.emit('refresh-historial');
    eventBus.emit('refresh-informante');
  };

  // Nueva función para eliminar paciente (solo si está en espera)
  window.deletePac = async (id) => {
    try {
      // Obtener datos del paciente para verificar estado
      const paciente = await pacienteService.get(id);

      // Verificar que el paciente esté en espera
      if (paciente.en_atencion) {
        showToast(
          'No se puede eliminar: el paciente está en atención',
          'error'
        );
        return;
      }

      if (paciente.atendido) {
        showToast('No se puede eliminar: el paciente ya fue atendido', 'error');
        return;
      }

      // Confirmar eliminación
      const nombreCompleto = pacienteService.getNombreCompleto(paciente);
      if (
        !confirm(
          `¿Eliminar permanentemente a ${nombreCompleto}?\n\nEsta acción no se puede deshacer.`
        )
      ) {
        return;
      }

      // Proceder con la eliminación
      await pacienteService.hide(id); // Usamos hide porque no hay delete en el servicio
      showToast('Paciente eliminado correctamente');

      // Actualizar todas las vistas relacionadas
      load();
      eventBus.emit('refresh-turnos');
      eventBus.emit('refresh-historial');
      eventBus.emit('refresh-informante');
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      if (error.status === 404) {
        showToast('Paciente no encontrado', 'error');
      } else {
        showToast('Error al eliminar paciente', 'error');
      }
    }
  };

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  load();
})();
