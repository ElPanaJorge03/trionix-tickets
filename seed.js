import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agente from './models/Agente.js';
import Ticket from './models/Ticket.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: Defina MONGODB_URI en su archivo .env antes de ejecutar el seed.');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log('Conectando a MongoDB para cargar datos semilla...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión establecida.');

    // Limpiar colecciones existentes
    console.log('Limpiando colecciones anteriores...');
    await Ticket.deleteMany({});
    await Agente.deleteMany({});
    console.log('Colecciones limpiadas.');

    // Asegurar que los índices (como el unique en email) queden creados
    await Agente.init();
    await Ticket.init();

    // 1. Crear agentes de prueba
    console.log('Insertando agentes iniciales...');
    const agentesData = [
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
    ];

    const agentesInsertados = await Agente.insertMany(agentesData);
    console.log(`Se insertaron ${agentesInsertados.length} agentes.`);

    const [carlos, valeria, andres, diana] = agentesInsertados;

    // 2. Crear tickets iniciales con y sin agentes asignados, y con comentarios embebidos
    console.log('Insertando tickets de prueba...');
    const ticketsData = [
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
        agenteId: null, // Sin asignar inicialmente
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
        agenteId: null, // Sin asignar
        comentarios: [],
      },
    ];

    const ticketsInsertados = await Ticket.insertMany(ticketsData);
    console.log(`Se insertaron ${ticketsInsertados.length} tickets de prueba.`);

    console.log('¡Base de datos sembrada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar la base de datos:', error);
    process.exit(1);
  }
};

seedDatabase();
