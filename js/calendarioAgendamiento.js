// js/calendarioAgendamiento.js - Calendario para formulario de agendamiento
(() => {
  'use strict';

  const DURACION_CONSULTA = 25; // minutos
  const HORARIOS = {
    // Lunes a Viernes
    semana: [
      { inicio: '07:00', fin: '12:00' },
      { inicio: '14:00', fin: '17:00' }
    ],
    // Sábados
    sabado: [
      { inicio: '07:00', fin: '12:00' }
    ]
  };

  let consultorioSeleccionado = null;
  let fechaSeleccionada = null;
  let slotSeleccionado = null;
  let citasExistentes = [];

  /**
   * Inicializa el calendario
   */
  function init() {
    const consultorioSelect = document.getElementById('consultorio-calendario');
    if (!consultorioSelect) {
      console.warn('⚠️ Select de consultorio-calendario no encontrado');
      return;
    }

    // Cargar consultorios
    cargarConsultorios();

    // Event listener para cambio de consultorio
    consultorioSelect.addEventListener('change', (e) => {
      consultorioSeleccionado = parseInt(e.target.value) || null;
      if (consultorioSeleccionado) {
        mostrarCalendario();
        renderizarCalendarioMes();
      } else {
        ocultarCalendario();
      }
    });

    console.log('✅ Calendario de agendamiento inicializado');
  }

  /**
   * Carga la lista de consultorios
   */
  async function cargarConsultorios() {
    try {
      const response = await fetch(`${API_URLS.base}/consultorios/`);
      if (!response.ok) throw new Error('Error cargando consultorios');

      const consultorios = await response.json();
      const select = document.getElementById('consultorio-calendario');
      
      select.innerHTML = '<option value="">Seleccione consultorio...</option>';
      consultorios.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        // Extraer solo el número del consultorio si viene como "Consultorio 1"
        const numeroConsultorio = c.consultorio.replace(/consultorio\s*/i, '').trim();
        option.textContent = `Consultorio ${numeroConsultorio} - ${c.medico}`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error cargando consultorios:', error);
    }
  }

  /**
   * Muestra el contenedor del calendario
   */
  function mostrarCalendario() {
    const container = document.getElementById('calendario-container');
    if (container) {
      container.style.display = 'block';
    }
  }

  /**
   * Oculta el contenedor del calendario
   */
  function ocultarCalendario() {
    const container = document.getElementById('calendario-container');
    if (container) {
      container.style.display = 'none';
    }
    fechaSeleccionada = null;
    slotSeleccionado = null;
  }

  /**
   * Renderiza el calendario del mes
   */
  function renderizarCalendarioMes() {
    const container = document.getElementById('agenda-calendar');
    if (!container) return;

    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    // Crear header
    const header = `
      <div class="calendar-header">
        <button type="button" id="prevMonth"><i class="material-icons">chevron_left</i></button>
        <h4>${obtenerNombreMes(mes)} ${año}</h4>
        <button type="button" id="nextMonth"><i class="material-icons">chevron_right</i></button>
      </div>
    `;

    // Crear grid de días
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let grid = '<div class="calendar-days">';
    
    // Headers de días
    diasSemana.forEach(dia => {
      grid += `<div class="calendar-day-header">${dia}</div>`;
    });

    // Obtener primer día del mes y total de días
    const primerDia = new Date(año, mes, 1).getDay();
    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    // Días vacíos al inicio
    for (let i = 0; i < primerDia; i++) {
      grid += '<div class="calendar-day other-month"></div>';
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia);
      const esHoy = fecha.toDateString() === hoy.toDateString();
      const esPasado = fecha < hoy && !esHoy;
      const esDomingo = fecha.getDay() === 0;
      const esSeleccionado = fechaSeleccionada && 
                             fecha.toDateString() === fechaSeleccionada.toDateString();

      let clases = 'calendar-day';
      if (esPasado || esDomingo) clases += ' disabled';
      if (esSeleccionado) clases += ' selected';

      grid += `
        <div class="${clases}" data-fecha="${fecha.toISOString()}" ${!esPasado && !esDomingo ? 'onclick="window.seleccionarFecha(this)"' : ''}>
          ${dia}
          ${esHoy ? '<div style="font-size: 10px; color: #6200ea;">Hoy</div>' : ''}
        </div>
      `;
    }

    grid += '</div>';

    container.innerHTML = header + grid;

    // Event listeners para navegar meses (implementación básica)
    // Nota: Para una implementación completa, necesitarías mantener el estado del mes actual
  }

  /**
   * Selecciona una fecha del calendario
   */
  window.seleccionarFecha = async function(elemento) {
    const fechaISO = elemento.dataset.fecha;
    fechaSeleccionada = new Date(fechaISO);

    // Actualizar UI
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    elemento.classList.add('selected');

    // Cargar y mostrar slots disponibles
    await cargarSlotsDia();
  };

  /**
   * Carga los slots disponibles para el día seleccionado
   */
  async function cargarSlotsDia() {
    if (!fechaSeleccionada || !consultorioSeleccionado) return;

    const container = document.getElementById('slots-disponibles');
    if (!container) return;

    // Mostrar loading
    container.innerHTML = '<div class="loading">Cargando disponibilidad...</div>';

    try {
      // Cargar citas existentes para esa fecha y consultorio
      const fechaStr = fechaSeleccionada.toISOString().split('T')[0];
      const response = await fetch(
        `${API_URLS.base}/pacientes/disponibilidad?fecha=${fechaStr}&consultorio_id=${consultorioSeleccionado}`
      );

      if (response.ok) {
        citasExistentes = await response.json();
      } else {
        // Si el endpoint no existe, cargar todas las citas y filtrar
        const respAllCitas = await fetch(`${API_URLS.base}/pacientes/`);
        const todasCitas = await respAllCitas.json();
        citasExistentes = todasCitas.filter(c => {
          if (!c.hora_agendada || c.consultorio_id !== consultorioSeleccionado) return false;
          const citaFecha = new Date(c.hora_agendada).toISOString().split('T')[0];
          return citaFecha === fechaStr;
        });
      }

      // Generar slots
      generarSlots();

    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      container.innerHTML = '<div class="error">Error al cargar disponibilidad</div>';
    }
  }

  /**
   * Genera los slots de tiempo disponibles
   */
  function generarSlots() {
    const container = document.getElementById('slots-disponibles');
    if (!container) return;

    const diaSemana = fechaSeleccionada.getDay();
    const horarios = diaSemana === 6 ? HORARIOS.sabado : HORARIOS.semana;

    let html = `<h5>📅 ${fechaSeleccionada.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h5>`;

    horarios.forEach((bloque, idx) => {
      html += `<div class="bloque-horario">`;
      html += `<h4>${idx === 0 ? 'Mañana' : 'Tarde'} (${bloque.inicio} - ${bloque.fin})</h4>`;
      html += `<div class="slots-grid">`;

      const slots = generarSlotsBloque(bloque.inicio, bloque.fin);
      slots.forEach(slot => {
        const ocupado = esSlotOcupado(slot);
        const clases = ocupado ? 'slot-btn ocupado' : 'slot-btn disponible';
        const disabled = ocupado ? 'disabled' : '';

        html += `
          <button type="button" 
                  class="${clases}" 
                  data-hora="${slot}" 
                  ${disabled}
                  onclick="window.seleccionarSlot('${slot}', this)">
            ${slot}
          </button>
        `;
      });

      html += `</div></div>`;
    });

    container.innerHTML = html;
  }

  /**
   * Genera slots de tiempo para un bloque horario
   */
  function generarSlotsBloque(inicio, fin) {
    const slots = [];
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);

    let fecha = new Date(fechaSeleccionada);
    fecha.setHours(horaInicio, minInicio, 0, 0);

    const fechaFin = new Date(fechaSeleccionada);
    fechaFin.setHours(horaFin, minFin, 0, 0);

    while (fecha < fechaFin) {
      const hora = fecha.getHours().toString().padStart(2, '0');
      const min = fecha.getMinutes().toString().padStart(2, '0');
      slots.push(`${hora}:${min}`);
      
      // Avanzar 25 minutos
      fecha.setMinutes(fecha.getMinutes() + DURACION_CONSULTA);
    }

    return slots;
  }

  /**
   * Verifica si un slot está ocupado
   */
  function esSlotOcupado(horaSlot) {
    const [hora, min] = horaSlot.split(':').map(Number);
    const fechaSlot = new Date(fechaSeleccionada);
    fechaSlot.setHours(hora, min, 0, 0);

    return citasExistentes.some(cita => {
      const fechaCita = new Date(cita.hora_agendada);
      const diferencia = Math.abs(fechaCita - fechaSlot) / (1000 * 60); // diferencia en minutos
      return diferencia < DURACION_CONSULTA; // Si está dentro de 25 minutos, está ocupado
    });
  }

  /**
   * Selecciona un slot de tiempo
   */
  window.seleccionarSlot = function(hora, elemento) {
    // Remover selección anterior
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('seleccionado'));
    
    // Marcar como seleccionado
    elemento.classList.add('seleccionado');
    slotSeleccionado = hora;

    // Construir fecha y hora completa
    const [h, m] = hora.split(':').map(Number);
    const fechaCompleta = new Date(fechaSeleccionada);
    fechaCompleta.setHours(h, m, 0, 0);

    // Actualizar campos ocultos
    document.getElementById('hora_agendada_hidden').value = fechaCompleta.toISOString();
    document.getElementById('consultorio_id_final').value = consultorioSeleccionado;

    // Mostrar confirmación
    showToast(`✅ Hora seleccionada: ${fechaCompleta.toLocaleString('es-CO', { 
      dateStyle: 'short', 
      timeStyle: 'short' 
    })}`, 'success');
  };

  /**
   * Obtiene el nombre del mes
   */
  function obtenerNombreMes(mesIndex) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mesIndex];
  }

  /**
   * Muestra un toast
   */
  function showToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${tipo === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      animation: slideUp 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer para otros módulos
  window.calendarioAgendamiento = {
    reset: () => {
      consultorioSeleccionado = null;
      fechaSeleccionada = null;
      slotSeleccionado = null;
      ocultarCalendario();
    }
  };
})();
