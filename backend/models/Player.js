/**
 * Player Model - Core player information shared across sports
 * Now uses references to specialized stat collections for detailed data
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

  // Player core information
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

 /**
   * Reference to the detailed NBA player stats collection
   * Implements normalized database design pattern by connecting to NbaPlayerStats
   * Contains the raw ID without the "nba_" prefix
   */
  nbaStatsRef: {
    type: String,
    ref: 'NbaPlayerStats'
  },

  /**
   * Reference to the detailed EPL player stats collection
   * Implements normalized database design pattern by connecting to EPLPlayerStats
   * Contains the raw ID without the "epl_" prefix
   */
  eplStatsRef: {
    type: String,
    ref: 'EPLPlayerStats'
  },

  // Stats structure same as before for NFL/EPL players
  // For NBA players, this will be populated with a reference to NbaPlayerStats
  stats: {
    gamesPlayed: Number,
    gamesStarted: Number,
    
    // Sport-specific statistics as key-value pairs
    // Different stats for different sports (points, goals, tackles, etc.)
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
