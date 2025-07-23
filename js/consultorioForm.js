// js\consultorioForm.js

(() => {
  const form = document.getElementById('consultorioForm');
  const btnGuardar = document.getElementById('btnGuardar');
  const btnCancelar = document.getElementById('btnCancelar');
  const formTitle = document.getElementById('formTitle');

  let editingId = null;

  // Escuchar edición desde el listado
  eventBus.on('edit-consultorio', (c) => {
    editingId = c.id;
    document.getElementById('nombre_medico').value = c.nombre_medico;
    document.getElementById('consultorio').value = c.consultorio;
    document.getElementById('piso').value = c.piso;
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.style.display = 'inline-block';
    formTitle.textContent = 'Editar Consultorio';
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nombre_medico: document.getElementById('nombre_medico').value,
      consultorio: document.getElementById('consultorio').value,
      piso: document.getElementById('piso').value,
    };
    try {
      if (editingId) {
        await consultorioService.update(editingId, data);
        showToast('Consultorio actualizado');
      } else {
        await consultorioService.create(data);
        showToast('Consultorio creado');
      }
      resetForm();
      // Emitir eventos para actualizar todas las vistas relacionadas
      eventBus.emit('refresh-list');
      eventBus.emit('refresh-pacientes'); // Para actualizar el select de consultorios en pacientes
      eventBus.emit('refresh-turnos'); // Para actualizar el select de consultorios en turnos
      eventBus.emit('refresh-informante'); // Para actualizar la vista de informante
    } catch (err) {
      showToast('Error al guardar');
    }
  });

  btnCancelar.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    editingId = null;
    btnGuardar.textContent = 'Guardar';
    btnCancelar.style.display = 'none';
    formTitle.textContent = 'Nuevo Consultorio';
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
})();
