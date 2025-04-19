/**
 * Express server for the sports stats backend
 * This is the main entry point of the backend application that:
 * 1. Configures the Express web server and middleware
 * 2. Connects to the MongoDB database
 * 3. Sets up API routes for frontend access
 * 4. Implements data update triggers (manual and eventually scheduled)
 * 5. Handles server startup and port configuration
 * 
 * The server uses a modular architecture where routes, database connection, and data services are implemented as separate modules
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { updateSportsData } from './services/updateService.js';

// ✅ Load environment variables from .env file
dotenv.config();

// ✅ Initialize Express application (must come BEFORE using `app`)
const app = express();

// ✅ Configure CORS before routes
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://3311-team-9-thiens-projects-c76e5f98.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ JSON body parser middleware
app.use(express.json());

// ✅ Connect to MongoDB database
connectDB();

// ✅ Register API routes
app.use('/api', apiRoutes);

// ✅ Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ✅ Manual data update endpoint
app.post('/api/update', async (req, res) => {
  try {
    const result = await updateSportsData();
    res.json({
      success: true,
      message: 'Sports data updated successfully',
      result
    });
  } catch (error) {
    console.error('Update failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sports data',
      error: error.message
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
