// ============================================================
// script.js — Lógica interactiva del cliente Trionix Labs
// SPA sin recargas de página con fetch, manejo amigable de errores,
// tabs de tickets y agentes, modal de comentarios y asignación en tiempo real.
// ============================================================

const API_TICKETS = '/api/tickets';
const API_AGENTES = '/api/agentes';

// Estado local en memoria
let ticketsGlobal = [];
let agentesGlobal = [];

// Elementos del DOM — Pestañas y Vistas
const tabTickets = document.getElementById('tab-btn-tickets');
const tabAgentes = document.getElementById('tab-btn-agentes');
const viewTickets = document.getElementById('view-tickets');
const viewAgentes = document.getElementById('view-agentes');
const tabTicketCount = document.getElementById('tab-ticket-count');
const tabAgentCount = document.getElementById('tab-agent-count');

// Elementos del DOM — Tickets
const formTicket = document.getElementById('form-ticket');
const campoCliente = document.getElementById('campo-cliente');
const campoAsunto = document.getElementById('campo-asunto');
const campoPrioridad = document.getElementById('campo-prioridad');
const campoAgenteInicial = document.getElementById('campo-agente-inicial');
const formTicketError = document.getElementById('form-ticket-error');
const listaTickets = document.getElementById('lista-tickets');
const ticketCount = document.getElementById('ticket-count');
const filtroBusqueda = document.getElementById('filtro-busqueda');
const filtroEstado = document.getElementById('filtro-estado');
const filtroPrioridad = document.getElementById('filtro-prioridad');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

// Elementos del DOM — Agentes
const formAgente = document.getElementById('form-agente');
const campoAgenteNombre = document.getElementById('campo-agente-nombre');
const campoAgenteEmail = document.getElementById('campo-agente-email');
const campoAgenteEspecialidad = document.getElementById('campo-agente-especialidad');
const campoAgenteActivo = document.getElementById('campo-agente-activo');
const formAgenteError = document.getElementById('form-agente-error');
const listaAgentes = document.getElementById('lista-agentes');
const agentCount = document.getElementById('agent-count');
const filtroAgenteEspecialidad = document.getElementById('filtro-agente-especialidad');
const filtroAgenteActivo = document.getElementById('filtro-agente-activo');
const statsSummary = document.getElementById('stats-summary');

// Modal de comentarios
const modalComentario = document.getElementById('modal-comentario');
const formComentario = document.getElementById('form-comentario');
const comentarioTicketId = document.getElementById('comentario-ticket-id');
const comentarioAutor = document.getElementById('comentario-autor');
const comentarioTexto = document.getElementById('comentario-texto');
const modalComentarioError = document.getElementById('modal-comentario-error');
const toastContainer = document.getElementById('toast-container');

