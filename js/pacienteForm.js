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

    // Conversiones de tipos específicas
    data.valor = Number(data.valor);
    data.consultorio_id = Number(data.consultorio_id);
    // Mantener cedula como string pero validar que sea numérica
    data.cedula = String(data.cedula).trim();

    // Validar que la cédula solo contenga números
    if (!/^\d+$/.test(data.cedula)) {
      showToast('La cédula debe contener solo números', 'error');
      return;
    }

    console.log('📋 Datos del paciente a enviar:', data);

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
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      showToast('Error al guardar paciente', 'error');
    }
  });
  btnCancelar.addEventListener('click', resetForm);

  // Validación en tiempo real para el campo cédula
  const cedulaInput = document.getElementById('cedula');
  if (cedulaInput) {
    // Solo permitir números en el input
    cedulaInput.addEventListener('input', (e) => {
      // Remover cualquier carácter que no sea número
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Validar cuando el usuario salga del campo
    cedulaInput.addEventListener('blur', (e) => {
      const value = e.target.value.trim();
      if (value && (value.length < 6 || value.length > 15)) {
        e.target.setCustomValidity('La cédula debe tener entre 6 y 15 dígitos');
        e.target.reportValidity();
      } else {
        e.target.setCustomValidity('');
      }
    });
  }

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
