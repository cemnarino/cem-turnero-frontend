// js/turnosPage.js

(() => {
  const consultorioSelect = document.getElementById('turnoConsultorioSelect');
  const panel = document.getElementById('turnoPanel');
  const noConsultorio = document.getElementById('noConsultorio');
  const turnoNum = document.getElementById('turnoActualNum');
  const tablaEspera = document.getElementById('tablaEspera');
  const noEspera = document.getElementById('noEspera');

  let consultorios = [];
  let turnoActual = {};
  let selectedConsultorioId = null; // Consultorio actualmente seleccionado
  let isPageActive = false; // Flag para controlar si la página está activa

  function safeArray(data) {
    return Array.isArray(data) ? data : [];
  }

  /**
   * Carga la lista de consultorios disponibles
   */
  async function loadConsultorios() {
    try {
      const list = safeArray(await consultorioService.list());
      consultorios = list.filter((c) => c.is_visible);
      consultorioSelect.innerHTML = '<option value="">Seleccione...</option>';
      consultorios.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.consultorio} - ${c.nombre_medico}`;
        consultorioSelect.appendChild(opt);
      });
    } catch (error) {
      console.error('Error cargando consultorios:', error);
    }
  }

  /**
   * Muestra información del consultorio seleccionado
   */
  async function showConsultorio(consultorioId) {
    if (!consultorioId) {
      panel.style.display = 'none';
      noConsultorio.style.display = 'block';
      disconnectFromCurrentRoom();
      selectedConsultorioId = null;
      return;
    }
    
    panel.style.display = 'block';
    noConsultorio.style.display = 'none';
    selectedConsultorioId = consultorioId;

    // Conectar a la sala de WebSocket correspondiente
    connectToConsultorioRoom(consultorioId);
    
    // Conectar también a notificaciones si aún no está conectado
    connectToNotifications();

    try {
      // Cargar turno actual
      const t = await turnoService.getCurrentTurn(consultorioId);
      turnoActual[consultorioId] = t.turn;
      turnoNum.textContent = t.turn || 0;

      // Cargar pacientes en espera
      const all = await turnoService.getPacientesEnEspera(consultorioId);
      const filtered = all.filter((p) => !p.atendido && p.turno !== t.turn);
      renderPacientes(filtered);
    } catch (error) {
      console.error('Error cargando datos del consultorio:', error);
    }
  }

  /**
   * Conecta a la sala de WebSocket del consultorio
   */
  function connectToConsultorioRoom(consultorioId) {
    // Desconectar de sala anterior si existe
    disconnectFromCurrentRoom();
    
    // Determinar la sala según el ID del consultorio (1, 2, o 3)
    let roomName;
    if (consultorioId >= 1 && consultorioId <= 3) {
      roomName = `consultorio_${consultorioId}`;
    } else {
      console.warn(`Consultorio ID ${consultorioId} no está en el rango de salas configuradas (1-3)`);
      return;
    }

    // Conectar usando el WebSocketManager
    window.wsManager.connect(roomName, handleConsultorioMessage, handleWebSocketError);
    
    console.log(`Conectado a sala ${roomName} para consultorio ${consultorioId}`);
  }

  /**
   * Conecta a la sala de notificaciones generales
   */
  function connectToNotifications() {
    window.wsManager.connect('notifications', handleNotificationMessage, handleWebSocketError);
  }

  /**
   * Desconecta de la sala actual del consultorio
   */
  function disconnectFromCurrentRoom() {
    if (selectedConsultorioId) {
      const roomName = `consultorio_${selectedConsultorioId}`;
      window.wsManager.disconnect(roomName);
    }
  }

  /**
   * Desconecta de todas las salas
   */
  function disconnectFromAllRooms() {
    disconnectFromCurrentRoom();
    window.wsManager.disconnect('notifications');
  }

  /**
   * Maneja mensajes de WebSocket del consultorio
   */
  function handleConsultorioMessage(message, roomName) {
    if (!isPageActive || !selectedConsultorioId) return;

    try {
      let msg = message;
      if (typeof message === 'string') {
        try {
          msg = JSON.parse(message);
        } catch (e) {
          // Mensaje de texto simple
          msg = { action: message };
        }
      }

      // Procesar según el tipo de mensaje
      if (msg.action === 'new_patient') {
        handleNewPatientMessage(msg.paciente || {});
      } else if (msg.action === 'turn_changed') {
        handleTurnChangeMessage();
      } else if (msg.action === 'patient_update') {
        handlePatientUpdateMessage();
      }
    } catch (error) {
      console.error('Error procesando mensaje del consultorio:', error);
    }
  }

  /**
   * Maneja mensajes de la sala de notificaciones
   */
  function handleNotificationMessage(message, roomName) {
    if (!isPageActive) return;

    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;
      
      if (msg.type === 'new_patient' && selectedConsultorioId) {
        const patient = msg.patient;
        
        // Solo procesar si es para el consultorio seleccionado
        if (patient && patient.consultorio_id == selectedConsultorioId) {
          handleNewPatientMessage(patient);
        }
      } else if (msg.type === 'system_update') {
        // Actualizar datos cuando hay cambios en el sistema
        updatePatientsList();
      }
    } catch (error) {
      console.error('Error procesando notificación:', error);
    }
  }

  /**
   * Maneja errores de WebSocket
   */
  function handleWebSocketError(error, roomName) {
    console.error(`Error en WebSocket ${roomName}:`, error);
    
    // Podríamos implementar lógica de retry o fallback aquí
    showToast(`Error de conexión en ${roomName}`, 'error');
  }

  /**
   * Maneja mensaje de nuevo paciente
   */
  function handleNewPatientMessage(paciente = {}) {
    if (!selectedConsultorioId) return;

    // Solo mostrar notificación si estamos en la pestaña de turnos
    // y el paciente es para el consultorio seleccionado
    if (paciente.consultorio_id == selectedConsultorioId) {
      showNewPatientNotification(paciente);
      playNotificationSound();
      // Actualizar la lista de pacientes
      updatePatientsList();
    }
  }

  /**
   * Maneja mensaje de cambio de turno
   */
  function handleTurnChangeMessage() {
    // Actualizar información del turno
    updatePatientsList();
  }

  /**
   * Maneja mensaje de actualización de paciente
   */
  function handlePatientUpdateMessage() {
    // Actualizar lista de pacientes
    updatePatientsList();
  }

  /**
   * Actualizar lista de pacientes silenciosamente
   */
  async function updatePatientsList() {
    if (!selectedConsultorioId || !isPageActive) return;

    try {
      const t = await turnoService.getCurrentTurn(selectedConsultorioId);
      turnoNum.textContent = t.turn || 0;

      const all = await turnoService.getPacientesEnEspera(selectedConsultorioId);
      const filtered = all.filter((p) => !p.atendido && p.turno !== t.turn);
      renderPacientes(filtered);
    } catch (error) {
      console.error('Error updating patients list:', error);
    }
  }

  /**
   * Mostrar notificación emergente
   */
  function showNewPatientNotification(paciente = {}) {
    const nombrePaciente =
      paciente && Object.keys(paciente).length > 0
        ? pacienteService.getNombreCompleto(paciente)
        : 'Nuevo paciente';

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'patient-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🔔</div>
        <div class="notification-text">
          <strong>Nuevo paciente asignado</strong>
          <br>${nombrePaciente}
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .patient-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #fff;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
          max-width: 300px;
        }
        .notification-content {
          display: flex;
          align-items: center;
          padding: 12px;
          gap: 12px;
        }
        .notification-icon {
          font-size: 24px;
          color: #3b82f6;
        }
        .notification-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-close:hover {
          background: #f0f0f0;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    // Agregar al DOM
    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Reproducir sonido de notificación
   */
  function playNotificationSound() {
    try {
      const audio = new Audio('assets/notification_sound.mp3');
      audio.volume = 0.7; // Volumen al 70%
      audio
        .play()
        .catch((e) =>
          console.log('No se pudo reproducir audio de notificación:', e)
        );
    } catch (e) {
      console.log('Error cargando audio de notificación:', e);
    }
  }

  /**
   * Renderiza la lista de pacientes en espera
   */
  function renderPacientes(list) {
    const tbody = tablaEspera.querySelector('tbody');
    tbody.innerHTML = '';
    noEspera.style.display = list.length ? 'none' : 'block';
    list.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.turno || '—'}</td>
        <td>${pacienteService.getNombreCompleto(p)}</td>
        <td>${p.cedula}</td>
        <td>${p.tipo_examen}</td>
        <td>${new Date(p.hora_entrada).toLocaleString('es-CO')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Muestra un mensaje toast
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Estilos básicos para toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10001',
      animation: 'fadeInOut 3s ease-in-out'
    });

    if (type === 'error') {
      toast.style.background = '#ef4444';
    } else {
      toast.style.background = '#22c55e';
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Event Listeners para botones
  
  /**
   * Botón Siguiente Turno con confirmación
   */
  document.getElementById('btnSiguiente').addEventListener('click', async () => {
    const id = consultorioSelect.value;
    if (!id) return;

    if (confirm('¿Desea pasar al siguiente paciente?')) {
      try {
        await turnoService.nextTurn(id);
        await showConsultorio(id);

        // Notificar cambio de turno a través de WebSocket
        notifyTurnChange(id);

        // Actualizar otras vistas que pueden verse afectadas
        eventBus.emit('refresh-pacientes');
        eventBus.emit('refresh-historial');
        eventBus.emit('refresh-informante');
        
        showToast('Turno avanzado correctamente');
      } catch (error) {
        console.error('Error al avanzar turno:', error);
        showToast('Error al avanzar turno', 'error');
      }
    }
  });

  /**
   * Botón Volver a Anunciar
   */
  document.getElementById('btnReiniciar').addEventListener('click', () => {
    const id = consultorioSelect.value;
    if (!id) return;
    
    // Enviar mensaje de replay usando el WebSocketManager
    const roomName = `consultorio_${id}`;
    const sent = window.wsManager.send(roomName, 'replay');
    
    if (sent) {
      showToast('Anuncio reenviado');
    } else {
      showToast('Error al enviar anuncio', 'error');
    }
  });

  /**
   * Función para notificar cambio de turno
   */
  function notifyTurnChange(consultorioId) {
    const roomName = `consultorio_${consultorioId}`;
    const message = {
      action: 'turn_changed',
      consultorio_id: consultorioId,
      timestamp: new Date().toISOString(),
      playAudio: true
    };
    
    window.wsManager.send(roomName, message);
  }

  /**
   * Cambio de consultorio
   */
  consultorioSelect.addEventListener('change', () => {
    const selectedId = consultorioSelect.value;
    showConsultorio(selectedId);
  });

  /**
   * Activar página de turnos
   */
  function activateTurnosPage() {
    isPageActive = true;
    
    // Conectar a notificaciones si hay un consultorio seleccionado
    if (selectedConsultorioId) {
      connectToConsultorioRoom(selectedConsultorioId);
    }
    connectToNotifications();
    
    console.log('✅ Página de turnos activada');
  }

  /**
   * Desactivar página de turnos
   */
  function deactivateTurnosPage() {
    isPageActive = false;
    
    // Desconectar de todas las salas
    disconnectFromAllRooms();
    
    console.log('❌ Página de turnos desactivada');
  }

  // Escuchar eventos de actualización
  eventBus.on('refresh-turnos', () => {
    loadConsultorios();
    // Si hay un consultorio seleccionado, actualizarlo también
    const selectedId = consultorioSelect.value;
    if (selectedId && isPageActive) {
      showConsultorio(selectedId);
    }
  });

  // Escuchar cambios de pestaña
  eventBus.on('tab-changed', (newTab) => {
    if (newTab === 'turnos-view') {
      activateTurnosPage();
    } else if (isPageActive) {
      deactivateTurnosPage();
    }
  });

  // Primera carga
  loadConsultorios();

  // Limpiar WebSockets al salir de la página
  window.addEventListener('beforeunload', () => {
    deactivateTurnosPage();
  });

  // Manejar visibilidad de página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isPageActive) {
      // Página oculta - pausar actividad pero mantener conexiones
      console.log('Página oculta - pausando actividad de turnos');
    } else if (!document.hidden && isPageActive) {
      // Página visible - reanudar actividad
      console.log('Página visible - reanudando actividad de turnos');
      if (selectedConsultorioId) {
        updatePatientsList();
      }
    }
  });

})();
