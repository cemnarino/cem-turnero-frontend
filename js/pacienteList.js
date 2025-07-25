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
      <td>${p.cedula}</td>
      <td>${p.tipo_examen}</td>
      <td>${p.empresa || 'N/A'}</td>
      <td>$${p.valor.toLocaleString('es-CO')}</td>
      <td>${cons ? cons.consultorio : 'N/A'}</td>
      <td>${p.turno || '—'}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td>
        <button class="icon-btn" onclick="editPac(${p.id})" title="Editar">
          <i class="material-icons">edit</i>
        </button>
        ${renderDeleteButton(p)}
      </td>
    `;
      tbody.appendChild(tr);
    });
  }

  // Función para renderizar el botón de eliminar condicionalmente
  function renderDeleteButton(paciente) {
    // Solo permitir eliminar si el paciente está en espera (no en atención ni atendido)
    if (!paciente.en_atencion && !paciente.atendido) {
      return `<button class="icon-btn delete-btn" onclick="deletePac(${paciente.id})" title="Eliminar">
                <i class="material-icons">delete</i>
              </button>`;
    } else {
      // Mostrar botón deshabilitado con explicación
      const razon = paciente.en_atencion ? 'en atención' : 'ya atendido';
      return `<button class="icon-btn" disabled title="No se puede eliminar: paciente ${razon}">
                <i class="material-icons" style="color: #ccc;">block</i>
              </button>`;
    }
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
