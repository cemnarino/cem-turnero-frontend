// js/pacienteForm.js

(() => {
  const form = document.getElementById('pacienteForm');
  const title = document.getElementById('pacienteFormTitle');
  const btnGuardar = document.getElementById('btnPacGuardar');
  const btnCancelar = document.getElementById('btnPacCancelar');
  const consultorioSelect = document.getElementById('consultorio_id');
  const btnBuscarCedula = document.getElementById('btnBuscarCedula');
  const cedulaInput = document.getElementById('cedula');
  const resultadosDiv = document.getElementById('resultadosBusquedaCedula');

  let editingId = null;

  eventBus.on('edit-paciente', (p) => {
    editingId = p.id;
    Object.keys(p).forEach((k) => {
      const el = document.getElementById(k);
      if (el) el.value = p[k] ?? '';
    });
    btnGuardar.textContent = 'Actualizar';
    btnCancelar.style.display = 'inline-block';
    title.textContent = 'Editar Paciente';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    // Conversiones de tipos específicas
    data.valor = Number(data.valor) || 0;
    data.consultorio_id = Number(data.consultorio_id);
    data.numero_documento = String(data.numero_documento).trim();
    
    // Convertir hora_agendada a formato ISO si existe
    if (data.hora_agendada) {
      // El input datetime-local ya viene en formato correcto, solo agregar zona horaria
      const localDate = new Date(data.hora_agendada);
      // Ajustar a UTC-5 (Colombia)
      data.hora_agendada = localDate.toISOString();
    } else {
      data.hora_agendada = null;
    }

    // Limpiar campos vacíos opcionales
    const optionalFields = [
      'segundo_nombre',
      'segundo_apellido',
      'eps',
      'afp',
      'arl',
      'cargo',
      'contacto',
      'responsable_empresa',
      'observacion',
    ];
    
    optionalFields.forEach((field) => {
      if (!data[field] || data[field].trim() === '') {
        data[field] = null;
      }
    });

    // Validar que el número de documento sea alfanumérico
    if (!/^[0-9A-Za-z]{6,15}$/.test(data.numero_documento)) {
      showToast(
        'El número de documento debe tener entre 6 y 15 caracteres',
        'error'
      );
      return;
    }

    // Validar contacto si existe
    if (data.contacto && !/^[0-9]{7,10}$/.test(data.contacto)) {
      showToast(
        'El contacto debe ser un número de teléfono válido (7-10 dígitos)',
        'error'
      );
      return;
    }

    console.log('📋 Datos del paciente a enviar:', data);

    try {
      if (editingId) {
        await pacienteService.update(editingId, data);
        showToast('Paciente actualizado');
      } else {
        await pacienteService.create(data);
        showToast('Paciente registrado');
        
        // Recargar agenda si estaba abierta
        if (window.agendaManager) {
          window.agendaManager.reload();
        }
      }
      resetForm();
      // Emitir eventos para actualizar todas las vistas relacionadas
      eventBus.emit('refresh-pacientes');
      eventBus.emit('refresh-turnos');
      eventBus.emit('refresh-historial');
      eventBus.emit('refresh-informante');
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      showToast('Error al guardar paciente', 'error');
    }
  });
  btnCancelar.addEventListener('click', resetForm);

  // Validación en tiempo real para el campo número de documento
  const numeroDocInput = document.getElementById('numero_documento');
  if (numeroDocInput) {
    // Permitir números y letras (para CE y otros documentos)
    numeroDocInput.addEventListener('input', (e) => {
      // Remover caracteres especiales, permitir números y letras
      e.target.value = e.target.value.replace(/[^0-9A-Za-z]/g, '');

      // Limpiar resultados de búsqueda cuando se modifica el documento
      if (resultadosDiv) {
        resultadosDiv.style.display = 'none';
        resultadosDiv.innerHTML = '';
      }
    });

    // Validar cuando el usuario salga del campo
    numeroDocInput.addEventListener('blur', (e) => {
      const value = e.target.value.trim();
      if (value && (value.length < 6 || value.length > 15)) {
        e.target.setCustomValidity(
          'El documento debe tener entre 6 y 15 caracteres'
        );
        e.target.reportValidity();
      } else {
        e.target.setCustomValidity('');
      }
    });
  }
  
  // Compatibilidad con código antiguo que usa 'cedula'
  if (cedulaInput && !numeroDocInput) {
    cedulaInput.id = 'numero_documento';
    cedulaInput.name = 'numero_documento';
  }

  // Funcionalidad de búsqueda por documento
  if (btnBuscarCedula && resultadosDiv) {
    btnBuscarCedula.addEventListener('click', async () => {
      const docInput = document.getElementById('numero_documento') || cedulaInput;
      const documento = docInput ? docInput.value.trim() : '';

      if (!documento) {
        showToast('Ingrese un número de documento para buscar', 'warning');
        return;
      }

      if (documento.length < 6) {
        showToast('El documento debe tener al menos 6 caracteres', 'warning');
        return;
      }

      try {
        btnBuscarCedula.disabled = true;
        btnBuscarCedula.innerHTML =
          '<i class="material-icons">hourglass_empty</i>';

        const resultado = await pacienteService.buscarPorCedula(documento);

        if (resultado.found && resultado.registros.length > 0) {
          mostrarResultadosBusqueda(resultado);
        } else {
          mostrarSinResultados();
        }
      } catch (error) {
        console.error('Error en búsqueda por documento:', error);
        if (error.message.includes('404')) {
          mostrarSinResultados();
        } else {
          showToast('Error al buscar paciente', 'error');
        }
      } finally {
        btnBuscarCedula.disabled = false;
        btnBuscarCedula.innerHTML = '<i class="material-icons">search</i>';
      }
    });
  }

  function resetForm() {
    form.reset();
    editingId = null;
    btnGuardar.textContent = 'Registrar';
    btnCancelar.style.display = 'none';
    title.textContent = 'Nuevo Paciente';
  }

  function safeArray(data) {
    return Array.isArray(data) ? data : [];
  }

  // Cargar consultorios en el select
  async function loadConsultorios() {
    const list = safeArray(await consultorioService.list());
    consultorioSelect.innerHTML = '<option value="">Seleccione...</option>';
    list
      .filter((c) => c.is_visible)
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.consultorio} - ${c.nombre_medico} (${c.piso})`;
        consultorioSelect.appendChild(opt);
      });
  }

  // Escuchar eventos para recargar consultorios
  eventBus.on('refresh-pacientes', loadConsultorios);

  // Funciones auxiliares para búsqueda por cédula
  function mostrarResultadosBusqueda(resultado) {
    const registroReciente = resultado.registros[0]; // El más reciente

    resultadosDiv.innerHTML = `
      <div class="busqueda-header">
        <h4>✅ Paciente encontrado</h4>
        <button type="button" class="close-btn" onclick="cerrarResultados()">
          <i class="material-icons">close</i>
        </button>
      </div>
      
      <div class="paciente-info">
        <div class="info-basica">
          <strong>${resultado.nombre_completo}</strong>
          <span class="cedula">CC: ${resultado.cedula}</span>
        </div>
        
        <div class="estadisticas">
          <div class="stat">
            <span class="label">Total visitas:</span>
            <span class="value">${resultado.total_registros}</span>
          </div>
          <div class="stat">
            <span class="label">Pendientes:</span>
            <span class="value pending">${resultado.stats.total_pendientes}</span>
          </div>
          <div class="stat">
            <span class="label">En atención:</span>
            <span class="value attention">${resultado.stats.total_en_atencion}</span>
          </div>
          <div class="stat">
            <span class="label">Atendidos:</span>
            <span class="value completed">${resultado.stats.total_atendidos}</span>
          </div>
        </div>
      </div>
      
      <div class="acciones-paciente">
        <button type="button" class="btn-accion" onclick="precargarDatos('${registroReciente.id}')">
          <i class="material-icons">person_add</i>
          Usar datos del último registro
        </button>
        <button type="button" class="btn-accion secondary" onclick="verHistorialCompleto('${resultado.cedula}')">
          <i class="material-icons">history</i>
          Ver historial completo
        </button>
      </div>
    `;

    resultadosDiv.style.display = 'block';

    // Agregar estilos si no existen
    if (!document.getElementById('busqueda-styles')) {
      const styles = document.createElement('style');
      styles.id = 'busqueda-styles';
      styles.textContent = `
        .cedula-input-group {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        
        .cedula-input-group input {
          flex: 1;
        }
        
        .search-btn {
          padding: 8px 12px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .search-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .search-btn:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
        }
        
        .busqueda-resultados {
          margin-top: 15px;
          padding: 15px;
          border: 2px solid #28a745;
          border-radius: 8px;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        }
        
        .busqueda-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .busqueda-header h4 {
          margin: 0;
          color: #155724;
        }
        
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c757d;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: rgba(0,0,0,0.1);
          color: #dc3545;
        }
        
        .info-basica {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #b1dfbb;
        }
        
        .info-basica strong {
          font-size: 16px;
          color: #155724;
        }
        
        .cedula {
          color: #6c757d;
          font-size: 14px;
        }
        
        .estadisticas {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          text-align: center;
          padding: 8px;
          background: rgba(255,255,255,0.7);
          border-radius: 4px;
        }
        
        .stat .label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 2px;
        }
        
        .stat .value {
          font-weight: bold;
          font-size: 16px;
        }
        
        .stat .value.pending { color: #856404; }
        .stat .value.attention { color: #004085; }
        .stat .value.completed { color: #155724; }
        
        .acciones-paciente {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn-accion {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .btn-accion:hover {
          background: #0056b3;
        }
        
        .btn-accion.secondary {
          background: #6c757d;
          border-color: #6c757d;
        }
        
        .btn-accion.secondary:hover {
          background: #545b62;
        }
        
        .sin-resultados {
          text-align: center;
          padding: 20px;
          color: #6c757d;
          font-style: italic;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function mostrarSinResultados() {
    resultadosDiv.innerHTML = `
      <div class="busqueda-header">
        <h4>ℹ️ Paciente nuevo</h4>
        <button type="button" class="close-btn" onclick="cerrarResultados()">
          <i class="material-icons">close</i>
        </button>
      </div>
      <div class="sin-resultados">
        No se encontraron registros anteriores para esta cédula.
        <br>Este será un nuevo paciente en el sistema.
      </div>
    `;
    resultadosDiv.style.display = 'block';
  }

  // Funciones globales para los botones
  window.cerrarResultados = function () {
    if (resultadosDiv) {
      resultadosDiv.style.display = 'none';
      resultadosDiv.innerHTML = '';
    }
  };

  window.precargarDatos = async function (pacienteId) {
    try {
      const paciente = await pacienteService.get(pacienteId);

      // Precargar solo algunos campos útiles, no todos
      if (document.getElementById('primer_nombre'))
        document.getElementById('primer_nombre').value =
          paciente.primer_nombre || '';
      if (document.getElementById('segundo_nombre'))
        document.getElementById('segundo_nombre').value =
          paciente.segundo_nombre || '';
      if (document.getElementById('primer_apellido'))
        document.getElementById('primer_apellido').value =
          paciente.primer_apellido || '';
      if (document.getElementById('segundo_apellido'))
        document.getElementById('segundo_apellido').value =
          paciente.segundo_apellido || '';
      if (document.getElementById('empresa'))
        document.getElementById('empresa').value = paciente.empresa || '';

      // NO precargar tipo_examen, valor, consultorio_id ya que son específicos de cada visita

      showToast('Datos del paciente precargados', 'success');
      cerrarResultados();
    } catch (error) {
      console.error('Error precargando datos:', error);
      showToast('Error al precargar datos', 'error');
    }
  };

  window.verHistorialCompleto = function (cedula) {
    // Cambiar a la pestaña de historial y hacer búsqueda por cédula
    const historialTab = document.querySelector(
      '.tab[data-target="historial-view"]'
    );
    if (historialTab) {
      historialTab.click();

      // Esperar a que la pestaña se active y luego hacer la búsqueda
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = cedula;
          searchInput.dispatchEvent(new Event('input'));
        }
      }, 300);
    }
  };

  loadConsultorios();
})();
