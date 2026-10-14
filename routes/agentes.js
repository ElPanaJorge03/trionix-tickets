import express from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import Agente from '../models/Agente.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Esquema de validación para creación de Agente
const agenteCreateSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'El nombre del agente es obligatorio',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede superar los 100 caracteres',
    'any.required': 'El nombre del agente es obligatorio',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'El email es obligatorio',
    'string.email': 'El email debe tener un formato válido (ej. usuario@dominio.com)',
    'any.required': 'El email es obligatorio',
  }),
  especialidad: Joi.string()
    .valid('redes', 'software', 'hardware', 'general')
    .required()
    .messages({
      'any.only': 'La especialidad debe ser una de las siguientes: redes, software, hardware, general',
      'any.required': 'La especialidad es obligatoria',
    }),
  activo: Joi.boolean().optional(),
});

// Esquema de validación para actualización de Agente
const agenteUpdateSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100).optional().messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede superar los 100 caracteres',
  }),
  email: Joi.string().trim().email().optional().messages({
    'string.email': 'El email debe tener un formato válido',
  }),
  especialidad: Joi.string()
    .valid('redes', 'software', 'hardware', 'general')
    .optional()
    .messages({
      'any.only': 'La especialidad debe ser una de las siguientes: redes, software, hardware, general',
    }),
  activo: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

// -------------------------------------------------------------
// BONUS 21: GET /api/agentes/stats
// IMPORTANTE: Definido antes de /:id para evitar colisión de rutas
// -------------------------------------------------------------
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Agente.aggregate([
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'agenteId',
          as: 'ticketsAsignados',
        },
      },
      {
        $project: {
          _id: 1,
          nombre: 1,
          email: 1,
          especialidad: 1,
          activo: 1,
          totalTickets: { $size: '$ticketsAsignados' },
          abiertos: {
            $size: {
              $filter: {
                input: '$ticketsAsignados',
                as: 't',
                cond: { $eq: ['$$t.estado', 'abierto'] },
              },
            },
          },
          resueltos: {
            $size: {
              $filter: {
                input: '$ticketsAsignados',
                as: 't',
                cond: { $eq: ['$$t.estado', 'resuelto'] },
              },
            },
          },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 7. GET /api/agentes — Lista todos los agentes (filtros opcionales ?especialidad= y ?activo=)
// -------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { especialidad, activo } = req.query;
    const filtro = {};

    if (especialidad) {
      filtro.especialidad = especialidad.toLowerCase();
    }

    if (activo !== undefined) {
      filtro.activo = activo === 'true' || activo === true;
    }

    const agentes = await Agente.find(filtro).sort({ createdAt: -1 });
    res.json(agentes);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 14. GET /api/agentes/:id/tickets — Lista tickets asignados a ese agente
// -------------------------------------------------------------
router.get('/:id/tickets', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const agente = await Agente.findById(id);
    if (!agente) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    const tickets = await Ticket.find({ agenteId: id })
      .populate('agenteId', 'nombre especialidad email')
      .sort({ createdAt: -1 });

    const ticketsTransformados = tickets.map((t) => {
      const obj = t.toObject();
      obj.agente = obj.agenteId || null;
      return obj;
    });

    res.json(ticketsTransformados);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 8. GET /api/agentes/:id — Un agente por id
// -------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const agente = await Agente.findById(id);
    if (!agente) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    res.json(agente);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// 9. POST /api/agentes — Crea un agente
// -------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = agenteCreateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join('. '),
      });
    }

    const nuevoAgente = new Agente(value);
    await nuevoAgente.save();

    res.status(201).json(nuevoAgente);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: `Ya existe un agente registrado con el correo electrónico proporcionado.`,
      });
    }
    next(error);
  }
});

// -------------------------------------------------------------
// 10. PUT /api/agentes/:id — Actualiza un agente
// -------------------------------------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const { error, value } = agenteUpdateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join('. '),
      });
    }

    const agenteActualizado = await Agente.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    });

    if (!agenteActualizado) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    res.json(agenteActualizado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'El correo electrónico ya se encuentra registrado por otro agente.',
      });
    }
    next(error);
  }
});

// -------------------------------------------------------------
// 11. DELETE /api/agentes/:id — Elimina un agente solo si no tiene tickets abiertos
// -------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'El ID proporcionado no tiene un formato válido de ObjectId' });
    }

    const agente = await Agente.findById(id);
    if (!agente) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    // Verificar si tiene tickets en estado 'abierto'
    const ticketsAbiertosCount = await Ticket.countDocuments({
      agenteId: id,
      estado: 'abierto',
    });

    if (ticketsAbiertosCount > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el agente porque tiene ${ticketsAbiertosCount} ticket(s) en estado abierto asignado(s). Debe reasignar o resolver los tickets antes de eliminarlo.`,
      });
    }

    await Agente.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
