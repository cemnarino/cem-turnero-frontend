// js/historialPage.js

(() => {
  const btnPendientes = document.getElementById('btnPendientes');
  const btnAtendidos = document.getElementById('btnAtendidos');
  const fechaDesde = document.getElementById('fechaDesde');
  const fechaHasta = document.getElementById('fechaHasta');
  const btnFiltrar = document.getElementById('btnFiltrarFechas');
  const btnLimpiar = document.getElementById('btnLimpiarFiltros');
  const searchInput = document.getElementById('searchInput');
  const tbody = document.querySelector('#historialTable tbody');
  const noResultados = document.getElementById('noResultados');

  let pacientes = [];
  let consultorios = {};
  let mostrarAtendidos = false;

  init();

  async function init() {
    // Cargar consultorios
    const cons = await consultorioService.list();
    cons.filter((c) => c.is_visible).forEach((c) => (consultorios[c.id] = c));

    // Cargar pacientes
    pacientes = await pacienteService.list();
    pacientes = pacientes.filter((p) => p.hora_entrada); // solo los que ingresaron
    renderTabla(pacientes);
    bindEvents();
  }

  function bindEvents() {
    btnPendientes.addEventListener('click', () => cambiarVista(false));
    btnAtendidos.addEventListener('click', () => cambiarVista(true));
    btnFiltrar.addEventListener('click', filtrar);
    btnLimpiar.addEventListener('click', limpiar);
    searchInput.addEventListener('input', filtrar);
  }

  function cambiarVista(atendidos) {
    mostrarAtendidos = atendidos;
    btnPendientes.classList.toggle('active', !atendidos);
    btnAtendidos.classList.toggle('active', atendidos);
    filtrar();
  }

  function filtrar() {
    let lista = mostrarAtendidos
      ? pacientes.filter((p) => p.atendido)
      : pacientes.filter((p) => !p.atendido);

    // Fechas
    const desde = fechaDesde.value
      ? new Date(fechaDesde.value + 'T00:00:00')
      : null;
    const hasta = fechaHasta.value
      ? new Date(fechaHasta.value + 'T23:59:59')
      : null;
    if (desde) lista = lista.filter((p) => new Date(p.hora_entrada) >= desde);
    if (hasta) lista = lista.filter((p) => new Date(p.hora_entrada) <= hasta);

    // Búsqueda libre
    const txt = searchInput.value.toLowerCase();
    if (txt)
      lista = lista.filter(
        (p) =>
          pacienteService.getNombreCompleto(p).toLowerCase().includes(txt) ||
          p.cedula.toString().includes(txt) ||
          p.tipo_examen.toLowerCase().includes(txt)
      );

    renderTabla(lista);
  }

  function limpiar() {
    fechaDesde.value = '';
    fechaHasta.value = '';
    searchInput.value = '';
    cambiarVista(false);
  }

  function renderTabla(lista) {
    tbody.innerHTML = '';
    noResultados.style.display = lista.length ? 'none' : 'block';

    // obtener turno actual de cada consultorio (una vez)
    let turnoActual = {};
    for (const c of Object.values(consultorios)) {
      turnoActual[c.id] = c.current_turn || 0;
    }

    lista.forEach((p) => {
      const cons = consultorios[p.consultorio_id];
      const act = turnoActual[p.consultorio_id] || 0;
      let badgeClass, badgeText;

      if (p.turno === act) {
        badgeClass = 'chip en-atencion'; /* azul pastel */
        badgeText = 'En Atención';
      } else if (p.atendido) {
        badgeClass = 'chip atendido'; /* verde pastel */
        badgeText = 'Atendido';
      } else {
        badgeClass = 'chip pendiente'; /* naranja pastel */
        badgeText = 'Pendiente';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${p.id}</td>
      <td>${pacienteService.getNombreCompleto(p)}</td>
      <td>${p.cedula}</td>
      <td>${p.tipo_examen}</td>
      <td>${p.empresa || 'N/A'}</td>
      <td>$${p.valor.toLocaleString('es-CO')}</td>
      <td>${cons ? cons.consultorio : 'N/A'}</td>
      <td>${p.turno || '—'}</td>
      <td><span class="${badgeClass}">${badgeText}</span></td>
      <td>${new Date(p.hora_entrada).toLocaleString('es-CO')}</td>
    `;
      tbody.appendChild(tr);
    });
  }

  // Primera carga
  eventBus.on('refresh-historial', init);
})();
