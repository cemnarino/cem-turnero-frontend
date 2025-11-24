// js/agendaManager.js - Sistema de gestión de agenda

(() => {
  const HORARIOS = {
    lunes_viernes: [
      { inicio: 7, fin: 12 },
      { inicio: 14, fin: 17 },
    ],
    sabado: [{ inicio: 7, fin: 12 }],
    domingo: [], // No hay atención los domingos
  };

  const INTERVALO_MINUTOS = 30; // Cada cita dura 30 minutos

  let currentWeekStart = null;
  let appointments = [];

  /**
   * Inicializa el manager de agenda
   */
  function init() {
    // Crear modal si no existe
    createAgendaModal();

    // Event listener para el botón "Ver Agenda"
    const btnVerAgenda = document.getElementById('btnVerAgenda');
    if (btnVerAgenda) {
      btnVerAgenda.addEventListener('click', openAgenda);
    }

    console.log('✅ Agenda Manager inicializado');
  }

  /**
   * Crea el modal de agenda en el DOM
   */
  function createAgendaModal() {
    if (document.getElementById('agendaModal')) return;

    const modal = document.createElement('div');
    modal.id = 'agendaModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="width: 95%; max-width: 1400px;">
        <div class="modal-header">
          <h2>
            <i class="material-icons">calendar_today</i>
            Agenda de Citas
          </h2>
          <button class="modal-close" id="closeAgendaModal">×</button>
        </div>
        <div class="modal-body">
          <div class="agenda-controls">
            <div class="week-navigation">
              <button id="prevWeek">
                <i class="material-icons">chevron_left</i>
                Semana Anterior
              </button>
              <span id="weekLabel">Semana del ...</span>
              <button id="nextWeek">
                Semana Siguiente
                <i class="material-icons">chevron_right</i>
              </button>
              <button id="todayWeek" style="background: #28a745;">
                <i class="material-icons">today</i>
                Hoy
              </button>
            </div>
          </div>
          <div id="agendaGrid" class="agenda-grid">
            <!-- Se generará dinámicamente -->
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Leyenda:</h3>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 20px; background: white; border: 1px solid #ddd;"></div>
                <span>Disponible</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 20px; background: #fff3cd; border-left: 3px solid #ffc107;"></div>
                <span>Ocupado</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 20px; background: #f9f9f9; opacity: 0.6;"></div>
                <span>No disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeAgendaModal').addEventListener('click', closeAgenda);
    document.getElementById('prevWeek').addEventListener('click', () => changeWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => changeWeek(1));
    document.getElementById('todayWeek').addEventListener('click', goToToday);

    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAgenda();
      }
    });
  }

  /**
   * Abre el modal de agenda
   */
  async function openAgenda() {
    const modal = document.getElementById('agendaModal');
    if (!modal) return;

    // Inicializar con la semana actual
    goToToday();

    // Cargar citas existentes
    await loadAppointments();

    // Renderizar la agenda
    renderAgenda();

    // Mostrar modal
    modal.classList.add('active');
  }

  /**
   * Cierra el modal de agenda
   */
  function closeAgenda() {
    const modal = document.getElementById('agendaModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Va a la semana actual
   */
  function goToToday() {
    const today = new Date();
    // Obtener el lunes de la semana actual
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando sea domingo
    currentWeekStart = new Date(today.setDate(diff));
    currentWeekStart.setHours(0, 0, 0, 0);

    renderAgenda();
  }

  /**
   * Cambia de semana
   */
  function changeWeek(direction) {
    if (!currentWeekStart) return;

    currentWeekStart.setDate(currentWeekStart.getDate() + direction * 7);
    renderAgenda();
  }

  /**
   * Carga las citas existentes del servidor
   */
  async function loadAppointments() {
    try {
      // Obtener todas las citas con hora_agendada no nula
      const response = await fetch(`${API_BASE}/pacientes?is_visible=true&limit=1000`);
      if (!response.ok) throw new Error('Error cargando citas');

      const data = await response.json();
      appointments = data
        .filter((p) => p.hora_agendada && !p.atendido)
        .map((p) => ({
          id: p.id,
          fecha: new Date(p.hora_agendada),
          paciente: `${p.primer_nombre} ${p.primer_apellido}`,
          tipo_examen: p.tipo_examen,
          empresa: p.empresa,
        }));

      console.log(`📅 ${appointments.length} citas cargadas`);
    } catch (error) {
      console.error('Error cargando citas:', error);
      appointments = [];
    }
  }

  /**
   * Renderiza la agenda semanal
   */
  function renderAgenda() {
    if (!currentWeekStart) return;

    const agendaGrid = document.getElementById('agendaGrid');
    if (!agendaGrid) return;

    agendaGrid.innerHTML = '';

    // Actualizar etiqueta de semana
    updateWeekLabel();

    // Generar headers (días de la semana)
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    // Celda vacía para la esquina
    const cornerCell = document.createElement('div');
    cornerCell.className = 'agenda-header';
    cornerCell.textContent = 'Hora';
    agendaGrid.appendChild(cornerCell);

    // Headers de días
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);

      const header = document.createElement('div');
      header.className = 'agenda-header';
      header.innerHTML = `
        <div>${weekDays[i]}</div>
        <div style="font-size: 11px; font-weight: normal;">${date.getDate()} ${
        monthNames[date.getMonth()]
      }</div>
      `;
      agendaGrid.appendChild(header);
    }

    // Generar slots de horas
    const allHours = generateTimeSlots();

    allHours.forEach((hora) => {
      // Celda de hora
      const hourCell = document.createElement('div');
      hourCell.className = 'agenda-hour';
      hourCell.textContent = hora;
      agendaGrid.appendChild(hourCell);

      // Slots para cada día de la semana
      for (let dia = 0; dia < 7; dia++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + dia);

        const [horaNum, minuto] = hora.split(':').map(Number);
        date.setHours(horaNum, minuto, 0, 0);

        const slot = createSlot(date, dia);
        agendaGrid.appendChild(slot);
      }
    });
  }

  /**
   * Genera los slots de tiempo disponibles
   */
  function generateTimeSlots() {
    const slots = [];

    // Generar slots de 7:00 a 12:00
    for (let h = 7; h < 12; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    slots.push('12:00'); // Añadir 12:00

    // Generar slots de 14:00 a 17:00
    for (let h = 14; h < 17; h++) {
      slots.push(`${h}:00`);
      slots.push(`${h}:30`);
    }
    slots.push('17:00'); // Añadir 17:00

    return slots;
  }

  /**
   * Crea un slot de la agenda
   */
  function createSlot(date, dayOfWeek) {
    const slot = document.createElement('div');
    slot.className = 'agenda-slot';

    const now = new Date();
    const isPast = date < now;
    const isAvailable = isTimeSlotAvailable(date, dayOfWeek);

    // Buscar si hay una cita en este slot
    const appointment = findAppointmentAt(date);

    if (!isAvailable || isPast) {
      slot.classList.add('disabled');
    } else if (appointment) {
      slot.classList.add('occupied');
      slot.innerHTML = `
        <div class="appointment-info">
          <div class="name">${appointment.paciente}</div>
          <div class="details">${appointment.empresa || ''}</div>
        </div>
      `;
      slot.title = `${appointment.tipo_examen || 'Cita'}`;
    } else {
      // Slot disponible
      slot.addEventListener('click', () => selectTimeSlot(date));
      slot.title = 'Click para agendar';
    }

    return slot;
  }

  /**
   * Verifica si un slot de tiempo está disponible
   */
  function isTimeSlotAvailable(date, dayOfWeek) {
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Domingo (día 0) no hay atención
    if (dayOfWeek === 0) return false;

    // Sábado (día 6) solo mañanas
    if (dayOfWeek === 6) {
      return hour >= 7 && (hour < 12 || (hour === 12 && minute === 0));
    }

    // Lunes a Viernes
    const inMorning = hour >= 7 && (hour < 12 || (hour === 12 && minute === 0));
    const inAfternoon = hour >= 14 && (hour < 17 || (hour === 17 && minute === 0));

    return inMorning || inAfternoon;
  }

  /**
   * Busca una cita en una fecha específica
   */
  function findAppointmentAt(date) {
    return appointments.find((apt) => {
      const aptDate = new Date(apt.fecha);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        aptDate.getHours() === date.getHours() &&
        aptDate.getMinutes() === date.getMinutes()
      );
    });
  }

  /**
   * Selecciona un slot de tiempo
   */
  function selectTimeSlot(date) {
    // Formatear fecha para el input datetime-local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Establecer en el input del formulario
    const horaAgendadaInput = document.getElementById('hora_agendada');
    if (horaAgendadaInput) {
      horaAgendadaInput.value = datetimeLocal;
      showToast(
        `Hora seleccionada: ${date.toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}`
      );
    }

    // Cerrar el modal
    closeAgenda();
  }

  /**
   * Actualiza la etiqueta de la semana
   */
  function updateWeekLabel() {
    if (!currentWeekStart) return;

    const weekLabel = document.getElementById('weekLabel');
    if (!weekLabel) return;

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startStr = currentWeekStart.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    });
    const endStr = endOfWeek.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    weekLabel.textContent = `Semana del ${startStr} al ${endStr}`;
  }

  /**
   * Muestra un mensaje toast
   */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer función para recargar citas desde otros módulos
  window.agendaManager = {
    reload: async () => {
      await loadAppointments();
      renderAgenda();
    },
  };
})();
