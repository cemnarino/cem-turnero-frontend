// js/flujosPacientes.js
// Sistema de gestión de flujos de pacientes (Walk-in, Agendar, Check-in)

(() => {
  let flujoActual = 'walkin';
  
  // Inicializar
  function init() {
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
  }
  
  // Configurar botones de selección de flujo
  function setupFlujoBotones() {
    const botones = document.querySelectorAll('.flujo-btn');
    
    botones.forEach(btn => {
      btn.addEventListener('click', () => {
        const flujo = btn.dataset.flujo;
        cambiarFlujo(flujo);
      });
    });
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
  
  // ========== WALK-IN ==========
  function setupWalkinForm() {
    const form = document.getElementById('walkinForm');
    if (!form) return;
    
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
    });
  }
  
  // ========== AGENDAR ==========
  function setupAgendarForm() {
    const form = document.getElementById('agendarForm');
    if (!form) return;
    
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
      } catch (error) {
        console.error('Error al agendar:', error);
        showToast('❌ Error al agendar cita', 'error');
      }
    });
  }
  
  // ========== CHECK-IN ==========
  function setupCheckinView() {
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
            option.textContent = `${c.consultorio} - ${c.nombre_medico}`;
            select.appendChild(option);
          });
      });
    } catch (error) {
      console.error('Error al cargar consultorios:', error);
    }
  }
  
  // Inicializar solo cuando se activa la pestaña de pacientes
  function inicializarCuandoSeaNecesario() {
    // Solo inicializar si estamos en la vista de pacientes
    const pacientesView = document.getElementById('pacientes-view');
    if (pacientesView && pacientesView.classList.contains('active')) {
      init();
      cargarConsultorios();
    }
  }
  
  // Escuchar evento de cambio de pestaña
  if (typeof eventBus !== 'undefined') {
    eventBus.on('tab-changed', (tabId) => {
      if (tabId === 'pacientes-view') {
        inicializarCuandoSeaNecesario();
      }
    });
  }
  
  // También inicializar si ya estamos en la pestaña al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCuandoSeaNecesario);
  } else {
    inicializarCuandoSeaNecesario();
  }
  
  // Escuchar evento de cambio de vista
  if (typeof eventBus !== 'undefined') {
    eventBus.on('view-changed', (viewId) => {
      if (viewId === 'pacientes-view') {
        cargarConsultorios();
        if (flujoActual === 'checkin') {
          cargarCitasPendientes();
        }
      }
    });
  }
})();
