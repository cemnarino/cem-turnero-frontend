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

      // Manejar visibilidad del navbar según la pestaña
      handleNavbarVisibility(t);

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

  /**
   * Maneja la visibilidad del navbar según la pestaña activa
   */
  function handleNavbarVisibility(activeTab) {
    const navbar = document.querySelector('.main-navbar');
    const tabBar = document.querySelector('.tab-bar');
    const toggleBtn = document.getElementById('toggleFullscreenBtn');

    if (!navbar) return;

    if (activeTab === 'informante-view') {
      // Ocultar navbar en el informante para máximo espacio visual
      navbar.style.display = 'none';

      // También ocultar la barra de pestañas en informante para pantalla completa
      if (tabBar) {
        tabBar.style.display = 'none';
      }

      // Agregar clase al body para ajustes adicionales
      document.body.classList.add('informante-fullscreen');

      // Actualizar icono del botón de toggle
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.material-icons');
        if (icon) {
          icon.textContent = 'fullscreen_exit';
          toggleBtn.title = 'Salir de pantalla completa';
        }
      }

      console.log('🖥️ Modo informante: navbar y pestañas ocultos');
    } else {
      // Mostrar navbar en todas las demás pestañas
      navbar.style.display = 'block';

      // Mostrar la barra de pestañas
      if (tabBar) {
        tabBar.style.display = 'flex';
      }

      // Remover clase del body
      document.body.classList.remove('informante-fullscreen');

      // Resetear icono del botón de toggle
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.material-icons');
        if (icon) {
          icon.textContent = 'fullscreen';
          toggleBtn.title = 'Activar pantalla completa';
        }
      }

      console.log('🖥️ Modo normal: navbar y pestañas visibles');
    }
  }

  /**
   * Manejar teclas de acceso rápido para el modo pantalla completa
   */
  document.addEventListener('keydown', (event) => {
    // F11 o Escape para toggle pantalla completa cuando estamos en informante
    if (
      (event.key === 'F11' || event.key === 'Escape') &&
      document
        .querySelector('.tab[data-target="informante-view"]')
        ?.classList.contains('active')
    ) {
      event.preventDefault();

      const toggleBtn = document.getElementById('toggleFullscreenBtn');
      if (toggleBtn) {
        toggleBtn.click();
      }
    }
  });
})();
