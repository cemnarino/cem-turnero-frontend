/**
 * COMPONENTE DE PAGINACIÓN REUTILIZABLE
 * ======================================
 * Maneja la paginación de listados de pacientes
 * 
 * Uso:
 * const pagination = new PaginationComponent(containerId, {
 *   onPageChange: (page, perPage) => {
 *     console.log('Cargar página:', page);
 *   },
 *   perPage: 20,
 *   showPageInfo: true
 * });
 * 
 * pagination.update(100); // Total de registros
 */

class PaginationComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return;
    }

    this.options = {
      perPage: options.perPage || 20,
      onPageChange: options.onPageChange || (() => {}),
      showPageInfo: options.showPageInfo !== false,
      showPerPageSelector: options.showPerPageSelector !== false,
      perPageOptions: options.perPageOptions || [10, 20, 50, 100]
    };

    this.currentPage = 1;
    this.totalRecords = 0;
    this.totalPages = 0;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="pagination-wrapper" style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; flex-wrap: wrap; gap: 15px;">
        <!-- Info de página -->
        <div class="pagination-info" style="color: #666; font-size: 14px;">
          <span id="paginationInfo">Mostrando 0 de 0 registros</span>
        </div>

        <!-- Controles de paginación -->
        <div class="pagination-controls" style="display: flex; align-items: center; gap: 10px;">
          <!-- Botón Primera -->
          <button 
            id="btnFirstPage" 
            class="btn btn-sm btn-outline-secondary" 
            title="Primera página"
            style="padding: 5px 10px;">
            <i class="material-icons" style="font-size: 18px;">first_page</i>
          </button>

          <!-- Botón Anterior -->
          <button 
            id="btnPrevPage" 
            class="btn btn-sm btn-outline-secondary"
            title="Página anterior"
            style="padding: 5px 10px;">
            <i class="material-icons" style="font-size: 18px;">chevron_left</i>
          </button>

          <!-- Indicador de página -->
          <span id="pageIndicator" style="margin: 0 10px; font-weight: 500;">
            Página 1 de 1
          </span>

          <!-- Botón Siguiente -->
          <button 
            id="btnNextPage" 
            class="btn btn-sm btn-outline-secondary"
            title="Página siguiente"
            style="padding: 5px 10px;">
            <i class="material-icons" style="font-size: 18px;">chevron_right</i>
          </button>

          <!-- Botón Última -->
          <button 
            id="btnLastPage" 
            class="btn btn-sm btn-outline-secondary"
            title="Última página"
            style="padding: 5px 10px;">
            <i class="material-icons" style="font-size: 18px;">last_page</i>
          </button>
        </div>

        <!-- Selector de registros por página -->
        ${this.options.showPerPageSelector ? `
        <div class="per-page-selector" style="display: flex; align-items: center; gap: 10px;">
          <label for="perPageSelect" style="margin: 0; font-size: 14px;">Mostrar:</label>
          <select id="perPageSelect" class="form-select form-select-sm" style="width: auto; padding: 5px 10px;">
            ${this.options.perPageOptions.map(option => 
              `<option value="${option}" ${option === this.options.perPage ? 'selected' : ''}>${option}</option>`
            ).join('')}
          </select>
          <span style="font-size: 14px;">por página</span>
        </div>
        ` : ''}
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Botones de navegación
    const btnFirst = this.container.querySelector('#btnFirstPage');
    const btnPrev = this.container.querySelector('#btnPrevPage');
    const btnNext = this.container.querySelector('#btnNextPage');
    const btnLast = this.container.querySelector('#btnLastPage');

    if (btnFirst) btnFirst.addEventListener('click', () => this.goToPage(1));
    if (btnPrev) btnPrev.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    if (btnNext) btnNext.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    if (btnLast) btnLast.addEventListener('click', () => this.goToPage(this.totalPages));

    // Selector de registros por página
    const perPageSelect = this.container.querySelector('#perPageSelect');
    if (perPageSelect) {
      perPageSelect.addEventListener('change', (e) => {
        this.options.perPage = parseInt(e.target.value);
        this.currentPage = 1; // Volver a la primera página
        this.calculatePages();
        this.updateUI();
        this.options.onPageChange(this.currentPage, this.options.perPage);
      });
    }
  }

  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.updateUI();
    this.options.onPageChange(this.currentPage, this.options.perPage);
  }

  update(totalRecords) {
    this.totalRecords = totalRecords;
    this.calculatePages();
    this.updateUI();
  }

  calculatePages() {
    this.totalPages = Math.ceil(this.totalRecords / this.options.perPage) || 1;
    
    // Ajustar página actual si excede el total
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  updateUI() {
    // Actualizar indicador de página
    const pageIndicator = this.container.querySelector('#pageIndicator');
    if (pageIndicator) {
      pageIndicator.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
    }

    // Actualizar info de registros
    const paginationInfo = this.container.querySelector('#paginationInfo');
    if (paginationInfo) {
      const start = ((this.currentPage - 1) * this.options.perPage) + 1;
      const end = Math.min(this.currentPage * this.options.perPage, this.totalRecords);
      paginationInfo.textContent = `Mostrando ${start} - ${end} de ${this.totalRecords} registros`;
    }

    // Habilitar/deshabilitar botones
    const btnFirst = this.container.querySelector('#btnFirstPage');
    const btnPrev = this.container.querySelector('#btnPrevPage');
    const btnNext = this.container.querySelector('#btnNextPage');
    const btnLast = this.container.querySelector('#btnLastPage');

    if (btnFirst) btnFirst.disabled = this.currentPage === 1;
    if (btnPrev) btnPrev.disabled = this.currentPage === 1;
    if (btnNext) btnNext.disabled = this.currentPage === this.totalPages;
    if (btnLast) btnLast.disabled = this.currentPage === this.totalPages;
  }

  reset() {
    this.currentPage = 1;
    this.totalRecords = 0;
    this.totalPages = 1;
    this.updateUI();
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getPerPage() {
    return this.options.perPage;
  }

  getTotalPages() {
    return this.totalPages;
  }

  getTotalRecords() {
    return this.totalRecords;
  }
}

// Hacer disponible globalmente
window.PaginationComponent = PaginationComponent;
