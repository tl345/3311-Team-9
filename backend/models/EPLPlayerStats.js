import mongoose from 'mongoose';

/**
 * EPL player statistics schema for individual seasons
 * Each object in the seasons array represents one season's worth of stats
 */
const SeasonStatsSchema = new mongoose.Schema({
  season: Number, // e.g. 2024 for the 2024-2025 season
  team: String,
  teamId: String,
  position: String,

  // Appearance stats
  appearances: Number,
  lineups: Number,  // Starting lineup appearances
  minutes: Number,
  rating: Number,

  // Goal stats
  goals: {
    total: Number,
    assists: Number,
    conceded: Number,
    saves: Number
  },

  // Card stats
  cards: {
    yellow: Number,
    yellowred: Number,
    red: Number
  },

  // Other stats
  shots: {
    total: Number,
    on: Number
  },
  
  passes: {
    total: Number,
    key: Number,
    accuracy: Number
  },

  tackles: {
    total: Number,
    blocks: Number,
    interceptions: Number
  },

  duels: {
    total: Number,
    won: Number
  },

  dribbles: {
    attempts: Number,
    success: Number,
    past: Number
  },

  fouls: {
    drawn: Number,
    committed: Number
  },

  penalty: {
    won: Number,
    committed: Number,
    scored: Number,
    missed: Number,
    saved: Number
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

/**
 * Main EPL player stats schema
 * Stores player details and array of season stats
 */
const EplPlayerStatsSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true
  },
  // Player metadata stays at top level (does not change per season)
  name: String,
  firstname: String,
  lastname: String,
  age: Number,
  nationality: String,
  height: String,
  weight: String,
  photo: String,
  
  // Array of season statistics - the key feature enabling multi-season support
  seasons: [SeasonStatsSchema],
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const EPLPlayerStats = mongoose.model('EplPlayerStats', EplPlayerStatsSchema);
export default EPLPlayerStats;