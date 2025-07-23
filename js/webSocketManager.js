// js/webSocketManager.js
// Gestor centralizado de WebSockets para evitar memory leaks y manejar múltiples salas

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // Mapa de conexiones activas
    this.reconnectIntervals = new Map(); // Intervalos de reconexión
    this.reconnectAttempts = new Map(); // Contador de intentos de reconexión
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 segundos
    this.baseUrl = 'ws://192.168.1.12:8000/ws';
    this.isActive = true; // Flag para controlar si el manager está activo

    // Configuración de salas
    this.roomConfig = {
      // Salas de consultorios (mapear IDs directamente como en el backend)
      1: { type: 'consultorio', id: 1 },
      2: { type: 'consultorio', id: 2 },
      3: { type: 'consultorio', id: 3 },

      // Sala de notificaciones generales
      notifications: { type: 'notifications' },
    };
  }

  /**
   * Conecta a una sala específica
   * @param {string} roomName - Nombre de la sala ('1', '2', '3', 'notifications')
   * @param {function} onMessage - Callback para manejar mensajes
   * @param {function} onError - Callback opcional para manejar errores
   */
  connect(roomName, onMessage, onError = null) {
    if (!this.isActive) {
      console.warn('WebSocketManager está inactivo');
      return;
    }

    const roomConfig = this.roomConfig[roomName];
    if (!roomConfig) {
      console.error(`Sala desconocida: ${roomName}`);
      return;
    }

    // Si ya existe una conexión activa para esta sala, no crear otra
    if (
      this.connections.has(roomName) &&
      this.connections.get(roomName).readyState === WebSocket.OPEN
    ) {
      console.log(`Ya existe una conexión activa para ${roomName}`);
      return;
    }

    // Construir URL según el tipo de sala
    let wsUrl;
    if (roomConfig.type === 'consultorio') {
      wsUrl = `${this.baseUrl}/${roomConfig.id}`;
    } else if (roomConfig.type === 'notifications') {
      wsUrl = `${this.baseUrl}/notifications`;
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ Conectado a ${roomName} (${wsUrl})`);
        this.reconnectAttempts.set(roomName, 0);
        this.clearReconnectInterval(roomName);
      };

      ws.onmessage = (event) => {
        try {
          // Intentar parsear como JSON
          const data = JSON.parse(event.data);
          onMessage(data, roomName);
        } catch (e) {
          // Si no es JSON, pasarlo como texto
          onMessage(event.data, roomName);
        }
      };

      ws.onclose = (event) => {
        console.log(
          `❌ Conexión cerrada para ${roomName}:`,
          event.code,
          event.reason
        );
        this.connections.delete(roomName);

        // Solo reconectar si es un cierre inesperado y el manager está activo
        if (this.isActive && event.code !== 1000) {
          this.scheduleReconnect(roomName, onMessage, onError);
        }
      };

      ws.onerror = (error) => {
        console.error(`💥 Error en WebSocket ${roomName}:`, error);
        if (onError) {
          onError(error, roomName);
        }
      };

      this.connections.set(roomName, ws);
    } catch (error) {
      console.error(`Error creando WebSocket para ${roomName}:`, error);
      if (onError) {
        onError(error, roomName);
      }
    }
  }

  /**
   * Programa una reconexión automática
   */
  scheduleReconnect(roomName, onMessage, onError) {
    const attempts = this.reconnectAttempts.get(roomName) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(
        `❌ Máximo de intentos de reconexión alcanzado para ${roomName}`
      );
      return;
    }

    this.reconnectAttempts.set(roomName, attempts + 1);

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Backoff exponencial
    console.log(
      `🔄 Reconectando ${roomName} en ${delay}ms (intento ${attempts + 1}/${
        this.maxReconnectAttempts
      })`
    );

    const intervalId = setTimeout(() => {
      if (this.isActive) {
        this.connect(roomName, onMessage, onError);
      }
    }, delay);

    this.reconnectIntervals.set(roomName, intervalId);
  }

  /**
   * Envía un mensaje a una sala específica
   */
  send(roomName, message) {
    const ws = this.connections.get(roomName);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(
        `No se puede enviar mensaje a ${roomName}: conexión no disponible`
      );
      return false;
    }

    try {
      const messageToSend =
        typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(messageToSend);
      return true;
    } catch (error) {
      console.error(`Error enviando mensaje a ${roomName}:`, error);
      return false;
    }
  }

  /**
   * Desconecta de una sala específica
   */
  disconnect(roomName) {
    const ws = this.connections.get(roomName);

    if (ws) {
      ws.close(1000, 'Desconexión intencional');
      this.connections.delete(roomName);
    }

    this.clearReconnectInterval(roomName);
    this.reconnectAttempts.delete(roomName);
  }

  /**
   * Desconecta de todas las salas
   */
  disconnectAll() {
    console.log('🔌 Desconectando todas las salas WebSocket...');

    this.isActive = false;

    for (const roomName of this.connections.keys()) {
      this.disconnect(roomName);
    }

    // Limpiar todos los intervalos de reconexión
    for (const intervalId of this.reconnectIntervals.values()) {
      clearTimeout(intervalId);
    }
    this.reconnectIntervals.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Reactiva el manager y permite nuevas conexiones
   */
  activate() {
    this.isActive = true;
    console.log('✅ WebSocketManager activado');
  }

  /**
   * Limpia el intervalo de reconexión para una sala
   */
  clearReconnectInterval(roomName) {
    const intervalId = this.reconnectIntervals.get(roomName);
    if (intervalId) {
      clearTimeout(intervalId);
      this.reconnectIntervals.delete(roomName);
    }
  }

  /**
   * Obtiene el estado de una conexión
   */
  getConnectionState(roomName) {
    const ws = this.connections.get(roomName);
    if (!ws) return 'DISCONNECTED';

    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'DISCONNECTED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Obtiene estadísticas de todas las conexiones
   */
  getStats() {
    const stats = {};
    for (const [roomName] of this.connections) {
      stats[roomName] = {
        state: this.getConnectionState(roomName),
        reconnectAttempts: this.reconnectAttempts.get(roomName) || 0,
      };
    }
    return stats;
  }
}

// Instancia global del manager
window.wsManager = new WebSocketManager();

// Limpieza al cerrar la página
window.addEventListener('beforeunload', () => {
  window.wsManager.disconnectAll();
});

// Manejo de visibilidad de página para pausar/reanudar conexiones
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Página oculta - pausar reconexiones pero mantener conexiones existentes
    window.wsManager.isActive = false;
  } else {
    // Página visible - reactivar
    window.wsManager.activate();
  }
});
