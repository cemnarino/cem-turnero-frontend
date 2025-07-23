// js/consultorioList.js

(() => {
  const tbody = document.querySelector('#consultorioTable tbody');
  const filterInput = document.getElementById('filterInput');
  const noData = document.getElementById('noData');

  let rows = [];

  eventBus.on('refresh-list', load);

  filterInput.addEventListener('input', applyFilter);

  function safeArray(data) {
    return Array.isArray(data) ? data : [];
  }

  async function load() {
    try {
      rows = safeArray(await consultorioService.list());
      rows = rows.filter((r) => r.is_visible);
      applyFilter();
    } catch {
      showToast('Error al cargar');
    }
  }

  function applyFilter() {
    const term = filterInput.value.toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.nombre_medico.toLowerCase().includes(term) ||
        r.consultorio.toLowerCase().includes(term)
    );
    render(filtered);
  }

  function render(list) {
    tbody.innerHTML = '';
    noData.style.display = list.length ? 'none' : 'block';
    list.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.nombre_medico}</td>
      <td>${r.consultorio}</td>
      <td>${r.piso}</td>
      <td>${r.current_turn}</td>
      <td>
        <button class="icon-btn" onclick="edit(${r.id})" title="Editar">
          <i class="material-icons">edit</i>
        </button>
        <button class="icon-btn" onclick="hide(${r.id})" title="Ocultar">
          <i class="material-icons">visibility_off</i>
        </button>
      </td>
    `;
      tbody.appendChild(tr);
    });
  }

  window.edit = async (id) => {
    const c = await consultorioService.get(id);
    eventBus.emit('edit-consultorio', c);
  };

  window.hide = async (id) => {
    if (!confirm('¿Ocultar consultorio?')) return;
    try {
      await consultorioService.hide(id);
      showToast('Consultorio oculto');
      load();
      // Actualizar otras vistas que dependen de consultorios
      eventBus.emit('refresh-pacientes');
      eventBus.emit('refresh-turnos');
      eventBus.emit('refresh-informante');
    } catch {
      showToast('Error');
    }
  };

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  load(); // primera carga
})();
