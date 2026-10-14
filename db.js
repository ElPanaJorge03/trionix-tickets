import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('ERROR CRÍTICO: La variable de entorno MONGODB_URI no está configurada.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB conectado exitosamente: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
