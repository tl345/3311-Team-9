/**
 * Player Model
 * 
 * This schema defines the structure for player data across all supported sports:
 * - NBA: Basketball players with points, assists, rebounds, etc.
 * - NFL: Football players with touchdowns, yards, etc.
 * - EPL: Soccer players with goals, assists, etc.
 * 
 * The model uses a flexible schema with sport-specific statistics stored in a Map to handle different stat types across sports
 */
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  playerId: { 
    type: String, 
    required: true, 
    unique: true // Format: "{league}_{id}" (e.g., "nba_jamesle01" for LeBron James)
  },
  teamId: { 
    type: String, 
    required: true 
  },
  league: { 
    type: String, 
    required: true, 
    enum: ['NBA', 'NFL', 'EPL'] 
  },
  name: { 
    type: String, 
    required: true 
  },
  position: String,
  number: String,

  // Player personal information
  nationality: String,
  age: Number,
  height: String,
  weight: String,
  image: String,
  stats: {
    gamesPlayed: Number,
    gamesStarted: Number,
    
    // Sport-specific statistics as key-value pairs
    // Examples:
    // NBA: points, rebounds, assists, blocks, steals
    // NFL: touchdowns, yards, completions
    // EPL: goals, assists, cleanSheets, yellowCards
    sportStats: { 
      type: Map, 
      of: mongoose.Schema.Types.Mixed // Allows any data type for stat values
    }
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now // Timestamp of last data update
  }
});

const Player = mongoose.model('Player', PlayerSchema);
export default Player;
