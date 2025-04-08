/**
 * API Routes for Sports Stats Application
 * 
 * This file defines all the REST API endpoints that the frontend uses to
 * fetch and update data. Each endpoint connects to MongoDB models to retrieve
 * or manipulate data
 * 
 * The API is organized around resources:
 * - /teams/:league - Get all teams for a league
 * - /team/:teamId - Get a specific team and its roster
 * - /player/:playerId - Get detailed player information
 * - /top-players/:league - Get the top 5 players in a league
 * - /update - Trigger a data refresh from external sources
 * 
 * Each route includes proper error handling and appropriate HTTP status codes
 */

import express from 'express';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import NbaPlayerStats from '../models/NBAPlayerStats.js';
import { updateSportsData, updateNbaDataOnly } from '../services/updateService.js';
import { updateNBATeam } from '../services/nbaService.js';
import config from '../config/nbaStatsConfig.js';
import SystemInfo from '../models/SystemInfo.js';

const router = express.Router();

/**
 * GET /api/teams/:league
 * Fetches all teams for a specific league (NBA, EPL, NFL)
 * Teams are sorted differently based on the league:
 * - EPL: Sorted by standing rank (1st, 2nd, etc.)
 * - NBA: No specific sorting (frontend sorts alphabetically)
 * - NFL: The plan is to sort by win percentage
 * 
 * @param {string} req.params.league - League identifier (NBA, EPL, NFL)
 * @returns {Array} Array of teams with their details
 */
