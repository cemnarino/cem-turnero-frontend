// js/consultoriosConfig.js - Configuración de consultorios disponibles

/**
 * Configuración de consultorios y pisos disponibles
 * Modifica estos arrays para cambiar las opciones del dropdown
 */

const CONSULTORIOS_CONFIG = {
  // Lista de consultorios disponibles
  consultorios: [
    'Consultorio 1',
    'Consultorio 2',
    'Consultorio 3',
    'Consultorio 4',
    'Consultorio 5',
    'Consultorio 6',
    // Agrega más consultorios aquí si es necesario
    // 'Consultorio 7',
    // 'Sala de Emergencias',
    // 'Consultorio Especializado',
  ],

  // Lista de pisos disponibles
  pisos: [
    'Planta Baja',
    'Piso 1',
    'Piso 2',
    'Piso 3',
    'Piso 4',
    'Piso 5',
    // Agrega más pisos aquí si es necesario
    // 'Piso 6',
    // 'Sótano',
  ],

  // Nombres de médicos sugeridos (opcional, para autocompletar)
  medicos: [
    // 'Dr. Juan Pérez',
    // 'Dra. María González',
    // Agrega médicos frecuentes aquí
  ],
};

// Hacer disponible globalmente
window.CONSULTORIOS_CONFIG = CONSULTORIOS_CONFIG;

console.log('✅ Configuración de consultorios cargada:', {
  totalConsultorios: CONSULTORIOS_CONFIG.consultorios.length,
  totalPisos: CONSULTORIOS_CONFIG.pisos.length,
});
