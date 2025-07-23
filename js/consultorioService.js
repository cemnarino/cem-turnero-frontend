// js/consultorioService.js

window.consultorioService = {
  list: () =>
    fetch(`http://192.168.1.5:8000/consultorios`).then((r) => r.json()),
  get: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}`).then((r) => r.json()),
  create: (data) =>
    fetch(`http://192.168.1.5:8000/consultorios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  update: (id, data) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  hide: (id) =>
    fetch(`http://192.168.1.5:8000/consultorios/${id}/hide`, {
      method: 'PATCH',
    }).then((r) => r.json()),
};
