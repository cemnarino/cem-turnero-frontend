/**
 * Sistema de Calendario para Agendamiento de Citas
 * Muestra disponibilidad de slots en tiempo real
 */

// Configuración del calendario
const DURACION_SLOT = 25; // minutos
const HORARIOS = {
  lunes_viernes: {
    manana: { inicio: '07:00', fin: '12:00' },
    tarde: { inicio: '14:00', fin: '17:00' }
  },
  sabado: {
    manana: { inicio: '07:00', fin: '12:00' }
  }
};

// Estado del calendario
let calendarioState = {
  consultorioSeleccionado: null,
  fechaSeleccionada: null,
  slotsDisponibles: [],
  slotSeleccionado: null
};

/**
 * Inicializa el sistema de calendario
 */
function inicializarCalendario() {
  const consultorioSelect = document.getElementById('calendario-consultorio');
  const fechaInput = document.getElementById('calendario-fecha');
  
  if (!consultorioSelect || !fechaInput) {
    console.warn('⚠️ Elementos del calendario no encontrados');
    return;
  }
  
  // Cargar consultorios
  cargarConsultoriosCalendario();
  
  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.min = hoy;
  fechaInput.value = hoy;
  calendarioState.fechaSeleccionada = hoy;
  
  // Eventos
  consultorioSelect.addEventListener('change', (e) => {
    calendarioState.consultorioSeleccionado = parseInt(e.target.value);
    if (calendarioState.consultorioSeleccionado && calendarioState.fechaSeleccionada) {
      cargarDisponibilidad();
    }
  });
  
  fechaInput.addEventListener('change', (e) => {
    calendarioState.fechaSeleccionada = e.target.value;
    if (calendarioState.consultorioSeleccionado && calendarioState.fechaSeleccionada) {
      cargarDisponibilidad();
    }
  });
  
  console.log('✅ Calendario inicializado');
}

/**
 * Carga los consultorios disponibles
 */
async function cargarConsultoriosCalendario() {
  try {
    const response = await fetch(`${API_BASE_URL}/consultorios/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const consultorios = await response.json();
    const select = document.getElementById('calendario-consultorio');
    
    select.innerHTML = '<option value="">Seleccione consultorio...</option>';
    
    consultorios
      .filter(c => c.is_visible)
      .forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.consultorio} - ${c.nombre_medico}`;
        select.appendChild(option);
      });
      
  } catch (error) {
    console.error('Error al cargar consultorios:', error);
    mostrarError('No se pudieron cargar los consultorios');
  }
}

/**
 * Carga la disponibilidad de slots
 */
