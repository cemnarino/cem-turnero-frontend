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
      nombre_medico: document.getElementById('nombre_medico').value.trim(),
      consultorio: document.getElementById('consultorio').value,
      piso: document.getElementById('piso').value,
    };
    
    // Validaciones
    if (!data.consultorio) {
      showToast('Debe seleccionar un consultorio', 'error');
      return;
    }
    
    if (!data.nombre_medico) {
      showToast('Debe ingresar el nombre del médico', 'error');
      return;
    }
    
    if (!data.piso) {
      showToast('Debe seleccionar un piso', 'error');
      return;
    }
    
    try {
      // Si no está editando, verificar que no exista el consultorio
      if (!editingId) {
        const existing = await consultorioService.list();
        const duplicate = existing.find(
          (c) => c.consultorio === data.consultorio && c.is_visible
        );
        
        if (duplicate) {
          showToast(
            `El ${data.consultorio} ya existe. Use "Editar" si desea modificarlo.`,
            'warning'
          );
          return;
        }
      }
      
      if (editingId) {
        await consultorioService.update(editingId, data);
        showToast('Consultorio actualizado exitosamente', 'success');
      } else {
        await consultorioService.create(data);
        showToast('Consultorio creado exitosamente', 'success');
      }
      resetForm();
      // Emitir eventos para actualizar todas las vistas relacionadas
      eventBus.emit('refresh-list');
      eventBus.emit('refresh-pacientes'); // Para actualizar el select de consultorios en pacientes
      eventBus.emit('refresh-turnos'); // Para actualizar el select de consultorios en turnos
      eventBus.emit('refresh-informante'); // Para actualizar la vista de informante
    } catch (err) {
      console.error('Error al guardar consultorio:', err);
      showToast('Error al guardar consultorio', 'error');
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

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    
    // Estilos según el tipo
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
    };
    
    t.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: ${type === 'warning' ? '#000' : '#fff'};
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      font-weight: 500;
    `;
    
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }
})();
