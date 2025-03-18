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

// ✅ Load environment variables from .env file (remove redundant require)
dotenv.config();

// ✅ Connect to MongoDB database
connectDB();

// ✅ Initialize Express application
const app = express();

// ✅ Configure middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend access
app.use(express.json()); // Parse incoming JSON payloads in request bodies

// ✅ Register API routes (all endpoints under /api prefix)
app.use('/api', apiRoutes);

// ✅ Health check endpoint to verify the server is running
app.get('/', (req, res) => {
  res.send('API is running...');
});

/**
 * ✅ Manual data update endpoint
 * Triggers immediate data refresh from all sports APIs
 */
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

// ✅ Start server on specified port from environment or default to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
