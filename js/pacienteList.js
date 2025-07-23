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
      const badgeClass =
        p.turno === actTurno
          ? 'chip en-atencion'
          : p.atendido
          ? 'chip atendido'
          : 'chip pendiente';
      const badgeText =
        p.turno === actTurno
          ? 'En Atención'
          : p.atendido
          ? 'Atendido'
          : 'Pendiente';

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
        <button class="icon-btn" onclick="hidePac(${p.id})" title="Ocultar">
          <i class="material-icons">visibility_off</i>
        </button>
      </td>
    `;
      tbody.appendChild(tr);
    });
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

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  load();
})();
