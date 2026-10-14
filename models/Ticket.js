import mongoose from 'mongoose';

const comentarioSchema = new mongoose.Schema(
  {
    autor: {
      type: String,
      required: [true, 'El autor del comentario es requerido'],
      trim: true,
      minlength: [2, 'El autor debe tener al menos 2 caracteres'],
    },
    texto: {
      type: String,
      required: [true, 'El texto del comentario es requerido'],
      trim: true,
      minlength: [3, 'El comentario debe tener al menos 3 caracteres'],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    cliente: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
      minlength: [2, 'El cliente debe tener al menos 2 caracteres'],
      maxlength: [100, 'El cliente no puede exceder 100 caracteres'],
    },
    asunto: {
      type: String,
      required: [true, 'El asunto es obligatorio'],
      trim: true,
      minlength: [5, 'El asunto debe tener al menos 5 caracteres'],
      maxlength: [200, 'El asunto no puede exceder 200 caracteres'],
    },
    prioridad: {
      type: String,
      enum: {
        values: ['baja', 'media', 'alta'],
        message: 'Prioridad no válida. Valores permitidos: baja, media, alta',
      },
      required: [true, 'La prioridad es obligatoria'],
    },
    estado: {
      type: String,
      enum: {
        values: ['abierto', 'resuelto'],
        message: 'Estado no válido. Valores permitidos: abierto, resuelto',
      },
      default: 'abierto',
    },
    comentarios: [comentarioSchema],
    agenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agente',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Bonus 23: Índice sobre agenteId (y compuesto con estado para optimizar búsquedas frecuentes por agente y estado)
ticketSchema.index({ agenteId: 1, estado: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
