# Documentación del WebSocket para el Backend

## Resumen

Este documento describe cómo debe implementarse el sistema WebSocket en el backend para que funcione correctamente con el frontend mejorado.

## Arquitectura de Salas WebSocket

### 1. Salas de Consultorios (3 salas principales)

- **`/ws/1`** - Sala del Consultorio 1
- **`/ws/2`** - Sala del Consultorio 2
- **`/ws/3`** - Sala del Consultorio 3

### 2. Sala de Notificaciones Generales

- **`/ws/notifications`** - Sala para notificaciones del sistema

## Tipos de Mensajes

### Mensajes de Consultorios (`/ws/{consultorio_id}`)

#### 1. Mensaje de Replay (Repetir Anuncio)

```json
// Mensaje recibido del cliente:
"replay"
// o
{"action": "replay"}

// El servidor debe:
// 1. Generar el audio TTS para el turno actual del consultorio
// 2. Enviar el mensaje a todos los clientes conectados a esta sala
// 3. El cliente de la página "Informante" reproducirá el audio
```

#### 2. Cambio de Turno

```json
// Mensaje enviado por el servidor cuando cambia un turno:
{
  "action": "turn_changed",
  "consultorio_id": 1,
  "new_turn": 5,
  "patient": {
    "id": 123,
    "nombre_completo": "Juan Pérez",
    "turno": 5
  },
  "timestamp": "2025-01-23T10:30:00Z",
  "playAudio": true
}
```

#### 3. Nuevo Paciente Asignado

```json
// Mensaje enviado por el servidor cuando se asigna un nuevo paciente:
{
  "action": "new_patient",
  "consultorio_id": 1,
  "paciente": {
    "id": 123,
    "nombre_completo": "María García",
    "cedula": "12345678",
    "tipo_examen": "Consulta General",
    "turno": 6,
    "consultorio_id": 1
  },
  "timestamp": "2025-01-23T10:35:00Z"
}
```

### Mensajes de Notificaciones (`/ws/notifications`)

#### 1. Nuevo Paciente en el Sistema

```json
{
  "type": "new_patient",
  "patient": {
    "id": 123,
    "nombre_completo": "Ana López",
    "cedula": "87654321",
    "tipo_examen": "Laboratorio",
    "consultorio_id": 2,
    "turno": 3
  },
  "timestamp": "2025-01-23T10:40:00Z"
}
```

#### 2. Actualización del Sistema

```json
{
  "type": "system_update",
  "description": "Datos del sistema actualizados",
  "timestamp": "2025-01-23T10:45:00Z"
}
```

## Implementación Sugerida en el Backend

### 1. Estructura Básica (FastAPI/Python ejemplo)

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

app = FastAPI()

# Gestión de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        # Diccionario de salas -> lista de conexiones
        self.active_connections: Dict[str, List[WebSocket]] = {
            "consultorio_1": [],
            "consultorio_2": [],
            "consultorio_3": [],
            "notifications": []
        }

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room in self.active_connections:
            self.active_connections[room].append(websocket)
            print(f"Cliente conectado a sala {room}")

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
                print(f"Cliente desconectado de sala {room}")

    async def send_to_room(self, room: str, message: dict):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remover conexiones rotas
                    self.active_connections[room].remove(connection)

    async def send_text_to_room(self, room: str, message: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_text(message)
                except:
                    self.active_connections[room].remove(connection)

manager = ConnectionManager()

# Endpoints WebSocket
@app.websocket("/ws/{consultorio_id}")
async def websocket_consultorio(websocket: WebSocket, consultorio_id: int):
    room = f"consultorio_{consultorio_id}"
    await manager.connect(websocket, room)

    try:
        while True:
            data = await websocket.receive_text()

            # Manejar mensaje de replay
            if data == "replay" or (data.startswith("{") and "replay" in data):
                # Procesar solicitud de replay
                await handle_replay_request(consultorio_id)

                # Notificar a todos los clientes de esta sala
                await manager.send_to_room(room, {"action": "replay"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, room)

@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket, "notifications")

    try:
        while True:
            # Esta sala principalmente escucha, no procesa mensajes entrantes
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "notifications")

