import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agente from './models/Agente.js';
import Ticket from './models/Ticket.js';

dotenv.config();

let mongoServer = null;

export const seedInitialData = async () => {
  const agentesCount = await Agente.countDocuments();
  if (agentesCount > 0) return;

  console.log('Sembrando datos iniciales de prueba en la base de datos...');

  await Agente.init();
  await Ticket.init();

  const agentes = await Agente.insertMany([
    {
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@trionix.com',
      especialidad: 'redes',
      activo: true,
    },
    {
      nombre: 'Valeria Gómez',
      email: 'valeria.gomez@trionix.com',
      especialidad: 'software',
      activo: true,
    },
    {
      nombre: 'Andrés Morales',
      email: 'andres.morales@trionix.com',
      especialidad: 'hardware',
      activo: true,
    },
    {
      nombre: 'Diana Ríos',
      email: 'diana.rios@trionix.com',
      especialidad: 'general',
      activo: true,
    },
    {
      nombre: 'Sebastián Peña (Inactivo)',
      email: 'sebastian.pena@trionix.com',
      especialidad: 'software',
      activo: false,
    },
  ]);

  const [carlos, valeria, andres, diana] = agentes;

  await Ticket.insertMany([
    {
      cliente: 'Banco Metropolitano',
      asunto: 'Caída intermitente en switch central de sucursal norte',
      prioridad: 'alta',
      estado: 'abierto',
      agenteId: carlos._id,
      comentarios: [
        {
          autor: 'Carlos Mendoza',
          texto: 'Se procedió a reiniciar módulo de fibra óptica; monitoreando latencias.',
          fecha: new Date(Date.now() - 3600 * 1000 * 3),
        },
      ],
    },
    {
      cliente: 'Logística Express S.A.S.',
      asunto: 'Error 500 al sincronizar facturas en pasarela de pagos',
      prioridad: 'alta',
      estado: 'abierto',
      agenteId: valeria._id,
      comentarios: [
        {
          autor: 'Valeria Gómez',
          texto: 'Identificado timeout en el webhook externo. Preparando parche.',
          fecha: new Date(Date.now() - 3600 * 1000 * 2),
        },
        {
          autor: 'Cliente Logística',
          texto: 'Por favor confirmar cuando quede listo para reintentar lote.',
          fecha: new Date(Date.now() - 3600 * 1000 * 1),
        },
      ],
    },
    {
      cliente: 'Clínica Salud Total',
      asunto: 'Fallo en disco duro secundario de estación de rayos X',
      prioridad: 'media',
      estado: 'resuelto',
      agenteId: andres._id,
      comentarios: [
        {
          autor: 'Andrés Morales',
          texto: 'Se reemplazó unidad por SSD nuevo y se restauró respaldo.',
          fecha: new Date(Date.now() - 3600 * 1000 * 24),
        },
      ],
    },
    {
      cliente: 'Colegio Los Pinos',
      asunto: 'Solicitud de creación de 15 cuentas de correo para nuevos docentes',
      prioridad: 'baja',
      estado: 'resuelto',
      agenteId: diana._id,
      comentarios: [
        {
          autor: 'Diana Ríos',
          texto: 'Cuentas aprovisionadas y credenciales temporales enviadas al rector.',
          fecha: new Date(Date.now() - 3600 * 1000 * 48),
        },
      ],
    },
    {
      cliente: 'Inversiones del Caribe',
      asunto: 'Lentitud general al cargar reportes mensuales en ERP',
      prioridad: 'media',
      estado: 'abierto',
      agenteId: null,
      comentarios: [
        {
          autor: 'Sistema Trionix',
          texto: 'Ticket recibido a través del portal de clientes. Pendiente de asignación.',
          fecha: new Date(),
        },
      ],
    },
    {
      cliente: 'Distribuidora Nova',
      asunto: 'Impresora térmica de facturación no responde por puerto USB',
      prioridad: 'baja',
      estado: 'abierto',
      agenteId: null,
      comentarios: [],
    },
  ]);

  console.log('✅ Datos de prueba insertados con éxito.');
};

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('⚠️  No se encontró MONGODB_URI configurada.');
    console.log('🚀 Iniciando servidor MongoDB en memoria para desarrollo local...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(` MongoDB en memoria listo en: ${uri}`);
    } catch (err) {
      console.error('Error al inicializar MongoDB en memoria:', err.message);
      process.exit(1);
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB conectado exitosamente: ${conn.connection.host}/${conn.connection.name}`);
    await seedInitialData();
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
