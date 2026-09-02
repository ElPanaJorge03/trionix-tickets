// ============================================================
// app.js — Servidor backend de Trionix Labs
// ============================================================

const express = require('express');
const Joi = require('joi');
const app = express();
const PORT = 8080;

// ---------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------

app.use(express.json());
app.use(express.static('public'));

// ---------------------------------------------------------------
// BASE DE DATOS EN MEMORIA
// ---------------------------------------------------------------

let tickets = [];
let nextId = 1;

// ---------------------------------------------------------------
// ESQUEMA DE VALIDACIÓN CON JOI
// ---------------------------------------------------------------

const ticketSchema = Joi.object({
  cliente: Joi.string().required(),
  asunto: Joi.string().min(5).required(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').required(),
  estado: Joi.string().valid('abierto', 'resuelto').optional()
});

// ---------------------------------------------------------------
// ENDPOINTS DE LA API
// ---------------------------------------------------------------

// GET /api/tickets
app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

// GET /api/tickets/:id
app.get('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }

  res.json(ticket);
});

// POST /api/tickets
app.post('/api/tickets', (req, res) => {
  const { error, value } = ticketSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const nuevoTicket = {
    id: nextId++,
    cliente: value.cliente,
    asunto: value.asunto,
    prioridad: value.prioridad,
    estado: 'abierto'
  };

  tickets.push(nuevoTicket);
  res.status(201).json(nuevoTicket);
});

// PUT /api/tickets/:id
app.put('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tickets.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }

  const { error, value } = ticketSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  tickets[index] = {
    id: tickets[index].id,
    cliente: value.cliente,
    asunto: value.asunto,
    prioridad: value.prioridad,
    estado: value.estado || tickets[index].estado
  };

  res.json(tickets[index]);
});

// DELETE /api/tickets/:id
app.delete('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tickets.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket no encontrado' });
  }

  tickets.splice(index, 1);
  res.status(204).send();
});

// ---------------------------------------------------------------
// INICIO DEL SERVIDOR
// ---------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Servidor Trionix corriendo en http://localhost:${PORT}`);
});
