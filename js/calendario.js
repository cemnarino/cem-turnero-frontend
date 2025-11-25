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
    console.log('📅 Cargando consultorios para calendario...');
    const response = await fetch(`${API_URLS.base}/consultorios/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const consultorios = await response.json();
    console.log('📅 Consultorios cargados:', consultorios);
    
    const select = document.getElementById('calendario-consultorio');
    if (!select) {
      console.warn('⚠️ Select calendario-consultorio no encontrado');
      return;
    }
    
    select.innerHTML = '<option value="">Seleccione consultorio...</option>';
    
    consultorios
      .filter(c => c.is_visible)
      .forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nombre_medico ? 
          `${c.consultorio} - ${c.nombre_medico}` : 
          c.consultorio;
        select.appendChild(option);
        console.log(`  ✓ ${option.textContent}`);
      });
      
  } catch (error) {
    console.error('❌ Error al cargar consultorios:', error);
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
    // Cargar consultor io para obtener información
    const consultorioResponse = await fetch(`${API_URLS.base}/consultorios/${consultorioSeleccionado}`);
    if (!consultorioResponse.ok) throw new Error('Error cargando consultorio');
    const consultorio = await consultorioResponse.json();
    
    // Cargar pacientes agendados para ese día y consultorio
    const pacientesResponse = await fetch(
      `${API_URLS.base}/pacientes/?consultorio_id=${consultorioSeleccionado}&fecha=${fechaSeleccionada}`
    );
    if (!pacientesResponse.ok) throw new Error('Error cargando pacientes');
    const pacientes = await pacientesResponse.json();
    
    // Filtrar solo los agendados para esta fecha
    const citasAgendadas = pacientes.filter(p => {
      if (!p.hora_agendada) return false;
      const fechaCita = new Date(p.hora_agendada).toISOString().split('T')[0];
      return fechaCita === fechaSeleccionada;
    });
    
    // Generar slots y marcar ocupados
    const slots = generarSlots(fechaSeleccionada, citasAgendadas);
    calendarioState.slotsDisponibles = slots;
    
    // Preparar datos para mostrar
    const data = {
      consultorio: consultorio.consultorio,
      nombre_medico: consultorio.nombre_medico || 'Sin médico asignado',
      fecha: fechaSeleccionada,
      dia_semana: obtenerDiaSemana(fechaSeleccionada),
      slots: slots,
      slots_disponibles: slots.filter(s => s.disponible).length,
      slots_ocupados: slots.filter(s => !s.disponible).length,
      disponible: true
    };
    
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
 * Genera slots de horarios disponibles
 */
function generarSlots(fecha, citasAgendadas) {
  const diaSemana = new Date(fecha + 'T00:00:00').getDay();
  const slots = [];
  
  // Determinar horarios según día de la semana
  let horarios;
  if (diaSemana === 0) {
    // Domingo - no hay atención
    return [];
  } else if (diaSemana === 6) {
    // Sábado - solo mañana
    horarios = [HORARIOS.sabado.manana];
  } else {
    // Lunes a Viernes
    horarios = [HORARIOS.lunes_viernes.manana, HORARIOS.lunes_viernes.tarde];
  }
  
  // Generar slots para cada bloque horario
  horarios.forEach(bloque => {
    const [horaInicio, minInicio] = bloque.inicio.split(':').map(Number);
    const [horaFin, minFin] = bloque.fin.split(':').map(Number);
    
    let hora = horaInicio;
    let min = minInicio;
    
    while (hora < horaFin || (hora === horaFin && min <= minFin)) {
      const horaStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Verificar si este slot está ocupado
      const estaOcupado = citasAgendadas.some(cita => {
        if (!cita.hora_agendada) return false;
        const horaCita = new Date(cita.hora_agendada);
        const horaSlot = `${horaCita.getHours().toString().padStart(2, '0')}:${horaCita.getMinutes().toString().padStart(2, '0')}`;
        return horaSlot === horaStr;
      });
      
      slots.push({
        hora: horaStr,
        disponible: !estaOcupado
      });
      
      // Avanzar 25 minutos
      min += DURACION_SLOT;
      if (min >= 60) {
        hora += Math.floor(min / 60);
        min = min % 60;
      }
    }
  });
  
  return slots;
}

/**
 * Obtiene el nombre del día de la semana
 */
function obtenerDiaSemana(fechaStr) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const fecha = new Date(fechaStr + 'T00:00:00');
  return dias[fecha.getDay()];
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
  
  // Limpiar contenedores visuales
  const container = document.getElementById('slots-container');
  if (container) container.innerHTML = '';
  
  const confirmDiv = document.getElementById('slot-confirmacion');
  if (confirmDiv) confirmDiv.style.display = 'none';
  
  // Limpiar campos del formulario
  const consultorioSelect = document.getElementById('calendario-consultorio');
  if (consultorioSelect) consultorioSelect.value = '';
  
  const fechaInput = document.getElementById('calendario-fecha');
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
    calendarioState.fechaSeleccionada = hoy;
  }
  
  const horaAgendadaInput = document.getElementById('hora_agendada');
  if (horaAgendadaInput) horaAgendadaInput.value = '';
  
  const consultorioInput = document.getElementById('consultorio_id');
  if (consultorioInput) consultorioInput.value = '';
  
  console.log('✅ Calendario reseteado');
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
