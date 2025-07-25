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
   * Carga la lista de consultorio  /**
   * Activa la página de turnos
   */
  function activateTurnosPage() {
    isPageActive = true;

    // Conectar a notificaciones si hay un consultorio seleccionado
    if (selectedConsultorioId) {
      connectToConsultorioRoom(selectedConsultorioId);
    }
    connectToNotifications();

    // Agregar indicador de conexión WebSocket
    addConnectionStatusIndicator();

    console.log('✅ Página de turnos activada');
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

    // Usar el ID directamente como nombre de sala (coincide con backend)
    const roomName = String(consultorioId);

    if (consultorioId >= 1 && consultorioId <= 3) {
      // Conectar usando el WebSocketManager
      window.wsManager.connect(
        roomName,
        handleConsultorioMessage,
        handleWebSocketError
      );

      console.log(
        `Conectado a sala ${roomName} para consultorio ${consultorioId}`
      );
    } else {
      console.warn(
        `Consultorio ID ${consultorioId} no está en el rango de salas configuradas (1-3)`
      );
    }
  }

  /**
   * Conecta a la sala de notificaciones generales
   */
  function connectToNotifications() {
    window.wsManager.connect(
      'notifications',
      handleNotificationMessage,
      handleWebSocketError
    );
  }

  /**
   * Desconecta de la sala actual del consultorio
   */
  function disconnectFromCurrentRoom() {
    if (selectedConsultorioId) {
      const roomName = String(selectedConsultorioId);
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

      console.log(`📨 Mensaje del consultorio ${roomName}:`, msg);

      // Procesar según el tipo de mensaje
      if (msg.action === 'new_patient') {
        console.log('🆕 Nuevo paciente detectado desde sala del consultorio');
        // Solo procesar si la sala coincide con el consultorio seleccionado
        if (parseInt(roomName, 10) === selectedConsultorioId) {
          handleNewPatientMessage(msg.patient || {});
        } else {
          console.log(
            `⚠️ Mensaje de sala ${roomName} pero consultorio seleccionado es ${selectedConsultorioId} - IGNORANDO`
          );
        }
      } else if (msg.action === 'turn_changed') {
        handleTurnChangeMessage();
      } else if (msg.action === 'patient_update') {
        handlePatientUpdateMessage();
      } else if (msg.action === 'audio_ready') {
        // Audio listo para reproducir, no necesitamos hacer nada aquí
        console.log('Audio listo para consultorio:', msg.consultorio_id);
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
      console.log('📢 Notificación recibida en Turnos:', msg);

      // Corregir: el backend envía 'action', no 'type'
      if (msg.action === 'new_patient' && selectedConsultorioId) {
        const patient = msg.patient;

        // Extraer consultorio del turno_label para comparación correcta
        let consultorioIdPaciente = patient?.consultorio_id;

        if (!consultorioIdPaciente && patient?.turno_label) {
          const match = patient.turno_label.match(/Consultorio (\d+)/);
          if (match) {
            consultorioIdPaciente = parseInt(match[1], 10);
          }
        }

        console.log(
          `📢 Notification: paciente para consultorio ${consultorioIdPaciente}, seleccionado: ${selectedConsultorioId}`
        );

        // Solo procesar si es para el consultorio seleccionado
        if (patient && consultorioIdPaciente == selectedConsultorioId) {
          console.log(
            `🆕 Nuevo paciente para consultorio ${selectedConsultorioId}:`,
            patient
          );
          handleNewPatientMessage(patient);
        } else {
          console.log(
            `📢 Ignorando notificación - no es para consultorio ${selectedConsultorioId}`
          );
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
  /**
   * Maneja el mensaje de nuevo paciente
   */
  function handleNewPatientMessage(paciente = {}) {
    console.log('🔔 handleNewPatientMessage llamado con:', paciente);
    console.log('🎯 selectedConsultorioId actual:', selectedConsultorioId);
    console.log('🔍 consultorio_id del paciente:', paciente.consultorio_id);
    console.log(
      '🔍 Todas las propiedades del paciente:',
      Object.keys(paciente)
    );

    if (!selectedConsultorioId) {
      console.log('⚠️ No hay consultorio seleccionado, ignorando notificación');
      return;
    }

    // IMPORTANTE: Extraer consultorio_id del turno_label como alternativa
    let consultorioIdPaciente = paciente.consultorio_id;

    if (!consultorioIdPaciente && paciente.turno_label) {
      // Extraer del formato "Consultorio 3-08" -> consultorio 3
      const match = paciente.turno_label.match(/Consultorio (\d+)/);
      if (match) {
        consultorioIdPaciente = parseInt(match[1], 10);
        console.log(
          `🔍 Consultorio extraído del turno_label: ${consultorioIdPaciente}`
        );
      }
    }

    // Si aún no tenemos consultorio_id, usar selectedConsultorioId como último recurso
    // SOLO si el mensaje llegó por la sala específica del consultorio
    if (!consultorioIdPaciente) {
      console.log(
        '⚠️ consultorio_id no definido, usando selectedConsultorioId como fallback'
      );
      consultorioIdPaciente = selectedConsultorioId;
    }

    console.log(
      `🎯 Comparando: paciente consultorio ${consultorioIdPaciente} vs seleccionado ${selectedConsultorioId}`
    );

    // Solo mostrar notificación si es para el consultorio seleccionado
    if (consultorioIdPaciente == selectedConsultorioId) {
      console.log('✅ Mostrando notificación de nuevo paciente');
      showNewPatientNotification(paciente);
      playNotificationSound();
      // Actualizar la lista de pacientes
      updatePatientsList();
    } else {
      console.log(
        `⚠️ Paciente para consultorio ${consultorioIdPaciente}, pero seleccionado es ${selectedConsultorioId} - IGNORANDO`
      );
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

      const all = await turnoService.getPacientesEnEspera(
        selectedConsultorioId
      );
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
    console.log('📝 Mostrando notificación para paciente:', paciente);

    // El backend envía el nombre completo en la propiedad 'nombre'
    const nombrePaciente = paciente.nombre || 'Nuevo paciente';
    const turnoInfo =
      paciente.turno_label || `Turno ${paciente.turno}` || '---';

    console.log(`📝 Nombre: "${nombrePaciente}", Turno: "${turnoInfo}"`);

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'patient-notification';

    // Crear contenido de forma más explícita
    const content = document.createElement('div');
    content.className = 'notification-content';

    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.textContent = '✅';

    const textDiv = document.createElement('div');
    textDiv.className = 'notification-text';

    const title = document.createElement('strong');
    title.textContent = 'Nuevo paciente asignado';

    const nameDiv = document.createElement('div');
    nameDiv.textContent = nombrePaciente;

    const turnoDiv = document.createElement('small');
    turnoDiv.textContent = turnoInfo;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => removeNotification(notification);

    // Ensamblar la notificación
    textDiv.appendChild(title);
    textDiv.appendChild(document.createElement('br'));
    textDiv.appendChild(nameDiv);
    textDiv.appendChild(document.createElement('br'));
    textDiv.appendChild(turnoDiv);

    content.appendChild(icon);
    content.appendChild(textDiv);
    content.appendChild(closeBtn);

    notification.appendChild(content);

    // Agregar estilos si no existen
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .patient-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          border: 2px solid #28a745;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.2), 0 4px 10px rgba(0, 0, 0, 0.1);
          z-index: 10000;
          animation: slideInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          max-width: 350px;
          min-width: 280px;
          overflow: hidden;
        }
        
        .patient-notification::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #28a745, #20c997, #28a745);
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .notification-content {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
          position: relative;
        }
        
        .notification-icon {
          font-size: 28px;
          background: #28a745;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
        }
        
        .notification-text {
          flex: 1;
          color: #1e4620;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .notification-text strong {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #155724;
          margin-bottom: 4px;
        }
        
        .notification-text div {
          font-size: 14px;
          color: #1e4620;
          margin: 2px 0;
        }
        
        .notification-text small {
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }
        
        .notification-close {
          background: rgba(255, 255, 255, 0.8);
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .notification-close:hover {
          background: #fff;
          color: #dc3545;
          transform: scale(1.1);
        }
        
        @keyframes slideInBounce {
          0% { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
          50% { 
            transform: translateX(-10px) scale(1.05); 
            opacity: 0.8; 
          }
          100% { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        /* Animación de salida */
        .patient-notification.removing {
          animation: slideOut 0.3s ease-in-out forwards;
        }
        
        @keyframes slideOut {
          from { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
          to { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Agregar al DOM
    document.body.appendChild(notification);

    // Función para remover con animación
    function removeNotification(notificationElement) {
      if (notificationElement.parentElement) {
        notificationElement.classList.add('removing');
        setTimeout(() => {
          if (notificationElement.parentElement) {
            notificationElement.remove();
          }
        }, 300); // Duración de la animación de salida
      }
    }

    // Auto-remover después de 6 segundos
    setTimeout(() => {
      removeNotification(notification);
    }, 6000);
  }

  /**
   * Reproducir sonido de notificación
   */
  function playNotificationSound() {
    console.log('🔊 Intentando reproducir sonido de notificación...');
    try {
      const audio = new Audio('assets/notification_sound.mp3');
      audio.volume = 0.7; // Volumen al 70%

      // Agregar listeners para debug
      audio.addEventListener('loadstart', () =>
        console.log('🔊 Audio: carga iniciada')
      );
      audio.addEventListener('canplay', () =>
        console.log('🔊 Audio: listo para reproducir')
      );
      audio.addEventListener('play', () =>
        console.log('🔊 Audio: reproducción iniciada')
      );
      audio.addEventListener('ended', () =>
        console.log('🔊 Audio: reproducción terminada')
      );

      audio
        .play()
        .then(() => {
          console.log('✅ Audio de notificación reproducido exitosamente');
        })
        .catch((e) => {
          console.error('❌ No se pudo reproducir audio de notificación:', e);
        });
    } catch (e) {
      console.error('❌ Error cargando audio de notificación:', e);
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
      animation: 'fadeInOut 3s ease-in-out',
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
  document
    .getElementById('btnSiguiente')
    .addEventListener('click', async () => {
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
  document
    .getElementById('btnReiniciar')
    .addEventListener('click', async () => {
      const id = consultorioSelect.value;
      if (!id) return;

      const roomName = String(id);
      const message = {
        action: 'replay',
        consultorio_id: parseInt(id, 10),
        timestamp: new Date().toISOString(),
      };

      console.log(`📡 Enviando replay a sala ${roomName}:`, message);

      // Verificar estado de la conexión primero
      const wsStats = window.wsManager.getStats();
      const roomStat = wsStats[roomName];

      if (!roomStat || roomStat.state !== 'CONNECTED') {
        console.warn(
          `⚠️ Conexión no disponible para sala ${roomName}. Estado:`,
          roomStat?.state || 'desconectado'
        );
        showToast(
          'Reconectando... Intente nuevamente en unos segundos',
          'info'
        );

        // Intentar reconectar si hay un consultorio seleccionado
        if (selectedConsultorioId) {
          connectToConsultorioRoom(selectedConsultorioId);
        }
        return;
      }

      // Enviar mensaje a la sala específica del consultorio
      const sent = window.wsManager.send(roomName, message);

      // IMPORTANTE: También enviar a la sala de notificaciones para asegurar que llegue al informante
      const sentToNotifications = window.wsManager.send('notifications', {
        ...message,
        target_room: roomName, // Indicar de qué consultorio viene
        action: 'replay',
        consultorio_id: parseInt(id, 10),
      });

      if (sent || sentToNotifications) {
        console.log(
          `✅ Replay enviado exitosamente a sala ${roomName}${
            sentToNotifications ? ' y notifications' : ''
          }`
        );
        showToast('Anuncio reenviado');
      } else {
        console.error(`❌ Error enviando replay a sala ${roomName}`);
        showToast('Error al enviar anuncio - Verificando conexión...', 'error');

        // Intentar reconectar después de un error
        setTimeout(() => {
          if (selectedConsultorioId) {
            connectToConsultorioRoom(selectedConsultorioId);
          }
        }, 1000);
      }
    });

  /**
   * Función para notificar cambio de turno
   */
  function notifyTurnChange(consultorioId) {
    const roomName = String(consultorioId);
    const message = {
      action: 'turn_changed',
      consultorio_id: consultorioId,
      timestamp: new Date().toISOString(),
      playAudio: true,
    };

    console.log(
      `📡 Enviando notificación de cambio de turno a sala ${roomName}:`,
      message
    );
    const sent = window.wsManager.send(roomName, message);

    if (sent) {
      console.log(`✅ Mensaje enviado exitosamente a sala ${roomName}`);
    } else {
      console.error(`❌ Error enviando mensaje a sala ${roomName}`);
    }
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

    // Resetear el select y ocultar panel
    consultorioSelect.value = '';
    panel.style.display = 'none';
    noConsultorio.style.display = 'block';

    // Limpiar variables de estado
    selectedConsultorioId = null;
    turnoActual = {};

    console.log(
      '❌ Página de turnos desactivada - Select reseteado y salas desconectadas'
    );
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

  /**
   * Agregar indicador visual del estado de conexión WebSocket
   */
  function addConnectionStatusIndicator() {
    // Solo agregar una vez
    if (document.getElementById('ws-status-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'ws-status-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 1000;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    // Función para actualizar el estado
    const updateStatus = () => {
      const stats = window.wsManager.getStats();
      const connectedCount = Object.values(stats).filter(
        (s) => s.state === 'CONNECTED'
      ).length;
      const totalCount = Object.keys(stats).length;

      if (connectedCount === totalCount && totalCount > 0) {
        indicator.textContent = `🟢 WS: ${connectedCount}/${totalCount}`;
        indicator.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
        indicator.style.color = 'white';
        indicator.title = 'Todas las conexiones WebSocket activas';
      } else if (connectedCount > 0) {
        indicator.textContent = `🟡 WS: ${connectedCount}/${totalCount}`;
        indicator.style.background = 'linear-gradient(45deg, #ffc107, #fd7e14)';
        indicator.style.color = '#212529';
        indicator.title = `Solo ${connectedCount} de ${totalCount} conexiones activas`;
      } else {
        indicator.textContent = `🔴 WS: 0/${totalCount}`;
        indicator.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
        indicator.style.color = 'white';
        indicator.title = 'Sin conexiones WebSocket activas';
      }
    };

    // Mostrar estadísticas detalladas al hacer clic
    indicator.addEventListener('click', () => {
      if (window.showWebSocketStats) {
        window.showWebSocketStats();
      } else {
        console.log('WebSocket Stats:', window.wsManager.getStats());
      }
    });

    // Actualizar cada 5 segundos
    updateStatus();
    setInterval(updateStatus, 5000);

    document.body.appendChild(indicator);
  }
})();
