/**
 * Team Model
 * 
 * The model uses a flexible schema that accommodates different 
 * standings formats across sports while maintaining consistency.
 */
import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamId: { 
    type: String, 
    required: true, 
    unique: true // Format: "{league}_{id}" (e.g., "nba_14" for Lakers)
  },
  league: { 
    type: String, 
    required: true, 
    enum: ['NBA', 'NFL', 'EPL'] 
  },
  name: { 
    type: String, 
    required: true // Internal name, may differ from display name
  },
  displayName: { 
    type: String, 
    required: true // User-facing name for the team
  },
  logo: String, // URL to team logo image
  city: String,
  standings: {
    rank: Number,
    wins: Number,
    losses: Number,
    draws: Number,
    points: Number,
    gamesPlayed: Number,
    winPercentage: Number
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now // Timestamp of last data update
  }
});

const Team = mongoose.model('Team', TeamSchema);
export default Team;
