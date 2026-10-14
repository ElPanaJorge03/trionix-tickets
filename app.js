import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db.js';
import ticketsRouter from './routes/tickets.js';
import agentesRouter from './routes/agentes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares globales
app.use(express.json());
app.use(express.static('public'));

// Rutas de la API
app.use('/api/tickets', ticketsRouter);
app.use('/api/agentes', agentesRouter);

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Middleware para manejo de rutas 404 de la API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en la API de Trionix' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);

  // Manejo de error de índice único en MongoDB (código 11000)
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(400).json({
      error: `Violación de índice único: ya existe un registro con el valor ingresado en '${campo}'.`,
    });
  }

  // Manejo de ValidationError de Mongoose
  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: mensajes.join('. ') });
  }

  // Manejo de CastError de ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Identificador con formato no válido' });
  }

  // Error genérico del servidor
  res.status(500).json({
    error: 'Error interno del servidor. Por favor inténtelo más tarde.',
  });
});

// Conectar a MongoDB antes de levantar el servidor Express
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Servidor Trionix Tickets & Agentes`);
    console.log(` Escuchando en el puerto: ${PORT}`);
    console.log(` Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
    console.log(`=========================================`);
  });
};

startServer();

export default app;
