// js\turnoService.js

window.turnoService = {
  // Obtener turno actual
  getCurrentTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/current`).then((r) =>
      r.json()
    ),

  // Avanzar turno
  nextTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/next`, {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Reiniciar turno
  resetTurn: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/reset`, {
      method: 'PATCH',
    }).then((r) => r.json()),

  // Pacientes en espera (no atendidos, turno != actual)
  getPacientesEnEspera: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/pacientes`).then((r) =>
      r.json()
    ),
};
