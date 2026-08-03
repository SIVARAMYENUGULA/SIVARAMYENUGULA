const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const { setupSocketIO } = require('./src/services/socket.service');

const start = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    
    // Setup Socket.IO for proctoring real-time communication
    setupSocketIO(server);
    
    server.listen(env.port, () => {
      console.log(`PlaceMux API running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
