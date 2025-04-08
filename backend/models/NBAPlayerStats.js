/**
 * NBA Player Statistics Normalized Data Model
 * 
 * This model implements a normalized database structure for detailed NBA statistics:
 * - Separates player identity (Player model) from detailed statistics (this model)
 * - Stores both regular season and playoff statistics for each player
 * - Maintains season-by-season history with both basic and advanced metrics (not fully tested yet)
 * - Supports player trades by storing final team for each season
 * 
 * The schema uses a hierarchical structure:
 * - NbaPlayerStats → Arrays of Seasons → Season with Totals and Advanced stats
 */
import mongoose from 'mongoose';

/**
 * Schema for NBA player totals statistics (regular season or playoffs)
 * Matches the API structure from PlayerDataTotals endpoints
 */
const TotalsSchema = new mongoose.Schema({
  games: Number,
  gamesStarted: Number,
  minutesPg: Number,
  fieldGoals: Number,
  fieldAttempts: Number,
  fieldPercent: Number,
  threeFg: Number,
  threeAttempts: Number,
  threePercent: Number,
  twoFg: Number,
  twoAttempts: Number,
  twoPercent: Number,
  effectFgPercent: Number,
  ft: Number,
  ftAttempts: Number,
  ftPercent: Number,
  offensiveRb: Number,
  defensiveRb: Number,
  totalRb: Number,
  assists: Number,
  steals: Number,
  blocks: Number,
  turnovers: Number,
  personalFouls: Number,
  points: Number
});

/**
 * Schema for NBA player advanced statistics (regular season or playoffs)
 * Matches the API structure from PlayerDataAdvanced endpoints
 */
const AdvancedSchema = new mongoose.Schema({
  games: Number,
  minutesPlayed: Number,
  per: Number,
  tsPercent: Number,
  threePAR: Number,
  ftr: Number,
  offensiveRBPercent: Number,
  defensiveRBPercent: Number,
  totalRBPercent: Number,
  assistPercent: Number,
  stealPercent: Number,
  blockPercent: Number,
  turnoverPercent: Number,
  usagePercent: Number,
  offensiveWS: Number,
  defensiveWS: Number,
  winShares: Number,
  winSharesPer: Number,
  offensiveBox: Number,
  defensiveBox: Number,
  box: Number,
  vorp: Number
});

/**
 * Schema for a single season's worth of player statistics
 * Includes both basic and advanced stats as well as metadata
 */
const SeasonStatsSchema = new mongoose.Schema({
  season: Number,           // e.g., 2025
  team: String,             // Final team for the season
  position: String,         // Player's position
  age: Number,              // Player's age during this season
  totals: TotalsSchema,     // Season totals
  advanced: AdvancedSchema, // Advanced statistics
  lastUpdated: {            // When this season's data was last updated
    type: Date,
    default: Date.now
  }
});

/**
 * Main schema for NBA player statistics
 * Stores regular season and playoff data separately to prevent overwriting
 * Each player has arrays of season data for both regular season and playoffs
 */
const NbaPlayerStatsSchema = new mongoose.Schema({
  playerId: {
    type: String,        // e.g., "jamesle01" (without league prefix)
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  regularSeasons: [SeasonStatsSchema], // Array of regular season data across years
  playoffs: [SeasonStatsSchema],       // Array of playoff data across years
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const NbaPlayerStats = mongoose.model('NbaPlayerStats', NbaPlayerStatsSchema);
export default NbaPlayerStats;