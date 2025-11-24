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

      tr.innerHTML = `
      <td>${p.id}</td>
      <td>${pacienteService.getNombreCompleto(p)}</td>
      <td>${p.numero_documento || p.cedula || 'N/A'}</td>
      <td>${p.tipo_examen}</td>
      <td>${p.empresa || 'N/A'}</td>
      <td>$${p.valor.toLocaleString('es-CO')}</td>
      <td>${cons ? cons.consultorio : 'N/A'}</td>
      <td>${p.turno || '—'}</td>
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
    const menu = document.getElementById(`menu-${id}`);
    const allMenus = document.querySelectorAll('.dropdown-menu');
    
    // Cerrar todos los demás menús
    allMenus.forEach(m => {
      if (m.id !== `menu-${id}`) {
        m.classList.remove('show');
      }
    });
    
    // Toggle del menú actual
    menu.classList.toggle('show');
  };

  // Cerrar menús al hacer click fuera
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
  });

  // Función para ver detalles
  window.viewDetails = async (id) => {
    try {
      const p = await pacienteService.get(id);
      showPatientDetails(p);
    } catch (error) {
      showToast('Error al cargar detalles del paciente');
    }
  };

  // Función para mostrar detalles del paciente (puedes personalizar esto)
  function showPatientDetails(p) {
    const cons = consultorios[p.consultorio_id];
    const details = `
      <div class="patient-details-modal">
        <h3>Detalles del Paciente</h3>
        <div class="detail-row"><strong>ID:</strong> ${p.id}</div>
        <div class="detail-row"><strong>Nombre:</strong> ${pacienteService.getNombreCompleto(p)}</div>
        <div class="detail-row"><strong>Documento:</strong> ${p.numero_documento || p.cedula}</div>
        <div class="detail-row"><strong>Tipo Documento:</strong> ${p.tipo_documento}</div>
        <div class="detail-row"><strong>Contacto:</strong> ${p.contacto || 'N/A'}</div>
        <div class="detail-row"><strong>EPS:</strong> ${p.eps || 'N/A'}</div>
        <div class="detail-row"><strong>AFP:</strong> ${p.afp || 'N/A'}</div>
        <div class="detail-row"><strong>ARL:</strong> ${p.arl || 'N/A'}</div>
        <div class="detail-row"><strong>Empresa:</strong> ${p.empresa}</div>
        <div class="detail-row"><strong>Cargo:</strong> ${p.cargo || 'N/A'}</div>
        <div class="detail-row"><strong>Tipo Examen:</strong> ${p.tipo_examen}</div>
        <div class="detail-row"><strong>Valor:</strong> $${p.valor.toLocaleString('es-CO')}</div>
        <div class="detail-row"><strong>Consultorio:</strong> ${cons ? cons.consultorio : 'N/A'}</div>
        <div class="detail-row"><strong>Turno:</strong> ${p.turno || '—'}</div>
        <div class="detail-row"><strong>Observación:</strong> ${p.observacion || 'N/A'}</div>
        <button class="btn-primary" onclick="closeModal()">Cerrar</button>
      </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = details;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
    document.body.appendChild(modal);
  }

  window.closeModal = function() {
    document.querySelector('.modal-overlay')?.remove();
  };
}

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
