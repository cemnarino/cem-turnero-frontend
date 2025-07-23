// js\informantePage.js

(() => {
  const container = document.getElementById('turnosContainer');
  let turnosAnterior = {}; // Estado anterior de turnos para detectar cambios
  let audioPlaying = {}; // Variable para controlar reproducciones múltiples
  let pollingInterval = null; // Referencia al intervalo de polling
  let isPageActive = true; // Flag para controlar si la página está activa

  // Configuración de salas de consultorios disponibles (nombres que coinciden con el backend)
  const consultorioRooms = ['1', '2', '3'];

  /**
   * Conecta a todas las salas de consultorios usando el WebSocketManager
   */
  function connectToConsultorioRooms() {
    consultorioRooms.forEach((roomName) => {
      window.wsManager.connect(
        roomName,
        handleWebSocketMessage,
        handleWebSocketError
      );
    });

    // También conectar a la sala de notificaciones para información general
    window.wsManager.connect(
      'notifications',
      handleNotificationMessage,
      handleWebSocketError
    );
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

      // Manejar diferentes tipos de mensajes
      if (msg.action === 'replay') {
        handleReplayMessage(consultorioId);
      } else if (msg.action === 'turn_changed') {
        handleTurnChangeMessage(consultorioId, msg);
      } else if (msg.action === 'new_patient') {
        handleNewPatientMessage(consultorioId, msg);
      } else if (msg.action === 'audio_ready') {
        // El audio está listo, reproducirlo
        handleReplayMessage(consultorioId);
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

      if (msg.type === 'system_update') {
        // Actualizar datos cuando hay cambios en el sistema
        loadTurnos();
      } else if (msg.action === 'new_patient') {
        // Procesar nuevo paciente - el backend envía 'patient' en lugar de 'paciente'
        console.log('🆕 Nuevo paciente:', msg.patient);
        loadTurnos(); // Recargar todos los datos
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
    // Pequeño delay para evitar múltiples reproducciones simultáneas
    setTimeout(() => {
      if (activeTab === 'informante-view') {
        playAudio(consultorioId);
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
      const data = await fetch(
        `http://192.168.1.5:8000/consultorios/turnos/detallados`
      ).then((r) => {
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

      const esAtencion = t.paciente && t.current_turn > 0;
      // Formatear turno con ceros a la izquierda (01, 02, etc.)
      const turnoFormateado = t.current_turn
        ? String(t.current_turn).padStart(2, '0')
        : '—';

      const card = document.createElement('div');
      card.className = 'turno-card' + (esAtencion ? ' highlight' : '');

      card.innerHTML = `
        <h2>${t.consultorio}</h2>
        <div class="turno-numero">${turnoFormateado}</div>
        ${
          t.paciente
            ? `<div class="paciente-nombre">${t.paciente.nombre_completo}</div>
               <div class="paciente-detalle">Examen: ${
                 t.paciente.tipo_examen
               }</div>
               ${
                 esAtencion
                   ? '<span class="chip en-atencion">En Atención</span>'
                   : ''
               }`
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
      const response = await fetch(
        `http://192.168.1.5:8000/consultorios/${consultorioId}/audio`
      );

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
})();
