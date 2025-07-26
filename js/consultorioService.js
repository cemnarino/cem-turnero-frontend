// js/consultorioService.js

window.consultorioService = {
  list: () => fetch(API_URLS.getConsultorios()).then((r) => r.json()),
  get: (id) => fetch(API_URLS.getConsultorioById(id)).then((r) => r.json()),
  create: (data) =>
    fetch(API_URLS.createConsultorio(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  update: (id, data) =>
    fetch(API_URLS.updateConsultorio(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  hide: (id) =>
    fetch(API_URLS.hideConsultorio(id), {
      method: 'PATCH',
    }).then((r) => r.json()),
};
