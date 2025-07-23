# Correcciones para Problemas WebSocket Identificados

## Problemas Resueltos

### 1. ✅ Nombres de Salas WebSocket

**Problema**: El frontend usaba `consultorio_1`, `consultorio_2`, etc., pero el backend espera `1`, `2`, `3`.

**Solución**: Actualizado el frontend para usar directamente los IDs como nombres de sala.

**Archivos modificados**:

- `js/webSocketManager.js`: Cambiado `roomConfig` para usar `'1'`, `'2'`, `'3'`
- `js/informantePage.js`: Actualizado `consultorioRooms = ['1', '2', '3']`
- `js/turnosPage.js`: Cambiado `roomName = String(consultorioId)`

### 2. ✅ Estructura de Mensajes

**Problema**: El backend envía `patient` pero el frontend buscaba `paciente`.

**Solución**: Actualizado manejo de mensajes para usar `msg.patient`.

### 3. ✅ Audio al Volver a la Pestaña

**Problema**: Al volver a entrar en "Informante" se reproducía automáticamente el último audio.

**Solución**:

- Añadido flag `isFirstLoad` en `detectChanges()`
- Reseteo de `audioPlaying = {}` al activar la página
- Solo reproduce audio en cambios reales, no en cargas iniciales

### 4. ✅ Memory Leaks

**Problema**: Las conexiones WebSocket no se liberaban al cambiar pestañas.

**Solución**:

- Desconexión automática al desactivar páginas
- Limpieza de intervalos y estados
- Reset de variables de control

---

## Problemas Específicos Mencionados

### 1. ❌ Nuevo Paciente No Actualiza Lista

**Diagnóstico**: El backend envía el mensaje pero con estructura diferente.

**Backend envía**:

```json
{
  "action": "new_patient",
  "patient": {
    "id": 123,
    "turno": 5,
    "turno_label": "05",
    "nombre": "Juan Pérez"
  }
}
```

**Frontend esperaba**:

```json
{
  "action": "new_patient",
  "paciente": { ... }
}
```

**✅ CORREGIDO**: El frontend ahora usa `msg.patient`.

### 2. ❌ "Volver a Anunciar" No Funciona

**Diagnóstico**: Los nombres de sala no coincidían.

**Antes**: Frontend enviaba a `consultorio_1`, backend escuchaba en `1`
**✅ CORREGIDO**: Ahora frontend envía a sala `'1'` directamente.

### 3. ❌ Audio se Reproduce al Entrar a Informante

**Diagnóstico**: `detectChanges()` disparaba audio en la primera carga.

**✅ CORREGIDO**: Añadido flag `isFirstLoad` para evitar reproducciones automáticas.

---

## Testing Recomendado

### 1. Test de Nuevo Paciente

1. Ir a pestaña "Turnos", seleccionar consultorio
2. En otra ventana, registrar nuevo paciente para ese consultorio
3. **Verificar**: Lista se actualiza automáticamente + notificación aparece

### 2. Test de Volver a Anunciar

1. Ir a pestaña "Turnos", seleccionar consultorio
2. Hacer clic en "Volver a Anunciar"
3. Ir a pestaña "Informante"
4. **Verificar**: Audio se reproduce 2 veces

### 3. Test de Memory Leaks

1. Abrir DevTools > Network > WS
2. Ir a "Informante" (debe ver 4 conexiones: 1,2,3,notifications)
3. Cambiar a otra pestaña
4. **Verificar**: Conexiones se cierran automáticamente
5. Volver a "Informante"
6. **Verificar**: NO se reproduce audio automático

### 4. Test de WebSocket Stats

En consola del navegador:

```javascript
console.log(window.getWebSocketStats());
// Debe mostrar conexiones activas solo cuando estés en Turnos/Informante
```

---

## Comandos de Debug

### Ver Estado de Conexiones

```javascript
window.wsManager.getStats();
```

### Enviar Replay Manual

```javascript
window.sendReplayMessage(1); // Para consultorio 1
```

### Ver Configuración de Salas

```javascript
window.wsManager.roomConfig;
```

---

## Próximos Pasos

1. **Testear exhaustivamente** los 4 casos mencionados arriba
2. **Monitorear memoria** en DevTools mientras navegas entre pestañas
3. **Verificar logs del backend** para confirmar que los mensajes llegan correctamente
4. **Si persisten problemas**, revisar:
   - Logs del navegador (Console)
   - Network tab para ver mensajes WebSocket
   - Backend logs para ver mensajes recibidos/enviados

## Estructura de Mensajes Backend-Frontend

### Mensaje de Nuevo Paciente

```json
// Backend envía:
{
  "action": "new_patient",
  "patient": { "id": 123, "turno": 5, "nombre": "Juan" }
}

// Frontend maneja: msg.patient
```

### Mensaje de Cambio de Turno

```json
// Backend envía:
{
  "action": "turn_changed",
  "consultorio_id": 1,
  "current_turn": 5,
  "next_patient": {...}
}

// Frontend recarga datos automáticamente
```

### Mensaje de Replay

```json
// Frontend envía: "replay"
// Backend reenvía: {"action": "replay", "consultorio_id": 1}
// Frontend reproduce audio
```
