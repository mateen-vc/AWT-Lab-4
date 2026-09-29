import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Connecting to MongoDB at ${uri.replace(/\/\/[^@]*@/, '//***:***@')}...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Failed to connect to MONGODB_URI: ${err.message}`);
      console.log('[Database] Falling back to MongoMemoryServer / in-memory instance...');
    }
  }

  // Fallback to MongoMemoryServer for instant zero-config local run
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    console.log(`[Database] Started In-Memory MongoServer at ${memUri}`);
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] Connected to In-Memory MongoDB successfully!`);
    return conn;
  } catch (memErr) {
    console.warn(`[Database] MongoMemoryServer not available: ${memErr.message}`);
    console.log('[Database] Operating with fallback schema mode.');
    return null;
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};
