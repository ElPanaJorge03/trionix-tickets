import express from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import Ticket from '../models/Ticket.js';
import Agente from '../models/Agente.js';

const router = express.Router();

// Esquema de validación para crear ticket
const ticketCreateSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'El nombre del cliente es obligatorio',
    'string.min': 'El cliente debe tener al menos 2 caracteres',
    'string.max': 'El cliente no puede superar 100 caracteres',
    'any.required': 'El cliente es obligatorio',
  }),
  asunto: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'El asunto es obligatorio',
    'string.min': 'El asunto debe tener al menos 5 caracteres',
    'string.max': 'El asunto no puede superar 200 caracteres',
    'any.required': 'El asunto es obligatorio',
  }),
  prioridad: Joi.string().valid('baja', 'media', 'alta').required().messages({
    'any.only': 'La prioridad debe ser baja, media o alta',
    'any.required': 'La prioridad es obligatoria',
  }),
  // El estado se ignora si viene, siempre nace 'abierto'
  estado: Joi.string().optional(),
  agenteId: Joi.string().optional().allow(null, ''),
});

// Esquema de validación para actualizar ticket
const ticketUpdateSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'El cliente debe tener al menos 2 caracteres',
    'string.max': 'El cliente no puede superar 100 caracteres',
  }),
  asunto: Joi.string().trim().min(5).max(200).optional().messages({
    'string.min': 'El asunto debe tener al menos 5 caracteres',
    'string.max': 'El asunto no puede superar 200 caracteres',
  }),
  prioridad: Joi.string().valid('baja', 'media', 'alta').optional().messages({
    'any.only': 'La prioridad debe ser baja, media o alta',
  }),
  estado: Joi.string().valid('abierto', 'resuelto').optional().messages({
    'any.only': 'El estado debe ser abierto o resuelto',
  }),
  agenteId: Joi.string().optional().allow(null),
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar',
});

// Esquema de validación para comentarios
const comentarioSchema = Joi.object({
  autor: Joi.string().trim().min(2).required().messages({
    'string.empty': 'El autor es obligatorio',
    'string.min': 'El autor debe tener al menos 2 caracteres',
    'any.required': 'El autor es obligatorio',
  }),
  texto: Joi.string().trim().min(3).required().messages({
    'string.empty': 'El texto del comentario es obligatorio',
    'string.min': 'El texto del comentario debe tener al menos 3 caracteres',
    'any.required': 'El texto del comentario es obligatorio',
  }),
});

// Esquema de asignación
const asignarSchema = Joi.object({
  agenteId: Joi.string().required().messages({
    'string.empty': 'El agenteId es requerido',
    'any.required': 'El agenteId es requerido',
  }),
});

// Función auxiliar para transformar el documento y asegurar el campo 'agente' resuelto o null
const formatTicketResponse = (ticketDoc) => {
  if (!ticketDoc) return null;
  const obj = ticketDoc.toObject ? ticketDoc.toObject() : { ...ticketDoc };
  obj.agente = obj.agenteId || null;
  return obj;
};

// -------------------------------------------------------------
// 1. GET /api/tickets — Lista tickets con filtros (?estado=, ?prioridad= y Bonus 22: ?q=)
// Requisito 13: Agente asignado resuelto mediante populate
// -------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { estado, prioridad, q } = req.query;
    const filtro = {};

    if (estado && ['abierto', 'resuelto'].includes(estado.toLowerCase())) {
      filtro.estado = estado.toLowerCase();
    }

    if (prioridad && ['baja', 'media', 'alta'].includes(prioridad.toLowerCase())) {
      filtro.prioridad = prioridad.toLowerCase();
    }

    // BONUS 22: Búsqueda con $regex sobre asunto y cliente
    if (q && q.trim() !== '') {
      const searchRegex = new RegExp(q.trim(), 'i');
      filtro.$or = [
        { asunto: searchRegex },
        { cliente: searchRegex },
      ];
    }

    const tickets = await Ticket.find(filtro)
      .populate('agenteId', 'nombre especialidad email')
      .sort({ createdAt: -1 });

    const formatted = tickets.map(formatTicketResponse);
    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 2. GET /api/tickets/:id — Un ticket por id con agente resuelto
// -------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const ticket = await Ticket.findById(id).populate('agenteId', 'nombre especialidad email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(formatTicketResponse(ticket));
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 3. POST /api/tickets — Crea un ticket (el estado siempre nace 'abierto')
// -------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = ticketCreateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join('. '),
      });
    }

    // Forzar estado siempre 'abierto'
    const datosTicket = {
      cliente: value.cliente,
      asunto: value.asunto,
      prioridad: value.prioridad,
      estado: 'abierto',
      comentarios: [],
      agenteId: null,
    };

    // Si opcionalmente envían un agenteId válido al crear, validamos que exista y esté activo
    if (value.agenteId && mongoose.Types.ObjectId.isValid(value.agenteId)) {
      const agente = await Agente.findById(value.agenteId);
      if (agente && agente.activo) {
        datosTicket.agenteId = agente._id;
      }
    }

    const nuevoTicket = new Ticket(datosTicket);
    await nuevoTicket.save();

    await nuevoTicket.populate('agenteId', 'nombre especialidad email');
    res.status(201).json(formatTicketResponse(nuevoTicket));
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 4. PUT /api/tickets/:id — Actualiza un ticket con Joi y runValidators: true
// -------------------------------------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const { error, value } = ticketUpdateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join('. '),
      });
    }

    const ticketActualizado = await Ticket.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    }).populate('agenteId', 'nombre especialidad email');

    if (!ticketActualizado) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(formatTicketResponse(ticketActualizado));
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 5. DELETE /api/tickets/:id — Elimina un ticket
// -------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const ticketEliminado = await Ticket.findByIdAndDelete(id);

    if (!ticketEliminado) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 6. POST /api/tickets/:id/comentarios — Agrega comentario embebido
// -------------------------------------------------------------
router.post('/:id/comentarios', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const { error, value } = comentarioSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join('. '),
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    ticket.comentarios.push({
      autor: value.autor,
      texto: value.texto,
      fecha: new Date(),
    });

    await ticket.save();
    await ticket.populate('agenteId', 'nombre especialidad email');

    res.status(201).json(formatTicketResponse(ticket));
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 12. POST /api/tickets/:id/asignar — Asigna un agente al ticket
// -------------------------------------------------------------
router.post('/:id/asignar', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar formato de ObjectId del ticket
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID del ticket no tiene un formato válido de ObjectId' });
    }

    // Validar esquema de entrada
    const { error, value } = asignarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { agenteId } = value;

    // Validar formato de ObjectId del agente
    if (!mongoose.Types.ObjectId.isValid(agenteId)) {
      return res.status(400).json({ error: 'El agenteId proporcionado no tiene un formato válido de ObjectId' });
    }

    // Validar que el ticket exista
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Validar que el agente exista y esté activo
    const agente = await Agente.findById(agenteId);
    if (!agente) {
      return res.status(404).json({ error: 'El agente especificado no existe' });
    }

    if (!agente.activo) {
      return res.status(400).json({
        error: `El agente ${agente.nombre} está actualmente inactivo y no puede recibir nuevas asignaciones`,
      });
    }

    // Actualizar ticket
    ticket.agenteId = agente._id;
    await ticket.save();

    await ticket.populate('agenteId', 'nombre especialidad email');

    res.status(200).json(formatTicketResponse(ticket));
  } catch (error) {
    next(error);
  }
});

export default router;
