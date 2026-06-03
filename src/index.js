import express from 'express';
import cors from 'cors';
import { config } from './config/server.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Basic API test route
app.get('/api/health', (req, res) => {

  res.json({
    status: 'online',
    message: 'Hello from the Express server!',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
app.listen(config.port, () => {
  console.log(`Server is running in ${config.env} mode on http://localhost:${config.port}`);
});
