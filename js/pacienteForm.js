// js/pacienteForm.js

(() => {
  const form = document.getElementById('pacienteForm');
  const title = document.getElementById('pacienteFormTitle');
  const btnGuardar = document.getElementById('btnPacGuardar');
  const btnCancelar = document.getElementById('btnPacCancelar');
  const consultorioSelect = document.getElementById('consultorio_id');

  let editingId = null;

  eventBus.on('edit-paciente', (p) => {
    editingId = p.id;
    Object.keys(p).forEach((k) => {
      const el = document.getElementById(k);
      if (el) el.value = p[k] ?? '';
    });
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.style.display = 'inline-block';
    title.textContent = 'Editar Paciente';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.valor = Number(data.valor);
    data.consultorio_id = Number(data.consultorio_id);
    try {
      if (editingId) {
        await pacienteService.update(editingId, data);
        showToast('Paciente actualizado');
      } else {
        await pacienteService.create(data);
        showToast('Paciente registrado');
      }
      resetForm();
      // Emitir eventos para actualizar todas las vistas relacionadas
      eventBus.emit('refresh-pacientes');
      eventBus.emit('refresh-turnos');
      eventBus.emit('refresh-historial');
      eventBus.emit('refresh-informante');
    } catch {
      showToast('Error al guardar');
    }
  });
  btnCancelar.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    editingId = null;
    btnGuardar.textContent = 'Registrar';
    btnCancelar.style.display = 'none';
    title.textContent = 'Nuevo Paciente';
  }

  function safeArray(data) {
    return Array.isArray(data) ? data : [];
  }

  // Cargar consultorios en el select
  async function loadConsultorios() {
    const list = safeArray(await consultorioService.list());
    consultorioSelect.innerHTML = '<option value="">Seleccione...</option>';
    list
      .filter((c) => c.is_visible)
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.consultorio} - ${c.nombre_medico} (${c.piso})`;
        consultorioSelect.appendChild(opt);
      });
  }

  // Escuchar eventos para recargar consultorios
  eventBus.on('refresh-pacientes', loadConsultorios);

  loadConsultorios();
})();
