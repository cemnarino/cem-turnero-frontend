// js/pacienteSearch.js
// Funcionalidad de búsqueda y edición de pacientes

// Buscar paciente por número de documento en formulario Walk-in
async function buscarPacienteWalkin() {
  const numeroDoc = document.getElementById('walkin-numero-documento').value.trim();
  
  if (!numeroDoc) {
    alert('Por favor ingrese un número de documento');
    return;
  }
  
  try {
    console.log(`🔍 Buscando paciente con documento: ${numeroDoc}`);
    const pacientes = await pacienteService.list();
    const paciente = pacientes.find(p => p.numero_documento === numeroDoc || p.cedula === numeroDoc);
    
    if (paciente) {
      console.log('✅ Paciente encontrado:', paciente);
      rellenarFormularioWalkin(paciente);
      alert(`Paciente encontrado: ${pacienteService.getNombreCompleto(paciente)}\nDatos cargados en el formulario`);
    } else {
      alert('No se encontró ningún paciente con ese número de documento.\nPuede continuar registrando un nuevo paciente.');
    }
  } catch (error) {
    console.error('❌ Error al buscar paciente:', error);
    alert('Error al buscar el paciente. Por favor intente nuevamente.');
  }
}

// Buscar paciente por número de documento en formulario Agendar
async function buscarPacienteAgendar() {
  const numeroDoc = document.getElementById('agendar-numero-documento').value.trim();
  
  if (!numeroDoc) {
    alert('Por favor ingrese un número de documento');
    return;
  }
  
  try {
    console.log(`🔍 Buscando paciente con documento: ${numeroDoc}`);
    const pacientes = await pacienteService.list();
    const paciente = pacientes.find(p => p.numero_documento === numeroDoc || p.cedula === numeroDoc);
    
    if (paciente) {
      console.log('✅ Paciente encontrado:', paciente);
      rellenarFormularioAgendar(paciente);
      alert(`Paciente encontrado: ${pacienteService.getNombreCompleto(paciente)}\nDatos cargados en el formulario`);
    } else {
      alert('No se encontró ningún paciente con ese número de documento.\nPuede continuar registrando un nuevo paciente.');
    }
  } catch (error) {
    console.error('❌ Error al buscar paciente:', error);
    alert('Error al buscar el paciente. Por favor intente nuevamente.');
  }
}

// Rellenar formulario Walk-in con datos del paciente
function rellenarFormularioWalkin(paciente) {
  const form = document.getElementById('walkinForm');
  if (!form) return;
  
  // Datos básicos
  form.querySelector('[name="numero_documento"]').value = paciente.numero_documento || paciente.cedula || '';
  form.querySelector('[name="tipo_documento"]').value = paciente.tipo_documento || 'CEDULA';
  form.querySelector('[name="primer_nombre"]').value = paciente.primer_nombre || '';
  form.querySelector('[name="segundo_nombre"]').value = paciente.segundo_nombre || '';
  form.querySelector('[name="primer_apellido"]').value = paciente.primer_apellido || '';
  form.querySelector('[name="segundo_apellido"]').value = paciente.segundo_apellido || '';
  form.querySelector('[name="contacto"]').value = paciente.contacto || '';
  
  // Información de salud
  form.querySelector('[name="eps"]').value = paciente.eps || '';
  form.querySelector('[name="afp"]').value = paciente.afp || '';
  form.querySelector('[name="arl"]').value = paciente.arl || '';
  
  // Información laboral
  form.querySelector('[name="empresa"]').value = paciente.empresa || '';
  form.querySelector('[name="cargo"]').value = paciente.cargo || '';
  form.querySelector('[name="responsable_empresa"]').value = paciente.responsable_empresa || '';
  
  // Tipo de examen y observaciones
  const tipoExamenSelect = form.querySelector('[name="tipo_examen"]');
  if (tipoExamenSelect && paciente.tipo_examen) {
    tipoExamenSelect.value = paciente.tipo_examen;
  }
  form.querySelector('[name="observacion"]').value = paciente.observacion || '';
  
  // Valor y consultorio
  form.querySelector('[name="valor"]').value = paciente.valor || 0;
  const consultorioSelect = form.querySelector('[name="consultorio_id"]');
  if (consultorioSelect && paciente.consultorio_id) {
    consultorioSelect.value = paciente.consultorio_id;
  }
}

