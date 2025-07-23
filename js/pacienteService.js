// js/pacienteService.js

window.pacienteService = {
  list: () => fetch(`http://192.168.1.5:8000/pacientes`).then((r) => r.json()),
  get: (id) =>
    fetch(`http://192.168.1.5:8000/pacientes/${id}`).then((r) => r.json()),
  create: (p) =>
    fetch(`http://192.168.1.5:8000/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then((r) => r.json()),
  update: (id, p) =>
    fetch(`http://192.168.1.5:8000/pacientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then((r) => r.json()),
  hide: (id) =>
    fetch(`http://192.168.1.5:8000/pacientes/${id}/hide`, {
      method: 'PATCH',
    }).then((r) => r.json()),
  getNombreCompleto: (p) =>
    [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido]
      .filter(Boolean)
      .join(' '),
};