router.get('/teams/:league', async (req, res) => {
    try {
      const league = req.params.league.toUpperCase();
      let teams;
      
      // Different sorting based on league
      if (league === 'EPL') {
        // EPL teams sorted by rank
        teams = await Team.find({ league }).sort({ 'standings.rank': 1 });
      } else if (league === 'NBA') {
        // NBA teams with no specific sorting (alphabetical sorting will be done on frontend)
        teams = await Team.find({ league });
      } else {
        // will sort NFL teams by win percentage if possible
        teams = await Team.find({ league }).sort({ 'standings.winPercentage': -1 });
      }
      
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/team/:teamId
 * Fetches a specific team and its current roster
 * 
 * This endpoint:
 * 1. Looks up the team by its unique ID
 * 2. Fetches all players currently assigned to that team
 * 3. Returns both the team details and its players
 * @param {string} req.params.teamId - Team ID (e.g., "nba_14")
 * @returns {Object} Team details and player roster
 */
router.get('/team/:teamId', async (req, res) => {
    try {
      const teamId = req.params.teamId;
      const team = await Team.findOne({ teamId });

      if (!team) return res.status(404).json({ message: 'Team not found' });
      
      // Only get players that are CURRENTLY on this team (teamId matches)
      // This ensures traded players don't appear on multiple teams
      const players = await Player.find({ teamId });
      
      res.json({ team, players });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/player/:playerId
 * Enhanced Player Details Endpoint
 * 
 * This updated endpoint implements the normalized database access pattern:
 * - First fetches the basic player record
 * - For NBA players, follows the reference to detailed NbaPlayerStats
 * - Calculates per-game statistics from the totals data
 * - Returns properly formatted statistics for the frontend
 * @param {string} req.params.playerId - Player's unique ID (e.g., "nba_jamesle01")
 * @returns {Object} Player details including statistics
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const player = await Player.findOne({ playerId: req.params.playerId });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    
    console.log(`Found player ${player.name} with nbaStatsRef: ${player.nbaStatsRef}`);
    
    // Convert the player to a plain object
    const playerObj = player.toObject();
    
    // For NBA players, get stats from NbaPlayerStats collection using the reference
    if (player.league === 'NBA' && player.nbaStatsRef) {
      const nbaStats = await NbaPlayerStats.findOne({ playerId: player.nbaStatsRef });
      
      console.log(`NBA Stats found: ${Boolean(nbaStats)}, regularSeasons: ${nbaStats ? nbaStats.regularSeasons.length : 0}`);
      
      if (nbaStats) {
        // Get most recent regular season
        const regularSeasons = nbaStats.regularSeasons;
        if (regularSeasons.length > 0) {
          // Sort by season descending
          regularSeasons.sort((a, b) => b.season - a.season);
          const currentSeason = regularSeasons[0];
          
          console.log(`Current season totals: points=${currentSeason.totals.points}, games=${currentSeason.totals.games}`);
          
          // Add derived stats to maintain API compatibility
          playerObj.stats = {
            gamesPlayed: currentSeason.totals.games || 0,
            gamesStarted: currentSeason.totals.gamesStarted || 0,
            sportStats: {}
          };

          // Only add stats if there are games played (avoid division by zero)
          if (currentSeason.totals.games > 0) {
            playerObj.stats.sportStats = {
              points: (currentSeason.totals.points / currentSeason.totals.games).toFixed(1),
              rebounds: (currentSeason.totals.totalRb / currentSeason.totals.games).toFixed(1),
              assists: (currentSeason.totals.assists / currentSeason.totals.games).toFixed(1),
              blocks: (currentSeason.totals.blocks / currentSeason.totals.games).toFixed(1),
              steals: (currentSeason.totals.steals / currentSeason.totals.games).toFixed(1)
            };
          }
        }
      }
    } else if (playerObj.stats && playerObj.stats.sportStats) {
      // For non-NBA players, convert Map to object as before
      playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
    }
    
    res.json(playerObj);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/nba-stats/player/:playerId
 * Fetches comprehensive NBA statistics for a specific player
 * Includes both regular season and playoff data across seasons
 * @param {string} req.params.playerId - Player's unique ID (without the "nba_" prefix)
 * @returns {Object} Player's comprehensive stats
 */
router.get('/nba-stats/player/:playerId', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    
    // Find the player's stats document
    const playerStats = await NbaPlayerStats.findOne({ playerId });

    if (!playerStats) {
      return res.status(404).json({ message: 'Player statistics not found' });
    }
    
    res.json(playerStats);
  } catch (error) {
    console.error('Error fetching player NBA stats:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
* GET /api/nba-stats/player/:playerId/season/:season
* Fetches specific season NBA statistics for a player
* @param {string} req.params.playerId - Player's unique ID
* @param {number} req.params.season - Season year
* @param {string} req.query.type - Optional type ('regular' or 'playoff')
* @returns {Object} Player's season statistics
*/
router.get('/nba-stats/player/:playerId/season/:season', async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const season = parseInt(req.params.season, 10);
    const type = req.query.type?.toLowerCase() === 'playoff' ? 'playoffs' : 'regularSeasons';
    
    // Find the player's stats document
    const playerStats = await NbaPlayerStats.findOne({ playerId });

    if (!playerStats) {
      return res.status(404).json({ message: 'Player statistics not found' });
    }
    
    // Find the specific season within the array
    const seasonStats = playerStats[type].find(s => s.season === season);
    
    if (!seasonStats) {
      return res.status(404).json({ message: `No ${type === 'playoffs' ? 'playoff' : 'regular season'} statistics found for season ${season}` });
    }
    
    res.json(seasonStats);
  } catch (error) {
    console.error('Error fetching player season NBA stats:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/nba-stats/visualization/efficiency-usage
 * Efficiency-Usage Scatter Plot Visualization Endpoint
 * 
 * This endpoint processes NBA player data for visualization:
 * - Filters players by minimum games played threshold
 * - Extracts key metrics: True Shooting %, Usage Rate, PER
 * - Returns formatted data ready for the scatter plot
 * - Supports both regular season and playoff data views
 * 
 * @param {number} req.query.season - Season year
 * @param {string} req.query.type - Optional type ('regular' or 'playoff')
 * @param {number} req.query.minGames - Minimum games played threshold to include player
 * @returns {Array} Data for the scatter plot
 */
router.get('/nba-stats/visualization/efficiency-usage', async (req, res) => {
  try {
    // Get parameters with defaults from configuration
    const season = parseInt(req.query.season || config.currentSeason, 10);
    const type = req.query.type?.toLowerCase() === 'playoff' ? 'playoffs' : 'regularSeasons';
    const minGames = parseInt(req.query.minGames || 20, 10);
    
    // Find players with stats for the requested season (using MongoDBs dot notation for nested arrays)
    const players = await NbaPlayerStats.find({
      [`${type}.season`]: season
    });
    
    if (!players || players.length === 0) {
      return res.json([]);
    }
    
    // Extract and format the data for the scatter plot
    const scatterData = players
      .map(player => {
        // Find the specific season within the player's seasons array
        const seasonStats = player[type].find(s => s.season === season);
        // Skip if no stats or misisng advanced stats
        if (!seasonStats || !seasonStats.advanced) return null;
        
        // Only include players who played enough games
        if (seasonStats.advanced.games < minGames) return null;
        
        // Fields needed for the visualization
        return {
          playerId: player.playerId,
          name: player.name,
          team: seasonStats.team,
          position: seasonStats.position,
          tsPercent: seasonStats.advanced.tsPercent, // True Shooting %
          usagePercent: seasonStats.advanced.usagePercent, // Usage Rate
          per: seasonStats.advanced.per, // Player Efficiency Rating
          games: seasonStats.advanced.games // Games played (for filtering)
        };
      })
      .filter(item => item !== null); // Remove null entries
    
    res.json(scatterData);
  } catch (error) {
    console.error('Error fetching efficiency vs usage data:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/search
 * Searches for players and teams matching a query string
 * 
 * This endpoint:
 * 1. Performs a case-insensitive regex search on name fields
 * 2. Returns both matching teams and players
 * @param {string} req.query.q - Search query string
 * @returns {Object} Matching teams and players
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) return res.status(400).json({ message: 'Search query required' });
  
  try {
    const regex = new RegExp(query, 'i'); // Case-insensitive search
    
    // Find matching teams
    const teams = await Team.find({ 
      $or: [
        { name: { $regex: regex } },
        { displayName: { $regex: regex } }
      ]
    }).limit(5);
    
    // Find matching players
    const players = await Player.find({ 
      name: { $regex: regex } 
    }).limit(10);
    
    res.json({ teams, players });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/top-players/:league
 * Returns the top 5 players from a league sorted by performance metrics
 * 
 * This endpoint:
 * 1. Gets players from the specified league
 * 2. Sorts them by the most relevant stat for that sport
 * 3. Formats player names with team abbreviations and stats
 * 4. Returns the top 5 players
 * @param {string} req.params.league - League identifier (NBA, EPL, NFL)
 * @returns {Array} Top 5 players with formatted display names
 */
router.get('/top-players/:league', async (req, res) => {
    try {
      const league = req.params.league.toUpperCase();
      let players;
      
      // Get players by league with appropriate sorting
      if (league === 'NBA') {
        // Get ALL NBA players with at least one game played
        players = await Player.find({ 
          league,
          'stats.gamesPlayed': { $gt: 0 } 
        });
        
        // Sort them all by PPG
        players.sort((a, b) => {
          const aPoints = a.stats.sportStats.get('points') || 0;
          const bPoints = b.stats.sportStats.get('points') || 0;
          
          const aPPG = a.stats.gamesPlayed ? aPoints / a.stats.gamesPlayed : 0;
          const bPPG = b.stats.gamesPlayed ? bPoints / b.stats.gamesPlayed : 0;
          
          return bPPG - aPPG; // Higher PPG first
        });
        
        // Take top 10 from ALL players
        players = players.slice(0, 10);
      } 
      else if (league === 'EPL') {
        // EPL players sorted by goals (high to low)
        players = await Player.find({ league })
          .sort({ 'stats.sportStats.goals': -1 })
          .limit(10);
      }
      else {
        // NFL players (mock data, no specific sorting yet)
        players = await Player.find({ league })
          .limit(10);
      }
      
      // Format player data with team abbreviations and performance stats
      const result = await Promise.all(players.map(async (player) => {
        // Convert player to object and handle Map for JSON serialization
        const playerObj = player.toObject();
        if (playerObj.stats && playerObj.stats.sportStats) {
          playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
        }
        
        // Get the team name and convert to abbreviation
        const team = await Team.findOne({ teamId: player.teamId });
        const teamName = team ? team.displayName : 'Unknown Team';
        
        const getTeamAbbr = (teamName) => {
            // NBA team abbreviations
            const abbrs = {
              'Atlanta Hawks': 'ATL',
              'Boston Celtics': 'BOS',
              'Brooklyn Nets': 'BKN',
              'Charlotte Hornets': 'CHA',
              'Chicago Bulls': 'CHI',
              'Cleveland Cavaliers': 'CLE',
              'Dallas Mavericks': 'DAL',
              'Denver Nuggets': 'DEN',
              'Detroit Pistons': 'DET',
              'Golden State Warriors': 'GSW',
              'Houston Rockets': 'HOU',
              'Indiana Pacers': 'IND',
              'Los Angeles Clippers': 'LAC',
              'Los Angeles Lakers': 'LAL',
              'Memphis Grizzlies': 'MEM',
              'Miami Heat': 'MIA',
              'Milwaukee Bucks': 'MIL',
              'Minnesota Timberwolves': 'MIN',
              'New Orleans Pelicans': 'NOP',
              'New York Knicks': 'NYK',
              'Oklahoma City Thunder': 'OKC',
              'Orlando Magic': 'ORL',
              'Philadelphia 76ers': 'PHI',
              'Phoenix Suns': 'PHX',
              'Portland Trail Blazers': 'POR',
              'Sacramento Kings': 'SAC',
              'San Antonio Spurs': 'SAS',
              'Toronto Raptors': 'TOR',
              'Utah Jazz': 'UTA',
              'Washington Wizards': 'WAS'
            };
            return abbrs[teamName] || teamName;
        };
          
          // Format player display name with team and stats
          return {
            id: player.playerId,
            name: `${player.name} (${getTeamAbbr(teamName)}) - ${
              league === 'NBA' 
                ? (player.stats?.sportStats?.get('points') / player.stats?.gamesPlayed).toFixed(1) + ' ppg' 
                : league === 'EPL' 
                  ? (player.stats?.sportStats?.get('goals') || 0) + ' goals' 
                  : ''
            }`
          };
      }));
      
      // Return top 5
      res.json(result.slice(0, 5));
    } catch (error) {
      console.error('Error fetching top players:', error);
      res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/last-update
 * Fetches the timestamp of the most recent data update
 * @returns {Object} Last update timestamp information
 */
router.get('/last-update', async (req, res) => {
    try {
      const lastUpdate = await SystemInfo.findOne({ key: 'lastUpdateTime' });
      res.json(lastUpdate ? lastUpdate.value : null);
    } catch (error) {
      console.error('Error fetching last update time:', error);
      res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/update
 * Manually triggers a data refresh from external APIs with configurable options
 * 
 * @param {Object} req.body - Update options
 * @param {boolean} req.body.nba - Whether to update NBA data (default: true)
 * @param {boolean} req.body.nfl - Whether to update NFL data (default: true)
 * @param {boolean} req.body.epl - Whether to update EPL data (default: true)
 * @param {string} req.body.nbaType - 'regular' or 'playoff' (default: 'regular')
 * @param {number} req.body.nbaSeason - Season year to update (default: from config)
 * @returns {Object} Update results and status
 */
router.post('/update', async (req, res) => {
    try {
      // Extract options from request body with defaults
      const options = {
        nba: req.body.nba !== false, // Default to true unless explicitly set false
        nfl: req.body.nfl !== false, //
        epl: req.body.epl !== false, //
        nbaType: req.body.nbaType || 'regular',
        nbaSeason: parseInt(req.body.nbaSeason || config.currentSeason, 10)
      };
      
      // Validate nbaType parameter
      if (!['regular', 'playoff'].includes(options.nbaType)) {
        options.nbaType = 'regular';
      }

      // Pass all options to updateSportsData function
      const result = await updateSportsData(options);

      res.json({
        success: true,
        message: 'Sports data updated successfully',
        options, // Return the options used
        result
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update sports data',
        error: error.message
      });
    }
});

/**
 * POST /api/update-nba-team/:abbr
 * Updates data for a specific NBA team by abbreviation
 * Useful for targeted updates without refreshing all data
 * @param {string} req.params.abbr - Team abbreviation (e.g., "LAL")
 * @returns {Object} Update result and status
 */
router.post('/update-nba-team/:abbr', async (req, res) => {
    try {
      const teamAbbr = req.params.abbr.toUpperCase();
      const result = await updateNBATeam(teamAbbr);
      res.json({
        success: result,
        message: result ? 
          `Successfully updated NBA team ${teamAbbr}` : 
          `Failed to update NBA team ${teamAbbr}`
      });
    } catch (error) {
      console.error(`Error updating NBA team ${req.params.abbr}:`, error);
      res.status(500).json({
        success: false,
        message: `Error updating NBA team: ${error.message}`
      });
    }
});

export default router;