# Funciones de utilidad
async def handle_replay_request(consultorio_id: int):
    """
    Procesar solicitud de repetir anuncio
    Aquí debes implementar la lógica TTS
    """
    # 1. Obtener turno actual del consultorio
    # 2. Generar audio TTS
    # 3. El frontend se encargará de reproducirlo
    pass

async def notify_turn_change(consultorio_id: int, new_turn: int, patient_data: dict):
    """
    Notificar cambio de turno a todas las salas relevantes
    """
    room = f"consultorio_{consultorio_id}"
    message = {
        "action": "turn_changed",
        "consultorio_id": consultorio_id,
        "new_turn": new_turn,
        "patient": patient_data,
        "timestamp": datetime.utcnow().isoformat(),
        "playAudio": True
    }

    await manager.send_to_room(room, message)
    await manager.send_to_room("notifications", {
        "type": "system_update",
        "description": f"Turno cambiado en consultorio {consultorio_id}",
        "timestamp": datetime.utcnow().isoformat()
    })

async def notify_new_patient(patient_data: dict):
    """
    Notificar nuevo paciente asignado
    """
    consultorio_id = patient_data.get("consultorio_id")

    # Notificar a la sala específica del consultorio
    if consultorio_id:
        room = f"consultorio_{consultorio_id}"
        await manager.send_to_room(room, {
            "action": "new_patient",
            "consultorio_id": consultorio_id,
            "paciente": patient_data,
            "timestamp": datetime.utcnow().isoformat()
        })

    # Notificar a la sala de notificaciones generales
    await manager.send_to_room("notifications", {
        "type": "new_patient",
        "patient": patient_data,
        "timestamp": datetime.utcnow().isoformat()
    })
```

### 2. Integración con Endpoints REST

```python
@app.patch("/consultorios/{consultorio_id}/next")
async def next_turn(consultorio_id: int):
    # Tu lógica existente para avanzar turno

    # ... código para cambiar turno ...

    # Notificar via WebSocket
    await notify_turn_change(consultorio_id, new_turn, patient_data)

    return {"message": "Turno avanzado"}

@app.post("/pacientes")
async def create_patient(patient_data: dict):
    # Tu lógica existente para crear paciente

    # ... código para crear paciente ...

    # Notificar via WebSocket
    await notify_new_patient(patient_data)

    return {"message": "Paciente creado"}
```

## URLs de Conexión WebSocket

Para conectar desde el frontend, las URLs serán:

- **Consultorio 1**: `ws://192.168.1.12:8000/ws/1`
- **Consultorio 2**: `ws://192.168.1.12:8000/ws/2`
- **Consultorio 3**: `ws://192.168.1.12:8000/ws/3`
- **Notificaciones**: `ws://192.168.1.12:8000/ws/notifications`

## Beneficios de esta Implementación

1. **Sin Memory Leaks**: El frontend gestiona las conexiones de manera centralizada
2. **Reconexión Automática**: Si se pierde la conexión, se reintenta automáticamente
3. **Salas Separadas**: Cada consultorio tiene su propia sala de comunicación
4. **Notificaciones Globales**: Una sala dedicada para eventos del sistema
5. **Gestión de Estado**: El frontend sabe cuándo está activo y cuándo pausar las conexiones

## Notas Importantes

- El frontend solo se conecta a las salas cuando está en la pestaña correspondiente
- Las conexiones se limpian automáticamente al cambiar de pestaña o cerrar la página
- El sistema de polling se usa solo como respaldo en caso de fallas de WebSocket
- Las reproducciones de audio se controlan para evitar solapamientos

## Testing

Para probar el sistema, puedes usar herramientas como:

- **wscat**: `wscat -c ws://192.168.1.12:8000/ws/1`
- **Browser DevTools**: Conectar desde la consola del navegador
- **Postman**: Crear pruebas de WebSocket
