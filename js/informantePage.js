// js/informantePage.js

(() => {
  const container = document.getElementById('turnosContainer');
  let turnosAnterior = {}; // Estado anterior de turnos para detectar cambios
  let audioPlaying = {}; // Variable para controlar reproducciones múltiples
  let pollingInterval = null; // Referencia al intervalo de polling
  let isPageActive = true; // Flag para controlar si la página está activa

  // Salas de WebSocket para cada consultorio (1, 2, 3, 4) más notificaciones
  const consultorioRooms = ['1', '2', '3', '4'];

  /**
   * Conecta a las salas de WebSocket de los consultorios
   */
  function connectToConsultorioRooms() {
    console.log('🔌 Conectando a salas de WebSocket...');

    // Primero desconectar para evitar conexiones duplicadas
    disconnectFromRooms();

    // Conectar a cada sala de consultorio
    consultorioRooms.forEach((roomName) => {
      console.log(`🔌 Conectando a sala: ${roomName}`);
      window.wsManager.connect(
        roomName,
        handleWebSocketMessage,
        handleWebSocketError
      );
    });

    // También conectar a la sala de notificaciones para información general
    console.log('🔌 Conectando a sala: notifications');
    window.wsManager.connect(
      'notifications',
      handleNotificationMessage,
      handleWebSocketError
    );

    console.log('✅ Todas las conexiones WebSocket iniciadas');
  }

  /**
   * Maneja mensajes de WebSocket de consultorios
   */
  function handleWebSocketMessage(message, roomName) {
    try {
      // Solo procesar si estamos en la pestaña correcta
      if (activeTab !== 'informante-view') return;

      let msg = message;
      if (typeof message === 'string') {
        try {
          msg = JSON.parse(message);
        } catch (e) {
          // Si no es JSON, tratar como mensaje simple
          if (message === 'replay') {
            msg = { action: 'replay' };
          } else {
            return;
          }
        }
      }

      // Extraer ID del consultorio del nombre de la sala
      const consultorioId = extractConsultorioId(roomName);
      if (!consultorioId) return;

      console.log(`📨 Mensaje de consultorio ${consultorioId}:`, msg);

      // Manejar diferentes tipos de mensajes
      if (msg.action === 'replay') {
        // Para replay, usar el consultorio_id del mensaje si está disponible
        const targetConsultorioId = parseInt(
          msg.consultorio_id || consultorioId,
          10
        );
        console.log(
          `🔄 Procesando replay para consultorio ${targetConsultorioId}`
        );
        handleReplayMessage(targetConsultorioId);
      } else if (msg.action === 'turn_changed') {
        handleTurnChangeMessage(consultorioId, msg);
      } else if (msg.action === 'lista_abierta') {
        handleListaAbiertaMessage(consultorioId, msg);
      } else if (msg.action === 'turn_reset') {
        handleTurnResetMessage(consultorioId, msg);
      } else if (msg.action === 'new_patient') {
        handleNewPatientMessage(consultorioId, msg);
      } else if (msg.action === 'patient_deleted') {
        handlePatientDeletedMessage(consultorioId, msg);
      } else if (msg.action === 'audio_ready') {
        // Audio está listo - solo logear, NO reproducir automáticamente
        console.log(`🎵 Audio listo para consultorio ${consultorioId}`);
      } else if (msg.type === 'ping') {
        // Heartbeat del servidor - no hacer nada, solo mantener conexión
        console.debug('💓 Heartbeat recibido');
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
    }
  }

  /**
   * Maneja mensajes de la sala de notificaciones
   */
  function handleNotificationMessage(message, roomName) {
    if (activeTab !== 'informante-view') return;

    try {
      const msg = typeof message === 'string' ? JSON.parse(message) : message;
      console.log('📢 Notificación recibida:', msg);

      // Manejar diferentes tipos de notificaciones
      if (msg.type === 'system_update') {
        // Actualizar datos cuando hay cambios en el sistema
        loadTurnos();
      } else if (msg.action === 'new_patient') {
        // Procesar nuevo paciente - el backend envía 'patient' en lugar de 'paciente'
        console.log('🆕 Nuevo paciente (notificación):', msg.patient);
        loadTurnos(); // Recargar todos los datos
      } else if (msg.action === 'turn_changed') {
        // Un turno cambió - actualizar vista
        console.log('🔄 Cambio de turno (notificación):', msg.paciente);
        loadTurnos();
      } else if (msg.action === 'lista_abierta') {
        // Lista de consultorio fue reabierta - actualizar vista
        console.log('🔓 Lista reabierta (notificación):', msg);
        loadTurnos();
      } else if (msg.action === 'turn_reset') {
        // Turno del consultorio fue reseteado - actualizar vista
        console.log('🔄 Turno reseteado (notificación):', msg);
        loadTurnos();
      } else if (msg.action === 'patient_deleted') {
        // Un paciente fue eliminado
        console.log('🗑️ Paciente eliminado (notificación):', msg.paciente_id);
        loadTurnos();
      } else if (msg.action === 'replay') {
        // Replay desde turnosPage - reproducir audio inmediatamente
        const consultorioId = parseInt(msg.consultorio_id, 10);
        console.log(
          `🔄 Replay recibido vía notificaciones para consultorio ${consultorioId}`
        );
        if (consultorioId >= 1 && consultorioId <= 4) {
          handleReplayMessage(consultorioId);
        }
      } else if (msg.type === 'ping') {
        // Heartbeat del servidor
        console.debug('💓 Heartbeat de notificaciones');
      }
    } catch (error) {
      console.error('Error procesando notificación:', error);
    }
  }

  /**
   * Maneja errores de WebSocket
   */
  function handleWebSocketError(error, roomName) {
    console.error(`Error en sala ${roomName}:`, error);

    // En caso de error, usar polling como respaldo temporal
    if (!pollingInterval && activeTab === 'informante-view') {
      startPollingBackup();
    }
  }

  /**
   * Extrae el ID del consultorio del nombre de la sala
   */
  function extractConsultorioId(roomName) {
    // Como ahora usamos directamente el ID como nombre de sala
    return parseInt(roomName, 10) || null;
  }

  /**
   * Desconecta de todas las salas de WebSocket
   */
  function disconnectFromRooms() {
    consultorioRooms.forEach((roomName) => {
      window.wsManager.disconnect(roomName);
    });
    window.wsManager.disconnect('notifications');
  }

  /**
   * Maneja mensaje de replay (repetir anuncio)
   */
  function handleReplayMessage(consultorioId) {
    console.log(`🔄 Replay solicitado para consultorio ${consultorioId}`);

    // Pequeño delay para evitar múltiples reproducciones simultáneas
    setTimeout(() => {
      if (activeTab === 'informante-view') {
        console.log(`🔊 Ejecutando replay para consultorio ${consultorioId}`);
        playAudio(consultorioId);
      } else {
        console.log(`❌ Replay cancelado - no en pestaña informante`);
      }
    }, 100);
  }

  /**
   * Maneja mensaje de cambio de turno
   */
  function handleTurnChangeMessage(consultorioId, msg) {
    console.log(`🔄 Cambio de turno en consultorio ${consultorioId}:`, msg);

    // Actualizar datos inmediatamente
    loadTurnos();

    // Si se solicita reproducir audio, hacerlo con un pequeño delay
    if (msg.playAudio && activeTab === 'informante-view') {
      setTimeout(() => {
        console.log(`🔊 Reproduciendo audio para consultorio ${consultorioId}`);
        playAudio(consultorioId);
      }, 500); // Delay más largo para asegurar que los datos se carguen primero
    }
  }

  /**
   * Maneja mensaje de nuevo paciente
   */
  function handleNewPatientMessage(consultorioId, msg) {
    console.log(
      `🆕 Nuevo paciente en consultorio ${consultorioId}:`,
      msg.patient || msg
    );
    // Actualizar datos cuando llega un nuevo paciente
    loadTurnos();
  }

  /**
   * Maneja mensaje de lista reabierta
   */
  function handleListaAbiertaMessage(consultorioId, msg) {
    console.log(`🔓 Lista reabierta en consultorio ${consultorioId}:`, msg);

    // Actualizar datos inmediatamente para mostrar el nuevo turno y paciente
    loadTurnos();

    // NO reproducir audio automáticamente al reabrir consultorio
    // El audio solo debe reproducirse cuando se cambia de turno manualmente
    console.log(
      `ℹ️ Consultorio ${consultorioId} reabierto - Audio no reproducido automáticamente`
    );
    if (msg.proximo_paciente) {
      console.log(
        `👤 Próximo paciente: ${msg.proximo_paciente.nombre} (Turno ${msg.proximo_paciente.turno})`
      );
    }
  }

  /**
   * Maneja mensaje de reset de turno
   */
  function handleTurnResetMessage(consultorioId, msg) {
    console.log(`🔄 Reset de turno en consultorio ${consultorioId}:`, msg);

    // Actualizar datos inmediatamente para mostrar los cambios
    loadTurnos();

    console.log(
      `ℹ️ Consultorio ${consultorioId} reseteado - ${
        msg.pacientes_reenumerados || 0
      } pacientes reenumerados`
    );
  }

  /**
   * Maneja mensaje de paciente eliminado
   */
  function handlePatientDeletedMessage(consultorioId, msg) {
    console.log(
      `🗑️ Paciente eliminado en consultorio ${consultorioId}:`,
      msg.paciente_id
    );
    // Actualizar datos cuando se elimina un paciente
    loadTurnos();
  }

  /**
   * Desconecta de todas las salas de WebSocket
   */
  function disconnectFromRooms() {
    consultorioRooms.forEach((roomName) => {
      window.wsManager.disconnect(roomName);
    });
    window.wsManager.disconnect('notifications');
  }

  // Guarda la pestaña activa (actualizada cada vez que se cambia)
  let activeTab = 'consultorios-view'; // valor inicial

  /**
   * Inicializa el sistema cuando el DOM está listo
   */
  function initializeInformantePage() {
    // Configurar listeners para cambios de pestaña
    document.querySelectorAll('.tab').forEach((tab) =>
      tab.addEventListener('click', () => {
        const newTab = tab.dataset.target;
        const wasInformanteActive = activeTab === 'informante-view';
        activeTab = newTab;

        // Manejar activación/desactivación de la pestaña informante
        if (newTab === 'informante-view' && !wasInformanteActive) {
          activateInformantePage();
        } else if (wasInformanteActive && newTab !== 'informante-view') {
          deactivateInformantePage();
        }
      })
    );
  }

  /**
   * Activa la página de informante
   */
  function activateInformantePage() {
    isPageActive = true;

    // Resetear estado de reproducción de audio para evitar reproducciones automáticas
    audioPlaying = {};

    // IMPORTANTE: Resetear turnosAnterior para evitar reproducciones automáticas
    // al re-entrar a la pestaña
    turnosAnterior = {};

    // Conectar a las salas de WebSocket
    connectToConsultorioRooms();

    // Cargar datos iniciales
    loadTurnos();

    // Configurar polling de respaldo (menos frecuente)
    startPollingBackup();

    console.log('✅ Página de informante activada');
  }
  /**
   * Desactiva la página de informante
   */
  function deactivateInformantePage() {
    isPageActive = false;

    // Desconectar WebSockets para liberar memoria
    disconnectFromRooms();

    // Detener polling
    stopPolling();

    // Detener cualquier audio en reproducción
    stopAllAudio();

    console.log('❌ Página de informante desactivada');
  }
  /**
   * Inicia el polling de respaldo (solo como fallback)
   */
  function startPollingBackup() {
    // Solo usar polling si no hay conexiones WebSocket activas
    const wsStats = window.wsManager.getStats();
    const hasActiveConnections = Object.values(wsStats).some(
      (stat) => stat.state === 'CONNECTED'
    );

    if (!hasActiveConnections && !pollingInterval) {
      console.log('🔄 Iniciando polling de respaldo...');
      pollingInterval = setInterval(() => {
        if (activeTab === 'informante-view' && isPageActive) {
          loadTurnos();
        }
      }, 10000); // 10 segundos como respaldo
    }
  }

  /**
   * Detiene el polling
   */
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log('⏹️ Polling detenido');
    }
  }

  /**
   * Detiene todo el audio que se esté reproduciendo
   */
  function stopAllAudio() {
    // Resetear flags de reproducción
    audioPlaying = {};
  }

  /**
   * Carga los turnos desde el servidor
   */
  async function loadTurnos() {
    if (!isPageActive || activeTab !== 'informante-view') {
      return; // No cargar si no estamos en la pestaña correcta
    }

    try {
      const data = await fetch(API_URLS.getTurnosDetallados()).then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP error! status: ${r.status}`);
        }
        return r.json();
      });

      // Verificar que aún estemos en la pestaña correcta después de la carga
      if (activeTab !== 'informante-view') return;

      // Detectar cambios y reproducir audio si es necesario
      detectChanges(data);

      // Renderizar turnos
      renderTurnos(data);

      // Si el polling está activo y hay conexiones WebSocket funcionando, detenerlo
      const wsStats = window.wsManager.getStats();
      const hasActiveConnections = Object.values(wsStats).some(
        (stat) => stat.state === 'CONNECTED'
      );

      if (hasActiveConnections && pollingInterval) {
        stopPolling();
      }
    } catch (error) {
      console.error('Error cargando turnos:', error);

      // En caso de error, asegurar que el polling esté activo
      if (!pollingInterval) {
        startPollingBackup();
      }
    }
  }

  /**
   * Detecta cambios en los turnos y reproduce audio si es necesario
   */
  function detectChanges(turnos) {
    if (!Array.isArray(turnos)) return;

    // Si acabamos de activar la página, no reproducir audio automáticamente
    // Solo actualizar el estado anterior sin disparar audio
    const isFirstLoad = Object.keys(turnosAnterior).length === 0;

    if (isFirstLoad) {
      console.log('👋 Primera carga de informantePage - sin audio automático');
    }

    for (const t of turnos) {
      if (!t.consultorio) continue;

      const consultorioKey = t.consultorio;
      const currentLabel = t.label;
      const previousLabel = turnosAnterior[consultorioKey];

      // Solo reproducir audio si:
      // 1. No es la primera carga de la página
      // 2. El turno cambió
      // 3. El turno actual no es 0
      // 4. Estamos en la pestaña correcta
      if (
        !isFirstLoad &&
        previousLabel &&
        previousLabel !== currentLabel &&
        t.current_turn > 0 &&
        activeTab === 'informante-view'
      ) {
        const match = t.consultorio.match(/\d+$/);
        if (match) {
          const consultorioId = parseInt(match[0], 10);

          console.log(
            `🔄 Cambio detectado en ${consultorioKey}: ${previousLabel} → ${currentLabel}`
          );

          // Pequeño delay para evitar múltiples reproducciones
          setTimeout(() => {
            if (activeTab === 'informante-view') {
              console.log(
                `🔊 Reproduciendo audio por cambio en consultorio ${consultorioId}`
              );
              playAudio(consultorioId);
            }
          }, 300);
        }
      }

      // Actualizar el turno anterior
      turnosAnterior[consultorioKey] = currentLabel;
    }
  }

  /**
   * Renderiza los turnos en la interfaz
   */
  function renderTurnos(turnos) {
    if (!container || !Array.isArray(turnos)) return;

    container.innerHTML = '';

    turnos.forEach((t) => {
      if (!t.consultorio) return;

      // Usar la nueva columna en_atencion del backend para determinar el estado
      const esAtencion = t.paciente && t.paciente.en_atencion === true;

      // Formatear turno con ceros a la izquierda (01, 02, etc.)
      const turnoFormateado = t.current_turn
        ? String(t.current_turn).padStart(2, '0')
        : '—';

      const card = document.createElement('div');
      card.className = 'turno-card' + (esAtencion ? ' highlight' : '');

      // Mostrar información más detallada con el nuevo turno_label
      const turnoLabel = t.paciente?.turno_label || `Turno ${turnoFormateado}`;

      card.innerHTML = `
      <div class="turno-header">
      <h2>${t.consultorio}</h2>
      <div class="turno-numero">Turno: ${turnoFormateado}</div>
      </div>
        ${
          t.paciente
            ? `<div class="paciente-nombre">${t.paciente.nombre_completo}</div>
               `
            : '<div class="paciente-nombre">Sin paciente asignado</div>'
        }
      `;
      container.appendChild(card);
    });
  }

  /**
   * Reproduce audio para un consultorio específico
   */
  async function playAudio(consultorioId) {
    console.log(
      `🎵 Intentando reproducir audio para consultorio ${consultorioId}`
    );

    // Verificaciones múltiples para evitar reproducciones no deseadas
    if (!isPageActive || activeTab !== 'informante-view') {
      console.log(`❌ Audio cancelado - página no activa o pestaña incorrecta`);
      return;
    }

    if (audioPlaying[consultorioId]) {
      console.log(
        `❌ Audio cancelado - ya reproduciendo para consultorio ${consultorioId}`
      );
      return; // Evitar múltiples reproducciones del mismo consultorio
    }

    audioPlaying[consultorioId] = true;
    console.log(`🔒 Audio bloqueado para consultorio ${consultorioId}`);

    try {
      const response = await fetch(API_URLS.getAudio(consultorioId));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Verificar nuevamente que sigue en la pestaña correcta
      if (!isPageActive || activeTab !== 'informante-view') {
        audioPlaying[consultorioId] = false;
        console.log(`❌ Audio cancelado después de fetch - pestaña cambió`);
        return;
      }

      const audio = new Audio();
      let plays = 0;
      const maxPlays = 2;

      const playNext = () => {
        if (
          plays < maxPlays &&
          isPageActive &&
          activeTab === 'informante-view'
        ) {
          audio.src = URL.createObjectURL(blob);

          audio
            .play()
            .then(() => {
              plays++;
              console.log(
                `🔊 Audio reproducido para consultorio ${consultorioId} (${plays}/${maxPlays})`
              );
            })
            .catch((e) => {
              console.error('❌ Error reproduciendo audio:', e);
              audioPlaying[consultorioId] = false;
            });

          audio.onended = () => {
            // Liberar URL del blob
            URL.revokeObjectURL(audio.src);

            if (
              plays < maxPlays &&
              isPageActive &&
              activeTab === 'informante-view'
            ) {
              setTimeout(playNext, 1000);
            } else {
              // Liberar el bloqueo cuando termine todas las reproducciones
              setTimeout(() => {
                audioPlaying[consultorioId] = false;
                console.log(
                  `🔓 Audio desbloqueado para consultorio ${consultorioId}`
                );
              }, 2000);
            }
          };

          audio.onerror = () => {
            console.error('❌ Error en reproducción de audio');
            URL.revokeObjectURL(audio.src);
            audioPlaying[consultorioId] = false;
          };
        } else {
          audioPlaying[consultorioId] = false;
          console.log(
            `🔓 Audio desbloqueado (condiciones no cumplidas) para consultorio ${consultorioId}`
          );
        }
      };

      playNext();
    } catch (e) {
      console.error('❌ Error al reproducir audio:', e);
      audioPlaying[consultorioId] = false;
    }
  }

  // Inicialización del sistema
  document.addEventListener('DOMContentLoaded', initializeInformantePage);

  // Escuchar evento de refresco desde el eventBus
  eventBus.on('refresh-informante', () => {
    if (activeTab === 'informante-view' && isPageActive) {
      loadTurnos();
    }
  });

  // Escuchar cambios de pestaña desde el eventBus
  eventBus.on('tab-changed', (newTab) => {
    const wasInformanteActive = activeTab === 'informante-view';
    activeTab = newTab;

    if (newTab === 'informante-view' && !wasInformanteActive) {
      activateInformantePage();
    } else if (wasInformanteActive && newTab !== 'informante-view') {
      deactivateInformantePage();
    }
  });

  // Limpieza al cerrar la página
  window.addEventListener('beforeunload', () => {
    deactivateInformantePage();
  });

  // Manejar visibilidad de página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Página oculta - pausar actividad
      if (activeTab === 'informante-view') {
        stopPolling();
        stopAllAudio();
      }
    } else {
      // Página visible - reanudar actividad
      if (activeTab === 'informante-view' && isPageActive) {
        loadTurnos();
        // El WebSocketManager se encarga de reactivar las conexiones
      }
    }
  });

  // Función pública para enviar mensajes de replay desde otros módulos
  window.sendReplayMessage = function (consultorioId) {
    const roomName = String(consultorioId); // Usar ID directo como string
    return window.wsManager.send(roomName, 'replay');
  };

  // Función pública para obtener estadísticas de conexión
  window.getWebSocketStats = function () {
    return window.wsManager.getStats();
  };

  // Función para mostrar estadísticas detalladas en consola
  window.showWebSocketStats = function () {
    const stats = window.wsManager.getStats();
    console.group('📊 Estadísticas WebSocket');
    console.log('🔌 Conexiones activas:', Object.keys(stats).length);

    Object.entries(stats).forEach(([room, info]) => {
      const statusIcon = info.state === 'CONNECTED' ? '✅' : '❌';
      console.log(
        `${statusIcon} Sala ${room}: ${info.state} (reintentos: ${info.reconnectAttempts})`
      );
    });

    // Mostrar métricas de memoria y rendimiento
    if (performance.memory) {
      console.log(
        '💾 Memoria usada:',
        (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        'MB'
      );
      console.log(
        '💾 Memoria límite:',
        (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
        'MB'
      );
    }

    console.groupEnd();
    return stats;
  };

  // Función para monitoreo automático (opcional - solo en desarrollo)
  window.startWebSocketMonitoring = function (intervalSeconds = 30) {
    if (window.wsMonitoringInterval) {
      clearInterval(window.wsMonitoringInterval);
    }

    console.log(
      '🔍 Iniciando monitoreo WebSocket cada',
      intervalSeconds,
      'segundos'
    );
    window.wsMonitoringInterval = setInterval(() => {
      const stats = window.wsManager.getStats();
      const connectedCount = Object.values(stats).filter(
        (s) => s.state === 'CONNECTED'
      ).length;
      const totalCount = Object.keys(stats).length;

      if (connectedCount < totalCount) {
        console.warn(
          `⚠️ Solo ${connectedCount}/${totalCount} conexiones WebSocket activas`
        );
        window.showWebSocketStats();
      } else {
        console.debug(
          `✅ Todas las conexiones WebSocket activas (${connectedCount}/${totalCount})`
        );
      }
    }, intervalSeconds * 1000);
  };

  window.stopWebSocketMonitoring = function () {
    if (window.wsMonitoringInterval) {
      clearInterval(window.wsMonitoringInterval);
      window.wsMonitoringInterval = null;
      console.log('🔍 Monitoreo WebSocket detenido');
    }
  };

  // Agregar estilos CSS para los nuevos chips de estado
  const addStatusChipStyles = () => {
    if (!document.getElementById('status-chip-styles')) {
      const styles = document.createElement('style');
      styles.id = 'status-chip-styles';
      styles.textContent = `
        .chip {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 8px;
        }
        
        .chip.en-atencion {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
          animation: pulse 2s infinite;
        }
        
        .chip.atendido {
          background: linear-gradient(135deg, #6c757d, #495057);
          color: white;
          box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
        }
        
        .paciente-turno {
          font-size: 11px;
          color: #6c757d;
          font-style: italic;
          margin-top: 4px;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(styles);
    }
  };

  // Agregar estilos al cargar
  document.addEventListener('DOMContentLoaded', addStatusChipStyles);

  /**
   * Inicializar funcionalidad del botón de toggle pantalla completa
   */
  function initializeFullscreenToggle() {
    const toggleBtn = document.getElementById('toggleFullscreenBtn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const isCurrentlyFullscreen = document.body.classList.contains(
        'informante-fullscreen'
      );

      if (isCurrentlyFullscreen) {
        // Salir de pantalla completa - mostrar navbar y pestañas
        document.body.classList.remove('informante-fullscreen');

        const navbar = document.querySelector('.main-navbar');
        const tabBar = document.querySelector('.tab-bar');

        if (navbar) navbar.style.display = 'block';
        if (tabBar) tabBar.style.display = 'flex';

        // Cambiar icono
        toggleBtn.querySelector('.material-icons').textContent = 'fullscreen';
        toggleBtn.title = 'Activar pantalla completa';

        console.log('🖥️ Saliendo de modo pantalla completa');
      } else {
        // Entrar en pantalla completa - ocultar navbar y pestañas
        document.body.classList.add('informante-fullscreen');

        const navbar = document.querySelector('.main-navbar');
        const tabBar = document.querySelector('.tab-bar');

        if (navbar) navbar.style.display = 'none';
        if (tabBar) tabBar.style.display = 'none';

        // Cambiar icono
        toggleBtn.querySelector('.material-icons').textContent =
          'fullscreen_exit';
        toggleBtn.title = 'Salir de pantalla completa';

        console.log('🖥️ Entrando en modo pantalla completa');
      }
    });

    console.log('🔲 Botón de toggle pantalla completa inicializado');
  }

  // Escuchar cuando se activa la página del informante
  eventBus.on('tab-changed', (newTab) => {
    if (newTab === 'informante-view') {
      // Inicializar el botón de toggle cuando se activa la página
      setTimeout(initializeFullscreenToggle, 100);
      // Inicializar el slider
      setTimeout(initializeImageSlider, 200);
    }
  });

  // Inicializar si ya estamos en la página del informante
  document.addEventListener('DOMContentLoaded', () => {
    const informanteView = document.getElementById('informante-view');
    if (informanteView && informanteView.classList.contains('active')) {
      setTimeout(initializeFullscreenToggle, 100);
      setTimeout(initializeImageSlider, 200);
    }
  });

  // ===== FUNCIONALIDAD DEL SLIDER DE IMÁGENES =====
  let imageSlider = null;

  const SLIDER_CONFIG = {
    totalImages: 10,
    interval: 10000, // 10 segundos
    basePath: 'assets/slider/',
    imagePrefix: 'promo-',
    imageExtension: '.png',
  };

  class ImageSlider {
    constructor(container, config) {
      this.container = container;
      this.config = config;
      this.currentIndex = 0;
      this.intervalId = null;
      this.isPlaying = true;
      this.images = [];

      this.init();
    }

    init() {
      console.log('🎬 Inicializando slider de imágenes...');
      this.preloadImages();
      this.createSliderStructure();
      this.start();
    }

    preloadImages() {
      // Precargar todas las imágenes
      for (let i = 1; i <= this.config.totalImages; i++) {
        const imagePath = `${this.config.basePath}${this.config.imagePrefix}${i}${this.config.imageExtension}`;

        // Validar que la imagen existe antes de agregarla
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Imagen cargada: promo-${i}.png`);
        };
        img.onerror = () => {
          console.warn(`⚠️ No se pudo cargar: promo-${i}.png`);
        };
        img.src = imagePath;

        // Agregar la ruta de la imagen al array
        this.images.push(imagePath);
      }

      console.log(
        `📸 ${this.images.length} imágenes configuradas para el slider`
      );
    }

    createSliderStructure() {
      // Obtener la imagen existente
      const existingImg = this.container.querySelector('.slider-img');
      if (!existingImg) {
        console.error('❌ No se encontró la imagen del slider');
        return;
      }

      // Establecer la primera imagen si no tiene src
      if (!existingImg.src || existingImg.src === window.location.href) {
        existingImg.src = this.images[0];
      }

      // Configurar eventos para pausar/reanudar en hover
      this.container.addEventListener('mouseenter', () => this.pause());
      this.container.addEventListener('mouseleave', () => this.resume());

      // Crear indicadores
      this.createIndicators();

      console.log('✅ Estructura del slider creada');
    }

    createIndicators() {
      // Crear contenedor de indicadores si no existe
      let indicatorsContainer =
        this.container.querySelector('.slider-indicators');
      if (!indicatorsContainer) {
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'slider-indicators';
        this.container.appendChild(indicatorsContainer);
      }

      // Limpiar indicadores existentes
      indicatorsContainer.innerHTML = '';

      // Crear indicadores
      for (let i = 0; i < this.config.totalImages; i++) {
        const indicator = document.createElement('div');
        indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => this.goToImage(i));
        indicatorsContainer.appendChild(indicator);
      }
    }

    goToImage(index) {
      if (index < 0 || index >= this.images.length) return;

      this.currentIndex = index;
      const img = this.container.querySelector('.slider-img');
      if (img) {
        // Efecto de transición suave
        img.style.opacity = '0';

        setTimeout(() => {
          img.src = this.images[this.currentIndex];
          img.style.opacity = '1';
        }, 300);
      }

      // Actualizar indicadores
      this.updateIndicators();

      // Reiniciar el intervalo
      this.restart();

      console.log(
        `📸 Cambiando a imagen ${this.currentIndex + 1}/${
          this.config.totalImages
        }`
      );
    }

    updateIndicators() {
      const indicators = this.container.querySelectorAll('.indicator');
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === this.currentIndex);
      });
    }

    nextImage() {
      const nextIndex = (this.currentIndex + 1) % this.config.totalImages;
      this.goToImage(nextIndex);
    }

    start() {
      if (!this.isPlaying) return;

      this.intervalId = setInterval(() => {
        if (this.isPlaying && activeTab === 'informante-view') {
          this.nextImage();
        }
      }, this.config.interval);

      console.log('▶️ Slider automático iniciado');
    }

    pause() {
      this.isPlaying = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    resume() {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.start();
      }
    }

    restart() {
      this.pause();
      this.isPlaying = true;
      this.start();
    }

    destroy() {
      this.pause();
      this.container.removeEventListener('mouseenter', () => this.pause());
      this.container.removeEventListener('mouseleave', () => this.resume());

      // Limpiar indicadores
      const indicators = this.container.querySelector('.slider-indicators');
      if (indicators) {
        indicators.remove();
      }

      console.log('🛑 Slider de imágenes destruido');
    }
  }

  function initializeImageSlider() {
    const sliderContainer = document.querySelector('.imagenes-slider');

    if (!sliderContainer) {
      console.error('❌ No se encontró el contenedor .imagenes-slider');
      return;
    }

    // Destruir slider existente si existe
    if (imageSlider) {
      imageSlider.destroy();
      imageSlider = null;
    }

    // Crear nuevo slider
    imageSlider = new ImageSlider(sliderContainer, SLIDER_CONFIG);
  }

  function destroyImageSlider() {
    if (imageSlider) {
      imageSlider.destroy();
      imageSlider = null;
    }
  }

  // Limpiar slider al salir de la pestaña informante
  eventBus.on('tab-changed', (newTab) => {
    if (newTab !== 'informante-view' && imageSlider) {
      destroyImageSlider();
    }
  });

  // Manejar visibilidad de página para el slider
  document.addEventListener('visibilitychange', () => {
    if (imageSlider) {
      if (document.hidden) {
        imageSlider.pause();
      } else if (activeTab === 'informante-view') {
        imageSlider.resume();
      }
    }
  });
})();
