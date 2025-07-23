// js/router.js
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    function switchTab(btn) {
      document
        .querySelectorAll('.tab')
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document
        .querySelectorAll('.view')
        .forEach((v) => v.classList.remove('active'));
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;

      target.classList.add('active');

      // Eventos correctos
      const t = btn.dataset.target;

      // Emitir evento de cambio de pestaña
      eventBus.emit('tab-changed', t);

      if (t === 'consultorios-view') eventBus.emit('refresh-list');
      if (t === 'pacientes-view') eventBus.emit('refresh-pacientes');
      if (t === 'turnos-view') eventBus.emit('refresh-turnos');
      if (t === 'historial-view') eventBus.emit('refresh-historial');
      if (t === 'informante-view') eventBus.emit('refresh-informante');
    }

    document
      .querySelectorAll('.tab')
      .forEach((btn) => btn.addEventListener('click', () => switchTab(btn)));

    document.querySelector('.tab[data-target="consultorios-view"]').click();
  });
})();
