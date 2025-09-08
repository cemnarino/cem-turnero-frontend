# Estructura CSS Modular

Este proyecto utiliza ahora una estructura CSS modular para mejor organización y mantenibilidad del código.

## Archivos CSS

### `common.css` - Estilos Compartidos

Contiene todos los estilos que se utilizan en múltiples secciones:

- Variables CSS (:root)
- Reset CSS
- Navbar principal
- Sistema de pestañas (tabs)
- Encabezados de sección (h1, h2)
- Contenedores de tarjetas (cards)
- Formularios (forms, inputs, selects)
- Botones base
- Tablas
- Chips (etiquetas de estado)
- Utilidades comunes
- Notificaciones
- Sistema de carga de fragmentos
- Animaciones compartidas

### `consultorios.css` - Sección Consultorios

Estilos específicos para la gestión de consultorios. Actualmente utiliza principalmente estilos comunes.

### `pacientes.css` - Sección Pacientes

Estilos específicos para la gestión de pacientes. Actualmente utiliza principalmente estilos comunes.

### `turnos.css` - Sección Turnos

Estilos específicos para el manejo de turnos:

- Turno actual (diseño centrado y destacado)
- Número del turno (grande y prominente)
- Botones de acción (Siguiente Turno, Volver a Anunciar)
- Selector de consultorio
- Sección de pacientes en espera
- Panel de turnos
- Grupos de toggle

### `historial.css` - Sección Historial

Estilos específicos para el historial de pacientes:

- Botones de toggle (Pendientes/Atendidos)
- Acciones de exportación
- Botón de exportar a Excel

### `informante.css` - Sección Informante

Estilos específicos para la vista de informante (pantalla TV):

- Tarjetas de turno horizontales
- Información de pacientes
- Números de turno grandes
- Layout horizontal para múltiples consultorios

## Ventajas de la Estructura Modular

1. **Mantenibilidad**: Cada sección tiene sus propios estilos separados
2. **Organización**: Fácil encontrar estilos específicos de cada módulo
3. **Desarrollo Paralelo**: Diferentes desarrolladores pueden trabajar en diferentes módulos
4. **Reutilización**: Los estilos comunes se centralizan en `common.css`
5. **Rendimiento**: Se pueden cargar solo los CSS necesarios (futuro)
6. **Debugging**: Más fácil identificar problemas de CSS específicos

## Archivos de Respaldo

- `base.css.backup`: Contiene el CSS original monolítico por si necesitas recuperarlo

## Carga de CSS

Los archivos se cargan en este orden en `index.html`:

1. `common.css` (primero, para establecer base)
2. `consultorios.css`
3. `pacientes.css`
4. `turnos.css`
5. `historial.css`
6. `informante.css`

## Migración desde base.css

El archivo `base.css` original ha sido dividido inteligentemente:

- Todo lo compartido → `common.css`
- Estilos específicos de turnos → `turnos.css`
- Estilos específicos de historial → `historial.css`
- Estilos específicos de informante → `informante.css`
- Estilos específicos de consultorios → `consultorios.css`
- Estilos específicos de pacientes → `pacientes.css`

Esta estructura permite que el proyecto escale mejor y sea más fácil de mantener a largo plazo.