async function cargarDisponibilidad() {
  const { consultorioSeleccionado, fechaSeleccionada } = calendarioState;
  
  if (!consultorioSeleccionado || !fechaSeleccionada) return;
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/pacientes/disponibilidad/slots?consultorio_id=${consultorioSeleccionado}&fecha=${fechaSeleccionada}`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    calendarioState.slotsDisponibles = data.slots;
    
    mostrarSlots(data);
    
  } catch (error) {
    console.error('Error al cargar disponibilidad:', error);
    mostrarError('No se pudo cargar la disponibilidad');
  }
}

/**
 * Muestra los slots en la interfaz
 */
function mostrarSlots(data) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  
  // Mostrar información general
  const infoDiv = document.createElement('div');
  infoDiv.className = 'calendario-info';
  infoDiv.innerHTML = `
    <div class="info-header">
      <h3>${data.dia_semana}, ${formatearFecha(data.fecha)}</h3>
      <p>${data.consultorio} - ${data.nombre_medico}</p>
    </div>
    <div class="info-stats">
      <span class="stat disponible">
        <i class="material-icons">event_available</i>
        ${data.slots_disponibles} disponibles
      </span>
      <span class="stat ocupado">
        <i class="material-icons">event_busy</i>
        ${data.slots_ocupados} ocupados
      </span>
    </div>
  `;
  
  container.innerHTML = '';
  container.appendChild(infoDiv);
  
  if (!data.disponible) {
    const mensaje = document.createElement('div');
    mensaje.className = 'calendario-mensaje';
    mensaje.innerHTML = `<p>${data.mensaje}</p>`;
    container.appendChild(mensaje);
    return;
  }
  
  // Agrupar slots por bloque horario
  const slotsMañana = data.slots.filter(s => {
    const hora = parseInt(s.hora.split(':')[0]);
    return hora < 12;
  });
  
  const slotsTarde = data.slots.filter(s => {
    const hora = parseInt(s.hora.split(':')[0]);
    return hora >= 14;
  });
  
  // Mostrar bloques
  if (slotsMañana.length > 0) {
    const bloqueManana = crearBloqueSlots('Mañana (7:00 - 12:00)', slotsMañana);
    container.appendChild(bloqueManana);
  }
  
  if (slotsTarde.length > 0) {
    const bloqueTarde = crearBloqueSlots('Tarde (14:00 - 17:00)', slotsTarde);
    container.appendChild(bloqueTarde);
  }
}

/**
 * Crea un bloque de slots (mañana o tarde)
 */
function crearBloqueSlots(titulo, slots) {
  const bloque = document.createElement('div');
  bloque.className = 'bloque-horario';
  
  const tituloElem = document.createElement('h4');
  tituloElem.textContent = titulo;
  bloque.appendChild(tituloElem);
  
  const grid = document.createElement('div');
  grid.className = 'slots-grid';
  
  slots.forEach(slot => {
    const slotBtn = document.createElement('button');
    slotBtn.type = 'button';
    slotBtn.className = `slot-btn ${slot.disponible ? 'disponible' : 'ocupado'}`;
    slotBtn.textContent = slot.hora;
    slotBtn.disabled = !slot.disponible;
    
    if (slot.disponible) {
      slotBtn.addEventListener('click', () => seleccionarSlot(slot));
    }
    
    // Marcar si está seleccionado
    if (calendarioState.slotSeleccionado?.hora === slot.hora) {
      slotBtn.classList.add('seleccionado');
    }
    
    grid.appendChild(slotBtn);
  });
  
  bloque.appendChild(grid);
  return bloque;
}

/**
 * Selecciona un slot
 */
function seleccionarSlot(slot) {
  calendarioState.slotSeleccionado = slot;
  
  // Actualizar visualización
  document.querySelectorAll('.slot-btn').forEach(btn => {
    btn.classList.remove('seleccionado');
  });
  event.target.classList.add('seleccionado');
  
  // Actualizar el campo hora_agendada en el formulario
  const fechaHora = `${calendarioState.fechaSeleccionada}T${slot.hora}`;
  const horaAgendadaInput = document.getElementById('hora_agendada');
  if (horaAgendadaInput) {
    horaAgendadaInput.value = fechaHora;
  }
  
  // Actualizar también el consultorio en el formulario
  const consultorioInput = document.getElementById('consultorio_id');
  if (consultorioInput) {
    consultorioInput.value = calendarioState.consultorioSeleccionado;
  }
  
  console.log('✅ Slot seleccionado:', fechaHora);
  
  // Mostrar confirmación
  mostrarConfirmacion(slot);
}

/**
 * Muestra confirmación del slot seleccionado
 */
function mostrarConfirmacion(slot) {
  const confirmDiv = document.getElementById('slot-confirmacion');
  if (!confirmDiv) return;
  
  confirmDiv.innerHTML = `
    <div class="confirmacion-content">
      <i class="material-icons">check_circle</i>
      <p>Cita agendada para: <strong>${slot.hora}</strong></p>
      <p class="hint">Complete el formulario para confirmar</p>
    </div>
  `;
  confirmDiv.style.display = 'block';
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  return fecha.toLocaleDateString('es-CO', opciones);
}

/**
 * Muestra un mensaje de error
 */
function mostrarError(mensaje) {
  const container = document.getElementById('slots-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="calendario-error">
      <i class="material-icons">error_outline</i>
      <p>${mensaje}</p>
    </div>
  `;
}

/**
 * Resetea el calendario
 */
function resetearCalendario() {
  calendarioState = {
    consultorioSeleccionado: null,
    fechaSeleccionada: null,
    slotsDisponibles: [],
    slotSeleccionado: null
  };
  
  const container = document.getElementById('slots-container');
  if (container) container.innerHTML = '';
  
  const confirmDiv = document.getElementById('slot-confirmacion');
  if (confirmDiv) confirmDiv.style.display = 'none';
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarCalendario);
} else {
  inicializarCalendario();
}

// Exportar funciones globales
window.calendarioFunctions = {
  inicializarCalendario,
  cargarDisponibilidad,
  resetearCalendario
};