// Rellenar formulario Agendar con datos del paciente
function rellenarFormularioAgendar(paciente) {
  const form = document.getElementById('agendarForm');
  if (!form) return;
  
  // Datos básicos
  form.querySelector('[name="numero_documento"]').value = paciente.numero_documento || paciente.cedula || '';
  form.querySelector('[name="tipo_documento"]').value = paciente.tipo_documento || 'CEDULA';
  form.querySelector('[name="primer_nombre"]').value = paciente.primer_nombre || '';
  form.querySelector('[name="segundo_nombre"]').value = paciente.segundo_nombre || '';
  form.querySelector('[name="primer_apellido"]').value = paciente.primer_apellido || '';
  form.querySelector('[name="segundo_apellido"]').value = paciente.segundo_apellido || '';
  form.querySelector('[name="contacto"]').value = paciente.contacto || '';
  
  // Información de salud
  form.querySelector('[name="eps"]').value = paciente.eps || '';
  form.querySelector('[name="afp"]').value = paciente.afp || '';
  form.querySelector('[name="arl"]').value = paciente.arl || '';
  
  // Información laboral
  form.querySelector('[name="empresa"]').value = paciente.empresa || '';
  form.querySelector('[name="cargo"]').value = paciente.cargo || '';
  form.querySelector('[name="responsable_empresa"]').value = paciente.responsable_empresa || '';
  
  // Tipo de examen y observaciones
  const tipoExamenSelect = form.querySelector('[name="tipo_examen"]');
  if (tipoExamenSelect && paciente.tipo_examen) {
    tipoExamenSelect.value = paciente.tipo_examen;
  }
  form.querySelector('[name="observacion"]').value = paciente.observacion || '';
  
  // Valor y consultorio
  form.querySelector('[name="valor"]').value = paciente.valor || 0;
  const consultorioSelect = form.querySelector('[name="consultorio_id"]');
  if (consultorioSelect && paciente.consultorio_id) {
    consultorioSelect.value = paciente.consultorio_id;
  }
  
  // NO rellenamos hora_agendada porque es una nueva cita
}

// Editar paciente existente
async function editPac(id) {
  try {
    console.log(`✏️ Editando paciente ID: ${id}`);
    
    // Obtener datos del paciente
    const paciente = await pacienteService.getById(id);
    if (!paciente) {
      alert('No se pudo cargar la información del paciente');
      return;
    }
    
    console.log('📋 Paciente cargado:', paciente);
    
    // Determinar qué formulario usar según el tipo de cita
    let flujo = 'walkin';
    if (paciente.hora_agendada && !paciente.checked_in) {
      // Es una cita agendada que aún no ha hecho check-in
      flujo = 'agendar';
    }
    
    // Cambiar a la vista de pacientes y el flujo correcto
    if (window.navigateTo) {
      window.navigateTo('pacientes');
    }
    
    // Esperar un momento para que se cargue la vista
    setTimeout(() => {
      // Cambiar al flujo correcto
      const flujoBtn = document.querySelector(`[data-flujo="${flujo}"]`);
      if (flujoBtn) {
        flujoBtn.click();
      }
      
      // Esperar otro momento para que se muestre el formulario
      setTimeout(() => {
        // Rellenar el formulario correspondiente
        if (flujo === 'walkin') {
          rellenarFormularioWalkin(paciente);
          // Guardar ID para actualización
          const form = document.getElementById('walkinForm');
          if (form) {
            form.dataset.editingId = id;
            // Cambiar texto del botón
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.innerHTML = '<i class="material-icons">save</i> Actualizar Paciente';
            }
          }
        } else {
          rellenarFormularioAgendar(paciente);
          // Obtener el formulario de agendar
          const form = document.getElementById('agendarForm');
          if (form) {
            // Rellenar también la fecha agendada
            const horaAgendada = form.querySelector('[name="hora_agendada"]');
            if (horaAgendada && paciente.hora_agendada) {
              // Convertir a formato datetime-local
              const fecha = new Date(paciente.hora_agendada);
              const año = fecha.getFullYear();
              const mes = String(fecha.getMonth() + 1).padStart(2, '0');
              const dia = String(fecha.getDate()).padStart(2, '0');
              const horas = String(fecha.getHours()).padStart(2, '0');
              const minutos = String(fecha.getMinutes()).padStart(2, '0');
              horaAgendada.value = `${año}-${mes}-${dia}T${horas}:${minutos}`;
            }
            // Guardar ID para actualización
            form.dataset.editingId = id;
            // Cambiar texto del botón
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.innerHTML = '<i class="material-icons">save</i> Actualizar Cita';
            }
          }
        }
        
        alert(`Editando: ${pacienteService.getNombreCompleto(paciente)}\nModifique los campos necesarios y guarde los cambios.`);
      }, 300);
    }, 200);
    
  } catch (error) {
    console.error('❌ Error al editar paciente:', error);
    alert('Error al cargar los datos del paciente para edición.');
  }
}

console.log('✅ Módulo de búsqueda y edición de pacientes cargado');
