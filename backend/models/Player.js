/**
 * Player Model
 * 
 * This schema defines the structure for player data across all supported sports.
 * For NBA players, it uses a reference to the NbaPlayerStats collection rather than duplicating stats.
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

  /**
   * Reference to the detailed player stats in the NbaPlayerStats collection
   * This implements a normalized database design pattern:
   * - Player collection stores basic info and summary statistics
   * - NbaPlayerStats collection stores detailed season-by-season data
   * - This reference field connects the two collections
   * 
   * Contains the raw ID without the "nba_" prefix to match the NbaPlayerStats.playerId
   */
  nbaStatsRef: {
    type: String,
    ref: 'NbaPlayerStats'
  },

  // Stats structure same as before for NFL/EPL players
  // For NBA players, this will be populated with a reference to NbaPlayerStats
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