// -------------------------------------------------------------
// SISTEMA DE NOTIFICACIONES TOAST (Requisito 19: Errores legibles)
// -------------------------------------------------------------
function mostrarToast(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  
  let icono = 'ℹ️';
  if (tipo === 'success') icono = '✅';
  if (tipo === 'error') icono = '❌';
  if (tipo === 'warning') icono = '⚠️';

  toast.innerHTML = `<span>${icono}</span> <div>${mensaje}</div>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// -------------------------------------------------------------
// CAMBIO DE PESTAÑAS (TABS)
// -------------------------------------------------------------
function cambiarPestana(pestana) {
  if (pestana === 'tickets') {
    tabTickets.classList.add('active');
    tabAgentes.classList.remove('active');
    viewTickets.classList.add('active');
    viewAgentes.classList.remove('active');
  } else {
    tabTickets.classList.remove('active');
    tabAgentes.classList.add('active');
    viewTickets.classList.remove('active');
    viewAgentes.classList.add('active');
    cargarStats();
  }
}

// -------------------------------------------------------------
// GESTIÓN DE AGENTES: CARGAR Y SELECTS
// -------------------------------------------------------------
async function cargarAgentes() {
  try {
    const res = await fetch(API_AGENTES);
    if (!res.ok) throw new Error('No se pudo obtener la lista de agentes');
    agentesGlobal = await res.json();

    // Actualizar contadores
    agentCount.textContent = `${agentesGlobal.length} ${agentesGlobal.length === 1 ? 'agente' : 'agentes'}`;
    tabAgentCount.textContent = agentesGlobal.length;

    // Poblar select del formulario de nuevo ticket
    poblarSelectAgentesIniciales();

    // Renderizar lista de agentes
    renderizarListaAgentes();

    // Re-renderizar tickets para reflejar selects de asignación
    renderizarListaTickets();
  } catch (error) {
    console.error('Error al cargar agentes:', error);
    mostrarToast('No se pudieron sincronizar los agentes: ' + error.message, 'error');
  }
}

function poblarSelectAgentesIniciales() {
  const agentesActivos = agentesGlobal.filter(a => a.activo);
  campoAgenteInicial.innerHTML = '<option value="">Sin asignar inicialmente</option>';
  agentesActivos.forEach(a => {
    campoAgenteInicial.innerHTML += `<option value="${a._id}">${a.nombre} (${a.especialidad})</option>`;
  });
}

function renderizarListaAgentes() {
  const esp = filtroAgenteEspecialidad.value;
  const act = filtroAgenteActivo.value;

  const filtrados = agentesGlobal.filter(a => {
    const matchEsp = esp === 'todas' || a.especialidad === esp;
    const matchAct = act === 'todos' || String(a.activo) === act;
    return matchEsp && matchAct;
  });

  if (filtrados.length === 0) {
    listaAgentes.innerHTML = `<p class="empty-state">No hay agentes que coincidan con el filtro.</p>`;
    return;
  }

  listaAgentes.innerHTML = filtrados.map(a => {
    const inicial = a.nombre.charAt(0).toUpperCase();
    const claseEstado = a.activo ? 'badge-active' : 'badge-inactive';
    const textoEstado = a.activo ? 'Activo' : 'Inactivo';

    return `
      <div class="agente-card" id="agente-${a._id}">
        <div class="agente-main-info">
          <div class="agente-big-avatar">${inicial}</div>
          <div class="agente-name-email">
            <h4>${a.nombre}</h4>
            <div class="agente-email">${a.email}</div>
            <div class="agente-badges">
              <span class="badge-spec">${a.especialidad}</span>
              <span class="badge ${claseEstado}">${textoEstado}</span>
            </div>
          </div>
        </div>
        <div class="agente-actions">
          <button class="btn btn-secondary btn-sm" onclick="toggleEstadoAgente('${a._id}', ${!a.activo})">
            ${a.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAgente('${a._id}', '${a.nombre}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// CREAR AGENTE
formAgente.addEventListener('submit', async (e) => {
  e.preventDefault();
  formAgenteError.classList.remove('visible');
  formAgenteError.textContent = '';

  const nombre = campoAgenteNombre.value.trim();
  const email = campoAgenteEmail.value.trim();
  const especialidad = campoAgenteEspecialidad.value;
  const activo = campoAgenteActivo.value === 'true';

  if (!nombre || nombre.length < 3) {
    mostrarErrorFormAgente('El nombre debe tener al menos 3 caracteres.');
    return;
  }
  if (!email || !email.includes('@')) {
    mostrarErrorFormAgente('Ingrese un correo electrónico válido.');
    return;
  }
  if (!especialidad) {
    mostrarErrorFormAgente('Debe seleccionar una especialidad.');
    return;
  }

  try {
    const res = await fetch(API_AGENTES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, especialidad, activo }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarErrorFormAgente(data.error || 'No se pudo crear el agente.');
      mostrarToast(data.error, 'error');
      return;
    }

    mostrarToast(`Agente "${data.nombre}" registrado exitosamente`, 'success');
    formAgente.reset();
    await cargarAgentes();
  } catch (err) {
    mostrarErrorFormAgente('Error de red al conectar con el servidor.');
    mostrarToast('Error al conectar con la API', 'error');
  }
});

function mostrarErrorFormAgente(msg) {
  formAgenteError.textContent = msg;
  formAgenteError.classList.add('visible');
}

// TOGGLE ESTADO AGENTE
async function toggleEstadoAgente(id, nuevoEstado) {
  try {
    const res = await fetch(`${API_AGENTES}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: nuevoEstado }),
    });

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'Error al cambiar estado del agente', 'error');
      return;
    }

    mostrarToast(`Estado actualizado: ${data.nombre} está ahora ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'info');
    await cargarAgentes();
  } catch (err) {
    mostrarToast('Error de conexión', 'error');
  }
}

// ELIMINAR AGENTE (Maneja 409 Conflict si tiene tickets abiertos)
async function eliminarAgente(id, nombre) {
  if (!confirm(`¿Confirma eliminar al agente ${nombre}? Solo se permite si no tiene tickets abiertos asignados.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_AGENTES}/${id}`, { method: 'DELETE' });

    if (res.status === 204) {
      mostrarToast(`Agente "${nombre}" eliminado correctamente`, 'success');
      await cargarAgentes();
      return;
    }

    const data = await res.json();
    if (res.status === 409) {
      mostrarToast(data.error, 'warning');
    } else {
      mostrarToast(data.error || 'No se pudo eliminar el agente', 'error');
    }
  } catch (err) {
    mostrarToast('Error de conexión al eliminar agente', 'error');
  }
}

// BONUS 21: ESTADÍSTICAS CON $lookup
async function cargarStats() {
  try {
    const res = await fetch(`${API_AGENTES}/stats`);
    if (!res.ok) return;
    const stats = await res.json();

    if (!stats || stats.length === 0) {
      statsSummary.innerHTML = '<p class="empty-state" style="padding: 1rem;">No hay estadísticas aún.</p>';
      return;
    }

    statsSummary.innerHTML = stats.map(s => `
      <div class="stat-item">
        <span><strong>${s.nombre}</strong> (${s.especialidad})</span>
        <div class="stat-counts">
          <span class="stat-open" title="Tickets abiertos">${s.abiertos} abiertos</span>
          <span>·</span>
          <span class="stat-done" title="Tickets resueltos">${s.resueltos} resueltos</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error stats:', err);
  }
}

// -------------------------------------------------------------
// GESTIÓN DE TICKETS: CARGAR Y RENDERIZAR
// -------------------------------------------------------------
async function cargarTickets() {
  try {
    const estado = filtroEstado.value;
    const prioridad = filtroPrioridad.value;
    const q = filtroBusqueda.value.trim();

    const params = new URLSearchParams();
    if (estado !== 'todos') params.append('estado', estado);
    if (prioridad !== 'todos') params.append('prioridad', prioridad);
    if (q) params.append('q', q);

    const url = `${API_TICKETS}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al consultar tickets');

    ticketsGlobal = await res.json();

    ticketCount.textContent = `${ticketsGlobal.length} ${ticketsGlobal.length === 1 ? 'ticket' : 'tickets'}`;
    tabTicketCount.textContent = ticketsGlobal.length;

    renderListaTicketsHTML(ticketsGlobal);
  } catch (error) {
    console.error('Error al cargar tickets:', error);
    listaTickets.innerHTML = `<p class="empty-state">Error al conectar con la base de datos.</p>`;
  }
}

function renderizarListaTickets() {
  renderListaTicketsHTML(ticketsGlobal);
}

function renderListaTicketsHTML(tickets) {
  if (!tickets || tickets.length === 0) {
    listaTickets.innerHTML = `<p class="empty-state">No se encontraron tickets con los criterios seleccionados.</p>`;
    return;
  }

  const agentesActivos = agentesGlobal.filter(a => a.activo);

  listaTickets.innerHTML = tickets.map(ticket => {
    const id = ticket._id;
    const esResuelto = ticket.estado === 'resuelto';
    const claseEstado = esResuelto ? 'resuelto' : 'abierto';
    const badgePrioridad = `badge-${ticket.prioridad}`;
    const badgeEstado = `badge-${ticket.estado}`;

    // Fecha formateada
    const fechaCreacion = ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })
      : '';

    // Agente resuelto (Requisito 13: populate('agenteId'))
    const agenteAsignado = ticket.agente;
    let agenteHTML = '';

    if (agenteAsignado && agenteAsignado.nombre) {
      const inicial = agenteAsignado.nombre.charAt(0).toUpperCase();
      agenteHTML = `
        <div class="agent-info">
          <div class="agent-avatar">${inicial}</div>
          <div>
            <span class="agent-name">${agenteAsignado.nombre}</span>
            <span class="agent-spec">${agenteAsignado.especialidad}</span>
          </div>
        </div>
      `;
    } else {
      agenteHTML = `<span class="agent-none">Sin asignar</span>`;
    }

    // Select para reasignación rápida de agentes activos
    const opcionesAgentes = agentesActivos.map(a => {
      const selected = agenteAsignado && (agenteAsignado._id === a._id || agenteAsignado === a._id) ? 'selected' : '';
      return `<option value="${a._id}" ${selected}>${a.nombre} (${a.especialidad})</option>`;
    }).join('');

    // Comentarios embebidos
    const comentarios = ticket.comentarios || [];
    const comentariosHTML = comentarios.map(c => `
      <div class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">${c.autor}</span>
          <span class="comment-date">${new Date(c.fecha || c.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div>${c.texto}</div>
      </div>
    `).join('');

    // Botón marcar resuelto (solo si está abierto)
    const botonResolver = !esResuelto
      ? `<button class="btn btn-success btn-sm" onclick="marcarResuelto('${id}')">
           ✓ Marcar Resuelto
         </button>`
      : `<button class="btn btn-secondary btn-sm" onclick="reabrirTicket('${id}')">
           ↺ Reabrir
         </button>`;

    return `
      <div class="ticket-card ${claseEstado}" id="ticket-${id}">
        <div class="ticket-card-header">
          <div class="badges-group">
            <span class="badge ${badgePrioridad}">${ticket.prioridad}</span>
            <span class="badge ${badgeEstado}">${ticket.estado}</span>
          </div>
          <span class="ticket-time">${fechaCreacion}</span>
        </div>

        <div class="ticket-cliente-box">
          <span class="ticket-cliente">${ticket.cliente}</span>
        </div>

        <p class="ticket-asunto">${ticket.asunto}</p>

        <!-- AGENTE ASIGNADO & ASIGNACIÓN (REQUISITO 12, 13, 18) -->
        <div class="ticket-agent-row">
          <div>
            <div style="font-size:0.75rem; color:var(--color-text-muted); margin-bottom:0.2rem; font-weight:600;">Agente Responsable:</div>
            ${agenteHTML}
          </div>

          <div class="assign-control">
            <select class="assign-select" id="select-asignar-${id}">
              <option value="">-- Asignar agente --</option>
              ${opcionesAgentes}
            </select>
            <button class="btn btn-primary btn-sm" onclick="asignarAgente('${id}')">
              Asignar
            </button>
          </div>
        </div>

        <!-- COMENTARIOS EMBEBIDOS (REQUISITO 6) -->
        <div class="ticket-comments-box">
          <div class="comments-header">
            <span>Comentarios (${comentarios.length})</span>
            <button class="btn btn-secondary btn-sm" onclick="abrirModalComentario('${id}')">
              + Agregar Comentario
            </button>
          </div>
          ${comentarios.length > 0 ? `<div class="comments-list">${comentariosHTML}</div>` : ''}
        </div>

        <!-- ACCIONES FINALES -->
        <div class="ticket-acciones">
          ${botonResolver}
          <button class="btn btn-danger btn-sm" onclick="eliminarTicket('${id}')">
            Eliminar Ticket
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// CREAR TICKET
formTicket.addEventListener('submit', async (e) => {
  e.preventDefault();
  formTicketError.classList.remove('visible');
  formTicketError.textContent = '';

  const cliente = campoCliente.value.trim();
  const asunto = campoAsunto.value.trim();
  const prioridad = campoPrioridad.value;
  const agenteId = campoAgenteInicial.value || null;

  if (!cliente || cliente.length < 2) {
    mostrarErrorFormTicket('El nombre del cliente debe tener al menos 2 caracteres.');
    return;
  }
  if (!asunto || asunto.length < 5) {
    mostrarErrorFormTicket('El asunto debe tener al mensaje explicativo (mínimo 5 caracteres).');
    return;
  }
  if (!prioridad) {
    mostrarErrorFormTicket('Seleccione una prioridad para el ticket.');
    return;
  }

  try {
    const payload = { cliente, asunto, prioridad };
    if (agenteId) payload.agenteId = agenteId;

    const res = await fetch(API_TICKETS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarErrorFormTicket(data.error || 'Error al crear el ticket.');
      mostrarToast(data.error, 'error');
      return;
    }

    mostrarToast(`Ticket creado con éxito para "${data.cliente}"`, 'success');
    formTicket.reset();
    await cargarTickets();
  } catch (err) {
    mostrarErrorFormTicket('Error de conexión al guardar el ticket.');
    mostrarToast('Error de red', 'error');
  }
});

function mostrarErrorFormTicket(msg) {
  formTicketError.textContent = msg;
  formTicketError.classList.add('visible');
}

// ASIGNAR AGENTE (POST /api/tickets/:id/asignar)
async function asignarAgente(ticketId) {
  const select = document.getElementById(`select-asignar-${ticketId}`);
  const agenteId = select.value;

  if (!agenteId) {
    mostrarToast('Seleccione un agente activo de la lista desplegable.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_TICKETS}/${ticketId}/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agenteId }),
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error || 'No se pudo asignar el agente', 'error');
      return;
    }

    const nombreAgente = data.agente ? data.agente.nombre : 'el agente';
    mostrarToast(`Agente ${nombreAgente} asignado correctamente`, 'success');
    await cargarTickets();
  } catch (err) {
    mostrarToast('Error de red al asignar el agente', 'error');
  }
}

// MARCAR COMO RESUELTO (PUT /api/tickets/:id)
async function marcarResuelto(ticketId) {
  try {
    const res = await fetch(`${API_TICKETS}/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'resuelto' }),
    });

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'No se pudo actualizar el ticket', 'error');
      return;
    }

    mostrarToast('Ticket marcado como resuelto', 'success');
    await cargarTickets();
  } catch (err) {
    mostrarToast('Error al actualizar estado del ticket', 'error');
  }
}

