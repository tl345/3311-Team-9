/**
 * Database Connection Configuration
 * 
 * This module handles connecting to the MongoDB database using Mongoose
 * It:
 * 1. Establishes a connection to the MongoDB Atlas cluster
 * 2. Uses the connection string from environment variables for security
 * 3. Implements error handling for connection failures
 * 4. Provides feedback on successful connections
 * 
 * The connection is used by all data models throughout the application
 */
import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database
 * Uses environment variable for connection string to keep credentials secure
 * Automatically handles connection pooling via Mongoose
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Establish connection to MongoDB Atlas cluster
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // Log success message with connection details
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error and exit application on connection failure
    // This prevents the server from running without database access
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
