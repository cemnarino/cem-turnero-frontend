/**
 * COMPONENTE DE BÚSQUEDA REUTILIZABLE
 * ====================================
 * Componente de búsqueda con debounce para listas de pacientes
 * 
 * Uso:
 * const search = new SearchComponent(containerId, {
 *   onSearch: (searchTerm) => {
 *     console.log('Buscar:', searchTerm);
 *   },
 *   placeholder: 'Buscar paciente...',
 *   debounceMs: 500
 * });
 */

class SearchComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return;
    }

    this.options = {
      placeholder: options.placeholder || '🔍 Buscar por nombre, documento, empresa...',
      onSearch: options.onSearch || (() => {}),
      debounceMs: options.debounceMs || 500,
      minChars: options.minChars || 0,
      showClearButton: options.showClearButton !== false,
      showSearchButton: options.showSearchButton || false
    };

    this.searchTerm = '';
    this.debounceTimeout = null;

    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="search-component" style="margin: 20px 0;">
        <div class="input-group">
          <span class="input-group-text" style="background-color: #f8f9fa;">
            <i class="material-icons" style="font-size: 20px; color: #666;">search</i>
          </span>
          <input 
            type="text" 
            id="searchInput"
            class="form-control" 
            placeholder="${this.options.placeholder}"
            aria-label="Búsqueda"
            style="border-left: none;"
          />
          ${this.options.showClearButton ? `
            <button 
              id="clearSearchBtn" 
              class="btn btn-outline-secondary" 
              type="button"
              style="display: none;"
              title="Limpiar búsqueda">
              <i class="material-icons" style="font-size: 20px;">close</i>
            </button>
          ` : ''}
          ${this.options.showSearchButton ? `
            <button 
              id="searchBtn" 
              class="btn btn-primary" 
              type="button"
              title="Buscar">
              <i class="material-icons" style="font-size: 20px;">search</i>
            </button>
          ` : ''}
        </div>
        <small class="text-muted" style="display: block; margin-top: 5px;">
          Presiona Enter para buscar o espera un momento después de escribir
        </small>
      </div>
    `;
  }

  attachEvents() {
    const input = this.container.querySelector('#searchInput');
    const clearBtn = this.container.querySelector('#clearSearchBtn');
    const searchBtn = this.container.querySelector('#searchBtn');

    if (!input) return;

    // Evento input con debounce
    input.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.trim();

      // Mostrar/ocultar botón de limpiar
      if (clearBtn) {
        clearBtn.style.display = this.searchTerm ? 'block' : 'none';
      }

      // Debounce: esperar a que termine de escribir
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.searchTerm.length >= this.options.minChars) {
          this.performSearch();
        } else if (this.searchTerm.length === 0) {
          this.performSearch(); // Buscar todo si está vacío
        }
      }, this.options.debounceMs);
    });

    // Evento Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(this.debounceTimeout);
        this.performSearch();
      }
    });

    // Botón limpiar
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }

    // Botón buscar
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        clearTimeout(this.debounceTimeout);
        this.performSearch();
      });
    }
  }

  performSearch() {
    if (this.options.onSearch) {
      this.options.onSearch(this.searchTerm);
    }
  }

  clear() {
    const input = this.container.querySelector('#searchInput');
    const clearBtn = this.container.querySelector('#clearSearchBtn');

    if (input) {
      input.value = '';
      this.searchTerm = '';
    }

    if (clearBtn) {
      clearBtn.style.display = 'none';
    }

    this.performSearch();
  }

  getSearchTerm() {
    return this.searchTerm;
  }

  setSearchTerm(term) {
    const input = this.container.querySelector('#searchInput');
    if (input) {
      input.value = term;
      this.searchTerm = term;
    }
  }

  disable() {
    const input = this.container.querySelector('#searchInput');
    const clearBtn = this.container.querySelector('#clearSearchBtn');
    const searchBtn = this.container.querySelector('#searchBtn');

    if (input) input.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
    if (searchBtn) searchBtn.disabled = true;
  }

  enable() {
    const input = this.container.querySelector('#searchInput');
    const clearBtn = this.container.querySelector('#clearSearchBtn');
    const searchBtn = this.container.querySelector('#searchBtn');

    if (input) input.disabled = false;
    if (clearBtn) clearBtn.disabled = false;
    if (searchBtn) searchBtn.disabled = false;
  }
}

// Hacer disponible globalmente
window.SearchComponent = SearchComponent;