// REABRIR TICKET
async function reabrirTicket(ticketId) {
  try {
    const res = await fetch(`${API_TICKETS}/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'abierto' }),
    });

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error, 'error');
      return;
    }

    mostrarToast('Ticket reabierto', 'info');
    await cargarTickets();
  } catch (err) {
    mostrarToast('Error de conexión', 'error');
  }
}

// ELIMINAR TICKET (DELETE /api/tickets/:id)
async function eliminarTicket(ticketId) {
  if (!confirm('¿Confirma que desea eliminar este ticket? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const res = await fetch(`${API_TICKETS}/${ticketId}`, { method: 'DELETE' });

    if (res.status === 204) {
      mostrarToast('Ticket eliminado correctamente', 'success');
      await cargarTickets();
      return;
    }

    const data = await res.json();
    mostrarToast(data.error || 'No se pudo eliminar el ticket', 'error');
  } catch (err) {
    mostrarToast('Error al conectar para eliminar', 'error');
  }
}

// MODAL COMENTARIOS (POST /api/tickets/:id/comentarios)
function abrirModalComentario(ticketId) {
  comentarioTicketId.value = ticketId;
  comentarioAutor.value = '';
  comentarioTexto.value = '';
  modalComentarioError.classList.remove('visible');
  modalComentario.classList.add('active');
  comentarioAutor.focus();
}

function cerrarModalComentario() {
  modalComentario.classList.remove('active');
}

formComentario.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = comentarioTicketId.value;
  const autor = comentarioAutor.value.trim();
  const texto = comentarioTexto.value.trim();

  if (!autor || autor.length < 2) {
    modalComentarioError.textContent = 'El autor debe tener al menos 2 caracteres.';
    modalComentarioError.classList.add('visible');
    return;
  }
  if (!texto || texto.length < 3) {
    modalComentarioError.textContent = 'El texto debe tener al menos 3 caracteres.';
    modalComentarioError.classList.add('visible');
    return;
  }

  try {
    const res = await fetch(`${API_TICKETS}/${id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor, texto }),
    });

    const data = await res.json();
    if (!res.ok) {
      modalComentarioError.textContent = data.error || 'Error al guardar comentario.';
      modalComentarioError.classList.add('visible');
      return;
    }

    mostrarToast('Comentario añadido exitosamente', 'success');
    cerrarModalComentario();
    await cargarTickets();
  } catch (err) {
    modalComentarioError.textContent = 'Error de red con el servidor.';
    modalComentarioError.classList.add('visible');
  }
});

// EVENT LISTENERS DE FILTROS Y BÚSQUEDA
let debounceTimer;
filtroBusqueda.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    cargarTickets();
  }, 300);
});

filtroEstado.addEventListener('change', cargarTickets);
filtroPrioridad.addEventListener('change', cargarTickets);

btnLimpiarFiltros.addEventListener('click', () => {
  filtroBusqueda.value = '';
  filtroEstado.value = 'todos';
  filtroPrioridad.value = 'todos';
  cargarTickets();
});

filtroAgenteEspecialidad.addEventListener('change', renderizarListaAgentes);
filtroAgenteActivo.addEventListener('change', renderizarListaAgentes);

// INICIALIZACIÓN
async function init() {
  await cargarAgentes();
  await cargarTickets();
}

init();
