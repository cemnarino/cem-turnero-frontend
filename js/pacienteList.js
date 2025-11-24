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
        p.cedula.toString().includes(term)
    );
    render(filtered);
  }

  function render(list) {
    tbody.innerHTML = '';
    noData.style.display = list.length ? 'none' : 'block';
    list.forEach((p) => {
      const tr = document.createElement('tr');
      const cons = consultorios[p.consultorio_id];
      const actTurno = consultorios[p.consultorio_id]?.current_turn;

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
            <button class="dropdown-item" onclick="viewDetails(${p.id})">
              <i class="material-icons">visibility</i>
              Ver Detalles
            </button>
            <button class="dropdown-item" onclick="editPac(${p.id})">
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
      return `<button class="dropdown-item delete-item" onclick="deletePac(${paciente.id})">
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
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
  });

  // Función para ver detalles con historial
  window.viewDetails = async (id) => {
    try {
      const p = await pacienteService.get(id);
      // Obtener historial del paciente por documento
      const historial = await fetchPatientHistory(p.numero_documento || p.cedula);
      showPatientDetails(p, historial);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      showToast('Error al cargar detalles del paciente');
    }
  };

  // Función para obtener historial del paciente
  async function fetchPatientHistory(documento) {
    try {
      const response = await fetch(`${CONFIG.SERVER.HTTP_BASE_URL}/pacientes/`);
      const allPatients = await response.json();
      
      // Filtrar todas las visitas del paciente por documento
      return allPatients.filter(pac => 
        (pac.numero_documento === documento || pac.cedula === documento) &&
        pac.is_visible
      ).sort((a, b) => new Date(b.hora_entrada) - new Date(a.hora_entrada));
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }

  // Función para mostrar detalles completos del paciente con historial
  function showPatientDetails(p, historial = []) {
    const cons = consultorios[p.consultorio_id];
    const nombreCompleto = pacienteService.getNombreCompleto(p);
    
    // Estado actual del paciente
    let estadoActual = 'En Espera';
    let estadoClass = 'status-waiting';
    if (p.en_atencion) {
      estadoActual = 'En Atención';
      estadoClass = 'status-in-progress';
    } else if (p.atendido) {
      estadoActual = 'Atendido';
      estadoClass = 'status-completed';
    }

    // Generar HTML del historial
    const historialHTML = historial.length > 0 ? `
      <div class="patient-history">
        <h4>
          <i class="material-icons">history</i>
          Historial de Visitas (${historial.length})
        </h4>
        <div class="history-list">
          ${historial.map((visit, index) => {
            const visitCons = consultorios[visit.consultorio_id];
            const visitDate = new Date(visit.hora_entrada);
            const isCurrentVisit = visit.id === p.id;
            
            return `
              <div class="history-item ${isCurrentVisit ? 'current-visit' : ''}">
                <div class="history-header">
                  <span class="history-number">#${historial.length - index}</span>
                  <span class="history-date">
                    <i class="material-icons">calendar_today</i>
                    ${visitDate.toLocaleDateString('es-CO', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  ${isCurrentVisit ? '<span class="current-badge">Visita Actual</span>' : ''}
                </div>
                <div class="history-body">
                  <div class="history-detail">
                    <strong>Consultorio:</strong> ${visitCons ? visitCons.consultorio : 'N/A'}
                  </div>
                  <div class="history-detail">
                    <strong>Tipo de Examen:</strong> ${visit.tipo_examen}
                  </div>
                  <div class="history-detail">
                    <strong>Empresa:</strong> ${visit.empresa || 'N/A'}
                  </div>
                  <div class="history-detail">
                    <strong>Valor:</strong> $${visit.valor.toLocaleString('es-CO')}
                  </div>
                  ${visit.observacion ? `
                    <div class="history-detail">
                      <strong>Observación:</strong> ${visit.observacion}
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '<p class="no-history">No hay historial previo de visitas.</p>';
    
    const details = `
      <div class="patient-details-modal">
        <div class="modal-header">
          <div>
            <h3>
              <i class="material-icons">person</i>
              ${nombreCompleto}
            </h3>
            <span class="patient-status ${estadoClass}">${estadoActual}</span>
          </div>
          <button class="close-btn" onclick="closeModal()" aria-label="Cerrar">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div class="tabs-container">
          <div class="tabs-header">
            <button class="tab-btn active" data-tab="info">
              <i class="material-icons">info</i>
              Información
            </button>
            <button class="tab-btn" data-tab="history">
              <i class="material-icons">history</i>
              Historial
            </button>
          </div>

          <div class="tab-content active" id="info-tab">
            <div class="info-section">
              <h4>
                <i class="material-icons">badge</i>
                Datos Personales
              </h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Tipo Documento</span>
                  <span class="detail-value">${p.tipo_documento}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Número Documento</span>
                  <span class="detail-value">${p.numero_documento || p.cedula}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Contacto</span>
                  <span class="detail-value">${p.contacto || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>
                <i class="material-icons">health_and_safety</i>
                Seguridad Social
              </h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">EPS</span>
                  <span class="detail-value">${p.eps || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">AFP</span>
                  <span class="detail-value">${p.afp || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">ARL</span>
                  <span class="detail-value">${p.arl || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>
                <i class="material-icons">business</i>
                Información Laboral
              </h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Empresa</span>
                  <span class="detail-value">${p.empresa}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Cargo</span>
                  <span class="detail-value">${p.cargo || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Responsable</span>
                  <span class="detail-value">${p.responsable_empresa || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h4>
                <i class="material-icons">medical_services</i>
                Información de la Visita
              </h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Tipo de Examen</span>
                  <span class="detail-value">${p.tipo_examen}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Consultorio</span>
                  <span class="detail-value">${cons ? cons.consultorio : 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Turno</span>
                  <span class="detail-value">${p.turno || '—'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Valor</span>
                  <span class="detail-value">$${p.valor.toLocaleString('es-CO')}</span>
                </div>
              </div>
              ${p.observacion ? `
                <div class="detail-item full-width">
                  <span class="detail-label">Observación</span>
                  <span class="detail-value">${p.observacion}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="tab-content" id="history-tab">
            ${historialHTML}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" onclick="closeModal()">
            <i class="material-icons">close</i>
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = details;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
    
    // Event listeners para las pestañas
    setTimeout(() => {
      const tabBtns = modal.querySelectorAll('.tab-btn');
      const tabContents = modal.querySelectorAll('.tab-content');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.dataset.tab;
          
          tabBtns.forEach(b => b.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          btn.classList.add('active');
          document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
      });
    }, 0);
    
    document.body.appendChild(modal);
  };

  window.closeModal = function() {
    document.querySelector('.modal-overlay')?.remove();
  };

  window.editPac = async (id) => {
    try {
      const p = await pacienteService.get(id);
      eventBus.emit('edit-paciente', p);
    } catch (error) {
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
      await pacienteService.delete(id);
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
