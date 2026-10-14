import mongoose from 'mongoose';

const agenteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del agente es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'El formato de email no es válido'],
    },
    especialidad: {
      type: String,
      enum: {
        values: ['redes', 'software', 'hardware', 'general'],
        message: 'Especialidad no válida. Valores permitidos: redes, software, hardware, general',
      },
      required: [true, 'La especialidad es obligatoria'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Agente = mongoose.model('Agente', agenteSchema);

export default Agente;
