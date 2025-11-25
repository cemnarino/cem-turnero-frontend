// js/flujosPacientes.js
// Sistema de gestión de flujos de pacientes (Walk-in, Agendar, Check-in)

(() => {
  let flujoActual = 'walkin';
  
  // Inicializar
  function init() {
    try {
      // Verificar que los elementos existen antes de inicializar
      const pacientesView = document.getElementById('pacientes-view');
      if (!pacientesView) {
        console.warn('⚠️ Vista de pacientes no encontrada, omitiendo inicialización de flujos');
        return;
      }
      
      setupFlujoBotones();
      setupWalkinForm();
      setupAgendarForm();
      setupCheckinView();
      
      // Establecer fecha de hoy en check-in
      const hoy = new Date().toISOString().split('T')[0];
      const checkinFecha = document.getElementById('checkin-fecha');
      if (checkinFecha) {
        checkinFecha.value = hoy;
      }
      
      console.log('✅ Sistema de flujos de pacientes inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar flujos de pacientes:', error);
    }
  }
  
  // Configurar botones de selección de flujo
  function setupFlujoBotones() {
    try {
      const botones = document.querySelectorAll('.flujo-btn');
      if (botones.length === 0) {
        console.warn('⚠️ No se encontraron botones de flujo');
        return;
      }
      
      botones.forEach(btn => {
        btn.addEventListener('click', () => {
          const flujo = btn.dataset.flujo;
          cambiarFlujo(flujo);
        });
      });
    } catch (error) {
      console.error('❌ Error en setupFlujoBotones:', error);
    }
  }
  
  // Cambiar entre flujos
  function cambiarFlujo(flujo) {
    // Actualizar botones
    document.querySelectorAll('.flujo-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.flujo === flujo);
    });
    
    // Actualizar formularios
    document.querySelectorAll('.flujo-form').forEach(form => {
      form.classList.toggle('active', form.dataset.flujo === flujo);
    });
    
    flujoActual = flujo;
    
    // Si cambió a check-in, cargar lista
    if (flujo === 'checkin') {
      cargarCitasPendientes();
    }
    
    console.log(`📋 Flujo cambiado a: ${flujo}`);
  }
  
  // ========== BÚSQUEDA POR DOCUMENTO ==========
  function setupDocumentSearch(formId, inputId, btnId, resultsId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputDoc = form.querySelector(`#${inputId}`);
    const btnBuscar = form.querySelector(`#${btnId}`);
    const resultsDiv = form.querySelector(`#${resultsId}`);
    
    if (!inputDoc || !btnBuscar || !resultsDiv) {
      console.warn(`⚠️ No se encontraron elementos para búsqueda en ${formId}`);
      return;
    }
    
    btnBuscar.addEventListener('click', async () => {
      const numeroDoc = inputDoc.value.trim();
      
      if (!numeroDoc || numeroDoc.length < 6) {
        showToast('⚠️ Ingrese un número de documento válido (mínimo 6 caracteres)', 'warning');
        return;
      }
      
      try {
        btnBuscar.disabled = true;
        btnBuscar.innerHTML = '<i class="material-icons rotating">hourglass_empty</i>';
        
        const response = await fetch(`${API_URLS.base}/pacientes/?numero_documento=${numeroDoc}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const pacientes = await response.json();
        
        if (pacientes.length === 0) {
          showToast('ℹ️ No se encontró historial previo. Puede continuar con el registro.', 'info');
          resultsDiv.style.display = 'none';
          return;
        }
        
        // Mostrar resultados
        mostrarResultadosBusqueda(pacientes, resultsDiv, form);
        
      } catch (error) {
        console.error('Error en búsqueda:', error);
        showToast('❌ Error al buscar historial', 'error');
      } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<i class="material-icons">search</i>';
      }
    });
  }
  
  function mostrarResultadosBusqueda(pacientes, resultsDiv, form) {
    // Ordenar por fecha más reciente
    pacientes.sort((a, b) => {
      const fechaA = new Date(a.hora_entrada || a.hora_agendada || 0);
      const fechaB = new Date(b.hora_entrada || b.hora_agendada || 0);
      return fechaB - fechaA;
    });
    
    const ultimoPaciente = pacientes[0];
    
    resultsDiv.innerHTML = `
      <div class="historial-card">
        <div class="historial-header">
          <i class="material-icons">history</i>
          <strong>Historial encontrado (${pacientes.length} registro${pacientes.length > 1 ? 's' : ''})</strong>
        </div>
        <div class="historial-info">
          <p><strong>Último registro:</strong></p>
          <p><i class="material-icons small">person</i> ${ultimoPaciente.primer_nombre} ${ultimoPaciente.segundo_nombre || ''} ${ultimoPaciente.primer_apellido} ${ultimoPaciente.segundo_apellido || ''}</p>
          <p><i class="material-icons small">business</i> ${ultimoPaciente.empresa || 'Sin empresa'}</p>
          <p><i class="material-icons small">phone</i> ${ultimoPaciente.contacto || 'Sin contacto'}</p>
          <p><i class="material-icons small">medical_services</i> ${ultimoPaciente.eps || 'Sin EPS'}</p>
        </div>
        <div class="historial-actions">
          <button type="button" class="btn-usar-datos" onclick="usarDatosHistorial(${ultimoPaciente.id}, '${form.id}')">
            <i class="material-icons">content_copy</i>
            Usar estos datos
          </button>
          <button type="button" class="btn-cerrar-historial" onclick="cerrarHistorial('${resultsDiv.id}')">
            <i class="material-icons">close</i>
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    resultsDiv.style.display = 'block';
  }
  
  // Función global para usar datos del historial
  window.usarDatosHistorial = async function(pacienteId, formId) {
    try {
      const response = await fetch(`${API_URLS.base}/pacientes/${pacienteId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const paciente = await response.json();
      const form = document.getElementById(formId);
      
      if (!form) return;
      
      // Rellenar campos del formulario (excepto hora_agendada y consultorio)
      const camposRellenar = [
        'tipo_documento', 'numero_documento',
        'primer_nombre', 'segundo_nombre',
        'primer_apellido', 'segundo_apellido',
        'contacto', 'eps', 'afp', 'arl',
        'empresa', 'cargo', 'responsable_empresa'
      ];
      
      camposRellenar.forEach(campo => {
        const input = form.querySelector(`[name="${campo}"]`);
        if (input && paciente[campo]) {
          input.value = paciente[campo];
        }
      });
      
      showToast('✅ Datos cargados desde el historial', 'success');
      
      // Cerrar el panel de resultados
      const resultsDiv = form.querySelector('.busqueda-resultados');
      if (resultsDiv) {
        resultsDiv.style.display = 'none';
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('❌ Error al cargar datos del historial', 'error');
    }
  };
  
  // Función global para cerrar historial
  window.cerrarHistorial = function(resultsId) {
    const resultsDiv = document.getElementById(resultsId);
    if (resultsDiv) {
      resultsDiv.style.display = 'none';
    }
  };
  
  // ========== WALK-IN ==========
  function setupWalkinForm() {
    try {
      const form = document.getElementById('walkinForm');
      if (!form) {
        console.warn('⚠️ Formulario walk-in no encontrado');
        return;
      }
      
      // Configurar búsqueda por número de documento
      setupDocumentSearch('walkinForm', 'numero_documento', 'btnBuscarCedula', 'resultadosBusquedaCedula');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Limpiar campos opcionales vacíos
        Object.keys(data).forEach(key => {
          if (data[key] === '' || data[key] === null) {
            data[key] = null;
          }
        });
        
        // Convertir consultorio_id a número
        data.consultorio_id = parseInt(data.consultorio_id);
        
        // Convertir valor a número
        data.valor = parseFloat(data.valor) || 0;
        
        // Verificar si estamos editando
        const editingId = form.dataset.editingId;
        
        if (editingId) {
          // MODO EDICIÓN
          console.log(`✏️ Actualizando paciente ${editingId}:`, data);
          
          try {
            const response = await fetch(`${API_URLS.base}/pacientes/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const paciente = await response.json();
            
            showToast(`✅ Paciente actualizado: ${paciente.primer_nombre} ${paciente.primer_apellido}`, 'success');
            
            // Limpiar modo edición
            delete form.dataset.editingId;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.innerHTML = '<i class="material-icons">person_add</i> Registrar Walk-In';
            }
            
            form.reset();
            
            // Recargar lista de pacientes
            if (typeof eventBus !== 'undefined') {
              eventBus.emit('refresh-pacientes');
            }
          } catch (error) {
            console.error('Error al actualizar:', error);
            showToast('❌ Error al actualizar paciente', 'error');
          }
        } else {
          // MODO CREACIÓN
          console.log('🚶 Registrando walk-in:', data);
          
          try {
            const response = await fetch(`${API_URLS.base}/pacientes/walk-in`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const paciente = await response.json();
            
            showToast(`✅ Turno ${paciente.turno} asignado a ${paciente.primer_nombre} ${paciente.primer_apellido}`, 'success');
            form.reset();
            
            // Recargar lista de pacientes si existe
            if (typeof eventBus !== 'undefined') {
              eventBus.emit('refresh-pacientes');
            }
          } catch (error) {
            console.error('Error en walk-in:', error);
            showToast('❌ Error al registrar paciente walk-in', 'error');
          }
        }
      });
    } catch (error) {
      console.error('❌ Error en setupWalkinForm:', error);
    }
  }
  
  // ========== AGENDAR ==========
  function setupAgendarForm() {
    try {
      const form = document.getElementById('agendarForm');
      if (!form) {
        console.warn('⚠️ Formulario agendar no encontrado');
        return;
      }
      
      // Configurar búsqueda por número de documento
      setupDocumentSearch('agendarForm', 'numero_documento', 'btnBuscarCedulaAgendar', 'resultadosBusquedaCedulaAgendar');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Validar hora_agendada
      if (!data.hora_agendada) {
        showToast('⚠️ Debe seleccionar fecha y hora de la cita', 'warning');
        return;
      }
      
      // Convertir a formato ISO
      data.hora_agendada = new Date(data.hora_agendada).toISOString();
      
      // Limpiar campos opcionales vacíos
      Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === null) {
          data[key] = null;
        }
      });
      
      // Convertir números
      data.consultorio_id = parseInt(data.consultorio_id);
      data.valor = parseFloat(data.valor) || 0;
      
      // Verificar si estamos editando
      const editingId = form.dataset.editingId;
      
      if (editingId) {
        // MODO EDICIÓN
        console.log(`✏️ Actualizando cita ${editingId}:`, data);
        
        try {
          const response = await fetch(`${API_URLS.base}/pacientes/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const paciente = await response.json();
          
          const fechaCita = new Date(paciente.hora_agendada).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
          });
          
          showToast(`✅ Cita actualizada para ${fechaCita}`, 'success');
          
          // Limpiar modo edición
          delete form.dataset.editingId;
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.innerHTML = '<i class="material-icons">event</i> Agendar Cita';
          }
          
          form.reset();
          
          // Recargar lista de pacientes
          if (typeof eventBus !== 'undefined') {
            eventBus.emit('refresh-pacientes');
          }
        } catch (error) {
          console.error('Error al actualizar cita:', error);
          showToast('❌ Error al actualizar cita', 'error');
        }
      } else {
        // MODO CREACIÓN
        console.log('📅 Agendando cita:', data);
        
        try {
          const response = await fetch(`${API_URLS.base}/pacientes/agendar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const paciente = await response.json();
          
          const fechaCita = new Date(paciente.hora_agendada).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
          });
          
          showToast(`✅ Cita agendada para ${fechaCita}`, 'success');
          form.reset();
          
          // Resetear calendario
          if (typeof window.calendarioFunctions !== 'undefined' && window.calendarioFunctions.resetearCalendario) {
            window.calendarioFunctions.resetearCalendario();
          }
        } catch (error) {
          console.error('Error al agendar:', error);
          showToast('❌ Error al agendar cita', 'error');
        }
      }
    });
    } catch (error) {
      console.error('❌ Error en setupAgendarForm:', error);
    }
  }
  
  // ========== CHECK-IN ==========
  function setupCheckinView() {
    try {
      const btnActualizar = document.querySelector('#checkinView button[onclick*="cargarCitasPendientes"]');
      if (btnActualizar) {
        btnActualizar.removeAttribute('onclick');
        btnActualizar.addEventListener('click', cargarCitasPendientes);
      }
      
      const checkinFecha = document.getElementById('checkin-fecha');
      const checkinConsultorio = document.getElementById('checkin-consultorio');
    
    if (checkinFecha) {
      checkinFecha.addEventListener('change', cargarCitasPendientes);
    }
    
    if (checkinConsultorio) {
      checkinConsultorio.addEventListener('change', cargarCitasPendientes);
    }
    } catch (error) {
      console.error('❌ Error en setupCheckinView:', error);
    }
  }
  
  // Cargar citas pendientes de check-in
  window.cargarCitasPendientes = async function() {
    const fecha = document.getElementById('checkin-fecha')?.value || new Date().toISOString().split('T')[0];
    const consultorioId = document.getElementById('checkin-consultorio')?.value || '';
    
    const params = new URLSearchParams({ fecha });
    if (consultorioId) {
      params.append('consultorio_id', consultorioId);
    }
    
    try {
      const response = await fetch(`${API_URLS.base}/pacientes/agendados-pendientes?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      renderCitasPendientes(data.pacientes || []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      showToast('❌ Error al cargar citas pendientes', 'error');
    }
  };
  
  // Renderizar tabla de citas pendientes
  function renderCitasPendientes(pacientes) {
    const table = document.getElementById('checkinTable');
    const tbody = table.querySelector('tbody');
    const emptyState = document.getElementById('checkin-empty');
    
    tbody.innerHTML = '';
    
    if (pacientes.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    pacientes.forEach(p => {
      const tr = document.createElement('tr');
      
      const horaAgendada = p.hora_agendada ? 
        new Date(p.hora_agendada).toLocaleTimeString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 
        'N/A';
      
      const nombreCompleto = [
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido
      ].filter(Boolean).join(' ');
      
      tr.innerHTML = `
        <td><span class="hora-badge">${horaAgendada}</span></td>
        <td><strong>${nombreCompleto}</strong></td>
        <td>${p.numero_documento || p.cedula || 'N/A'}</td>
        <td>${p.empresa || 'N/A'}</td>
        <td>${p.tipo_examen || 'N/A'}</td>
        <td>Consultorio ${p.consultorio_id}</td>
        <td>
          <button class="btn-checkin" onclick="hacerCheckin(${p.id})">
            <i class="material-icons">check_circle</i>
            Check-in
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // Hacer check-in de un paciente
  window.hacerCheckin = async function(pacienteId) {
    if (!confirm('¿Confirmar llegada del paciente?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URLS.base}/pacientes/${pacienteId}/check-in`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      showToast(result.message, 'success');
      
      // Recargar lista
      await cargarCitasPendientes();
      
      // Recargar lista de pacientes si existe
      if (typeof eventBus !== 'undefined') {
        eventBus.emit('refresh-pacientes');
      }
    } catch (error) {
      console.error('Error en check-in:', error);
      showToast('❌ Error al hacer check-in', 'error');
    }
  };
  
  // Abrir calendario (placeholder)
  window.abrirCalendario = function() {
    showToast('📅 Función de calendario en desarrollo', 'info');
    // TODO: Implementar vista de agenda semanal
  };
  
  // Toast helper
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${colors[type] || colors.info};
      color: ${type === 'warning' ? '#000' : '#fff'};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      font-weight: 500;
      max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  // Cargar consultorios en los selects
  async function cargarConsultorios() {
    try {
      const response = await fetch(`${API_URLS.base}/consultorios/`);
      const consultorios = await response.json();
      
      // Llenar selects de walk-in y agendar
      const selects = [
        document.querySelector('#walkinForm select[name="consultorio_id"]'),
        document.querySelector('#agendarForm select[name="consultorio_id"]'),
        document.getElementById('checkin-consultorio')
      ];
      
      selects.forEach(select => {
        if (!select) return;
        
        // Mantener primera opción
        const firstOption = select.querySelector('option');
        select.innerHTML = firstOption ? firstOption.outerHTML : '';
        
        consultorios
          .filter(c => c.is_visible)
          .forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.nombre_medico ? 
              `${c.consultorio} - ${c.nombre_medico}` : 
              c.consultorio;
            select.appendChild(option);
          });
      });
    } catch (error) {
      console.error('Error al cargar consultorios:', error);
    }
  }
  
  // Inicializar solo cuando la pestaña de pacientes está activa
  let yaInicializado = false;
  
  function inicializarSiEsNecesario() {
    // Solo inicializar una vez y si estamos en pacientes
    const pacientesView = document.getElementById('pacientes-view');
    if (!yaInicializado && pacientesView) {
      init();
      cargarConsultorios();
      yaInicializado = true;
      console.log('✅ Flujos de pacientes inicializado');
    }
  }
  
  // Escuchar cambios de pestaña
  if (typeof eventBus !== 'undefined') {
    eventBus.on('tab-changed', (tabId) => {
      if (tabId === 'pacientes-view') {
        inicializarSiEsNecesario();
      }
    });
    
    // También escuchar refresh de pacientes
    eventBus.on('refresh-pacientes', () => {
      inicializarSiEsNecesario();
      if (flujoActual === 'checkin') {
        cargarCitasPendientes();
      }
    });
  }
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Solo si ya estamos en pacientes
      setTimeout(inicializarSiEsNecesario, 100);
    });
  } else {
    // DOM ya está listo
    setTimeout(inicializarSiEsNecesario, 100);
  }
})();
