/**
 * SystemInfo Schema
 * 
 * Stores application-wide configuration and status information
 * Uses a key-value pattern for flexibility in storing different types of system data
 */
import mongoose from 'mongoose';

const SystemInfoSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true  // Each key must be unique (e.g., 'lastUpdateTime')
  },
  value: {
    type: mongoose.Schema.Types.Mixed,  // Can store any type of data
    required: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const SystemInfo = mongoose.model('SystemInfo', SystemInfoSchema);
export default SystemInfo;