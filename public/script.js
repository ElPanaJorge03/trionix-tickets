// ============================================================
// script.js — Lógica del frontend de Trionix Labs
// ============================================================

// ---------------------------------------------------------------
// CONSTANTE DE LA URL BASE DE LA API
// ---------------------------------------------------------------
const API_URL = '/api/tickets';

// ---------------------------------------------------------------
// REFERENCIAS A ELEMENTOS DEL DOM
// ---------------------------------------------------------------
const formTicket       = document.getElementById('form-ticket');
const campoCiente      = document.getElementById('campo-cliente');
const campoAsunto      = document.getElementById('campo-asunto');
const campoPrioridad   = document.getElementById('campo-prioridad');
const divError         = document.getElementById('form-error');
const listaTickets     = document.getElementById('lista-tickets');
const ticketCount      = document.getElementById('ticket-count');
const filtroEstado     = document.getElementById('filtro-estado');
const filtroPrioridad  = document.getElementById('filtro-prioridad');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

// ---------------------------------------------------------------
// ESTADO LOCAL (caché de datos)
// ---------------------------------------------------------------
let todosLosTickets = [];

// ---------------------------------------------------------------
// FUNCIONES AUXILIARES
// ---------------------------------------------------------------

function claseBadgePrioridad(prioridad) {
  const clases = {
    alta:  'badge-alta',
    media: 'badge-media',
    baja:  'badge-baja'
  };
  return clases[prioridad] || 'badge-baja';
}

function claseBadgeEstado(estado) {
  const clases = {
    abierto:  'badge-abierto',
    resuelto: 'badge-resuelto'
  };
  return clases[estado] || 'badge-abierto';
}

// Genera el HTML completo de una tarjeta de ticket.
function crearHTMLTarjeta(ticket) {
  const claseResuelto = ticket.estado === 'resuelto' ? 'resuelto' : '';

  // El botón "Marcar como resuelto" solo aparece si el ticket está abierto.
  const botonResolver = ticket.estado === 'abierto'
    ? `<button
         class="btn btn-success"
         onclick="resolverTicket(${ticket.id})"
       >
         Marcar como resuelto
       </button>`
    : '';

  return `
    <div class="ticket-card ${claseResuelto}" id="ticket-${ticket.id}">
      <div class="ticket-card-header">
        <span class="badge ${claseBadgePrioridad(ticket.prioridad)}">
          ${ticket.prioridad}
        </span>
        <span class="badge ${claseBadgeEstado(ticket.estado)}">
          ${ticket.estado}
        </span>
      </div>
      <p class="ticket-cliente">${ticket.cliente}</p>
      <p class="ticket-asunto">${ticket.asunto}</p>
      <div class="ticket-acciones">
        ${botonResolver}
        <button
          class="btn btn-danger"
          onclick="eliminarTicket(${ticket.id})"
        >
          Eliminar
        </button>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------
// FUNCIÓN: renderizarLista
// Aplica los filtros activos y dibuja los tickets en el DOM.
// ---------------------------------------------------------------
function renderizarLista() {
  const estadoSeleccionado     = filtroEstado.value;
  const prioridadSeleccionada  = filtroPrioridad.value;

  const ticketsFiltrados = todosLosTickets.filter(ticket => {
    const pasaEstado     = estadoSeleccionado    === 'todos' || ticket.estado    === estadoSeleccionado;
    const pasaPrioridad  = prioridadSeleccionada === 'todos' || ticket.prioridad === prioridadSeleccionada;
    return pasaEstado && pasaPrioridad;
  });

  ticketCount.textContent = `${ticketsFiltrados.length} ${ticketsFiltrados.length === 1 ? 'ticket' : 'tickets'}`;

  if (ticketsFiltrados.length === 0) {
    const mensaje = todosLosTickets.length === 0
      ? 'No hay tickets registrados todavía.'
      : 'No hay tickets que coincidan con los filtros seleccionados.';
    listaTickets.innerHTML = `<p class="empty-state">${mensaje}</p>`;
    return;
  }

  listaTickets.innerHTML = ticketsFiltrados.map(crearHTMLTarjeta).join('');
}

// ---------------------------------------------------------------
// FUNCIÓN: cargarTickets — GET /api/tickets
// ---------------------------------------------------------------
async function cargarTickets() {
  try {
    const respuesta = await fetch(API_URL);
    const datos = await respuesta.json();
    todosLosTickets = datos;
    renderizarLista();
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    listaTickets.innerHTML = '<p class="empty-state">Error al conectar con el servidor.</p>';
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: crearTicket — POST /api/tickets
// ---------------------------------------------------------------
async function crearTicket(evento) {
  evento.preventDefault();

  const cliente   = campoCiente.value.trim();
  const asunto    = campoAsunto.value.trim();
  const prioridad = campoPrioridad.value;

  divError.textContent = '';

  // Validación en el cliente
  if (!cliente) {
    divError.textContent = 'El nombre del cliente es requerido.';
    return;
  }
  if (!asunto || asunto.length < 5) {
    divError.textContent = 'El asunto debe tener al menos 5 caracteres.';
    return;
  }
  if (!prioridad) {
    divError.textContent = 'Debes seleccionar una prioridad.';
    return;
  }

  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente, asunto, prioridad })
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      divError.textContent = errorData.error || 'Error al crear el ticket.';
      return;
    }

    formTicket.reset();
    await cargarTickets();

  } catch (error) {
    console.error('Error al crear ticket:', error);
    divError.textContent = 'Error de conexión. Verifica que el servidor esté activo.';
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: resolverTicket — PUT /api/tickets/:id
// ---------------------------------------------------------------
async function resolverTicket(id) {
  const ticket = todosLosTickets.find(t => t.id === id);
  if (!ticket) return;

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente:   ticket.cliente,
        asunto:    ticket.asunto,
        prioridad: ticket.prioridad,
        estado:    'resuelto'
      })
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      alert(`Error al resolver ticket: ${errorData.error}`);
      return;
    }

    const index = todosLosTickets.findIndex(t => t.id === id);
    todosLosTickets[index].estado = 'resuelto';
    renderizarLista();

  } catch (error) {
    console.error('Error al resolver ticket:', error);
    alert('Error de conexión al intentar resolver el ticket.');
  }
}

// ---------------------------------------------------------------
// FUNCIÓN: eliminarTicket — DELETE /api/tickets/:id
// ---------------------------------------------------------------
async function eliminarTicket(id) {
  const confirmacion = confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.');
  if (!confirmacion) return;

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      alert(`Error al eliminar ticket: ${errorData.error}`);
      return;
    }

    todosLosTickets = todosLosTickets.filter(t => t.id !== id);
    renderizarLista();

  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    alert('Error de conexión al intentar eliminar el ticket.');
  }
}

// ---------------------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------------------
formTicket.addEventListener('submit', crearTicket);
filtroEstado.addEventListener('change', renderizarLista);
filtroPrioridad.addEventListener('change', renderizarLista);
btnLimpiarFiltros.addEventListener('click', () => {
  filtroEstado.value = 'todos';
  filtroPrioridad.value = 'todos';
  renderizarLista();
});

// ---------------------------------------------------------------
// INICIALIZACIÓN
// ---------------------------------------------------------------
cargarTickets();
