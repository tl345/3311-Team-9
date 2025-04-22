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
import EPLPlayerStats from '../models/EPLPlayerStats.js';
import { updateSportsData, updateNbaDataOnly } from '../services/updateService.js';
import { updateNBATeam } from '../services/nbaService.js';
import sportsConfig from '../config/sportsConfig.js';
import SystemInfo from '../models/SystemInfo.js';

const router = express.Router();

/**
 * Helper function to get standardized team abbreviation from team name
 * @param {string} teamName - Full team name  
 * @returns {string} Standardized team abbreviation or original name if not found
 */
function getTeamAbbreviation(teamName) {
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
}

/**
 * GET /api/available-seasons/:league
 * Returns a list of available seasons for a specific league based on stored stats data.
 * @param {string} req.params.league - League identifier (NBA, EPL)
 * @returns {Array} List of available season years, sorted descending.
 */
router.get('/available-seasons/:league', async (req, res) => {
  try {
    const league = req.params.league.toUpperCase();
    let seasons = [];

    if (league === 'NBA') {
      // Find distinct season years from the 'regularSeasons' array within NbaPlayerStats
      const results = await NbaPlayerStats.distinct('regularSeasons.season');
      // Also check playoffs in case regular season data is missing for a year
      const playoffResults = await NbaPlayerStats.distinct('playoffs.season');
      seasons = [...new Set([...results, ...playoffResults])].sort((a, b) => b - a); // Combine, unique, sort descending
    }
    else if (league === 'EPL') {
      // Find distinct season years from the 'seasons' array within EPLPlayerStats
      const results = await EPLPlayerStats.distinct('seasons.season');
      seasons = results.sort((a, b) => b - a); // Sort descending
    }
    // Add NFL logic here if/when NFL seasons are implemented

    res.json(seasons);
  } catch (error) {
    console.error(`Error fetching available seasons for ${req.params.league}:`, error);
    res.status(500).json({ message: 'Failed to fetch available seasons' });
  }
});

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
      const season = req.query.season ? parseInt(req.query.season, 10) : null;
      let teams;
      
      // Different sorting based on league
      if (league === 'EPL') {
        // If a specific season is requested, filter teams that have data for that season
        if (season) {
          // Use aggregation to join with player stats and filter by season
          // This is a simplified version - implement as needed for your data structure
          teams = await Team.find({ league }).sort({ 'standings.rank': 1 });
        } else {
          // EPL teams sorted by rank
          teams = await Team.find({ league }).sort({ 'standings.rank': 1 });
        }
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
    const season = req.query.season ? parseInt(req.query.season, 10) : null;

    const team = await Team.findOne({ teamId });

    if (!team) return res.status(404).json({ message: 'Team not found' });
    
    // Basic players query
    let players = await Player.find({ teamId });
    let playersWithStats = [];
    
    // Process players based on league and season
    if (team.league === 'NBA') {
      if (season) {
        // Historical season approach: find players by their team in that season
        console.log(`Finding players for team ${team.name || team.displayName} in season ${season}`);
        
        // Find ALL players who have stats for this season
        const seasonPlayers = await NbaPlayerStats.find({
          'regularSeasons.season': season
        });
        
        // Get the team abbreviation for matching
        const teamAbbr = getTeamAbbreviation(team.name || team.displayName);
        const teamName = team.name || team.displayName;
        
        // Filter to only players who were on this team during this season
        const playerIds = [];
        const seasonPlayerMap = new Map(); // Store season data by player ID
        
        for (const playerStats of seasonPlayers) {
          const seasonData = playerStats.regularSeasons.find(s => s.season === season);
          if (!seasonData) continue;
          
          const wasOnTeam = seasonData.team === teamName || 
                           seasonData.team === team.displayName || 
                           getTeamAbbreviation(seasonData.team) === teamAbbr;
          
          if (wasOnTeam) {
            playerIds.push(`nba_${playerStats.playerId}`);
            seasonPlayerMap.set(playerStats.playerId, seasonData);
          }
        }
        
        console.log(`Found ${playerIds.length} players for team ${teamName} in season ${season}`);
        
        // Now fetch these players from the Player collection
        players = await Player.find({ playerId: { $in: playerIds } });
        
        // Process each player with their season-specific stats
        for (const player of players) {
          if (!player.nbaStatsRef) continue;
          
          const seasonData = seasonPlayerMap.get(player.nbaStatsRef);
          if (!seasonData) continue;
          
          const playerObj = player.toObject();
          
          // Update player stats to use the selected season's data
          playerObj.stats = {
            gamesPlayed: seasonData.totals.games || 0,
            gamesStarted: seasonData.totals.gamesStarted || 0,
            sportStats: {
              points: seasonData.totals.games > 0 ? (seasonData.totals.points / seasonData.totals.games).toFixed(1) : "0",
              rebounds: seasonData.totals.games > 0 ? (seasonData.totals.totalRb / seasonData.totals.games).toFixed(1) : "0",
              assists: seasonData.totals.games > 0 ? (seasonData.totals.assists / seasonData.totals.games).toFixed(1) : "0",
              blocks: seasonData.totals.games > 0 ? (seasonData.totals.blocks / seasonData.totals.games).toFixed(1) : "0",
              steals: seasonData.totals.games > 0 ? (seasonData.totals.steals / seasonData.totals.games).toFixed(1) : "0"
            }
          };
          
          playersWithStats.push(playerObj);
        }
      } else {
        // Current season approach (use the existing code for this case)
        // Get all NBA player stats refs
        const playerIds = players.filter(p => p.nbaStatsRef).map(p => p.nbaStatsRef);
        
        // Find NBA stats for these players (all seasons)
        const nbaStats = await NbaPlayerStats.find({
          playerId: { $in: playerIds }
        });
        
        // Map of stats by player ID for easy lookup
        const statsMap = new Map();
        nbaStats.forEach(stat => statsMap.set(stat.playerId, stat));
        
        // Process each player
        for (const player of players) {
          // Skip players without stats reference
          if (!player.nbaStatsRef) continue;
          
          const playerStats = statsMap.get(player.nbaStatsRef);
          if (!playerStats) continue;
          
          // Convert to regular object
          const playerObj = player.toObject();
          
          // Use default stats
          if (playerObj.stats && playerObj.stats.sportStats) {
            playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
          }
          
          playersWithStats.push(playerObj);
        }
      }
    }
    else if (team.league === 'EPL') {
      // Similar approach for EPL players
      const playerIds = players.filter(p => p.playerId).map(p => p.playerId.replace('epl_', ''));
      
      // Find EPL stats for these players
      const eplStats = await EPLPlayerStats.find({
        playerId: { $in: playerIds }
      });
      
      // Map of stats by player ID for easy lookup
      const statsMap = new Map();
      eplStats.forEach(stat => statsMap.set(stat.playerId, stat));
      
      // Process each player
      for (const player of players) {
        // Skip players without valid ID
        if (!player.playerId) continue;
        
        const playerId = player.playerId.replace('epl_', '');
        const playerStats = statsMap.get(playerId);
        if (!playerStats) continue;
        
        // Convert to regular object
        const playerObj = player.toObject();
        
        // Check if player has data for the requested season
        let hasSeasonData = false;
        
        if (season && playerStats.seasons) {
          // Sort seasons by descending order
          const sortedSeasons = [...playerStats.seasons].sort((a, b) => b.season - a.season);
          
          // Find the requested season
          const seasonData = sortedSeasons.find(s => s.season === season);
          
          if (seasonData) {
            hasSeasonData = true;
            
            // Update player with this season's data
            playerObj.position = seasonData.position || playerObj.position;
            playerObj.stats = {
              gamesPlayed: seasonData.appearances || 0,
              sportStats: {
                goals: seasonData.goals?.total || 0,
                assists: seasonData.goals?.assists || 0,
                yellowCards: seasonData.cards?.yellow || 0,
                redCards: seasonData.cards?.red || 0
              }
            };
          }
        }
        
        // If no season specified or no data for the requested season, use default stats
        if (!season || !hasSeasonData) {
          if (playerObj.stats && playerObj.stats.sportStats) {
            playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
          }
        }
        
        // If we're filtering by season and this player has no data, skip them
        if (season && !hasSeasonData) continue;
        
        playersWithStats.push(playerObj);
      }
    }
    else {
      // For NFL, just use the regular players for now
      playersWithStats = players.map(player => {
        const playerObj = player.toObject();
        if (playerObj.stats && playerObj.stats.sportStats) {
          playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
        }
        return playerObj;
      });
    }
    
    res.json({ team, players: playersWithStats });
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

    // Get requested season from query parameter
    const requestedSeason = req.query.season ? parseInt(req.query.season) : null;
    console.log(`Player ${player.name} requested with season: ${requestedSeason || 'default'}`);
    
    // Convert the player to a plain object
    const playerObj = player.toObject();
    
    // For NBA players, get stats from NbaPlayerStats collection using the reference
    if (player.league === 'NBA' && player.nbaStatsRef) {
      const nbaStats = await NbaPlayerStats.findOne({ playerId: player.nbaStatsRef });
      
      //console.log(`NBA Stats found: ${Boolean(nbaStats)}, regularSeasons: ${nbaStats ? nbaStats.regularSeasons.length : 0}`);
      
      if (nbaStats) {
        // Add all seasons to the response for the frontend to use
        playerObj.regularSeasons = nbaStats.regularSeasons;
        playerObj.playoffs = nbaStats.playoffs;

        // Make sure seasons are sorted by year (newest first)
        if (playerObj.regularSeasons) {
          playerObj.regularSeasons.sort((a, b) => b.season - a.season);
        }
        if (playerObj.playoffs) {
          playerObj.playoffs.sort((a, b) => b.season - a.season);
        }

        // Find the requested season or use most recent
        const regularSeasons = nbaStats.regularSeasons;
        if (regularSeasons && regularSeasons.length > 0) {
          // Sort by season descending
          //regularSeasons.sort((a, b) => b.season - a.season);

          // Find the requested season or use most recent
          const currentSeason = requestedSeason ? 
            regularSeasons.find(s => s.season === requestedSeason) || regularSeasons[0] : 
            regularSeasons[0]; 
          
          console.log(`Using ${currentSeason.season} season stats with totals: ${Boolean(currentSeason.totals)}`);
          
          playerObj.team = currentSeason.team;

          // Add derived stats to maintain API compatibility
          playerObj.stats = {
            gamesPlayed: currentSeason.totals.games || 0,
            gamesStarted: currentSeason.totals.gamesStarted || 0,
            sportStats: {}
          };

          // Only add stats if there are games played (avoid division by zero)
          if (currentSeason.totals && currentSeason.totals.games > 0) {
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
    }
    else if (player.league === 'EPL' && player.eplStatsRef) {
      const eplStats = await EPLPlayerStats.findOne({ playerId: player.eplStatsRef });
      
      //console.log(`EPL Stats found: ${Boolean(eplStats)}`);
      
      if (eplStats) {
        // Add photo from detailed stats
        playerObj.photo = eplStats.photo;
        
        // Add the seasons array to the player object
        playerObj.seasons = eplStats.seasons; // Seasons array contains all the detailed player statistics
        
        // Make sure we have the correct position
        // if (eplStats.seasons && eplStats.seasons.length > 0) {
        //   playerObj.position = eplStats.seasons[0].position || playerObj.position;
        // }

        // If seasons exist and a season was requested, find that specific season
        if (eplStats.seasons && eplStats.seasons.length > 0) {
          // Sort seasons by descending order
          const sortedSeasons = [...eplStats.seasons].sort((a, b) => b.season - a.season);
          
          // Find requested season or use most recent
          const currentSeason = requestedSeason ?
            sortedSeasons.find(s => s.season === requestedSeason) || sortedSeasons[0] :
            sortedSeasons[0];
            
          // Make the selected season the first one in the array for easy access by the frontend
          playerObj.seasons = [
            currentSeason,
            ...sortedSeasons.filter(s => s.season !== currentSeason.season)
          ];
        }
      }
    }

    if (playerObj.stats && playerObj.stats.sportStats) {
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
    const season = parseInt(req.query.season || sportsConfig.nba.currentSeason, 10);
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
 * Using MongoDB aggregation for better performance
 */
router.get('/top-players/:league', async (req, res) => {
  try {
    const league = req.params.league.toUpperCase();
    const season = req.query.season ? parseInt(req.query.season, 10) : null;
    let result = [];

    // NBA top players with optimized aggregation
    if (league === 'NBA') {
      if (season) {
        // Find top NBA players for a specific season
        const topNbaPlayers = await NbaPlayerStats.aggregate([
          // Match players who have stats for this season
          { $match: { 'regularSeasons.season': season } }, // Like a WHERE clause in SQL
          
          // Unwind to work with individual seasons
          { $unwind: '$regularSeasons' }, // Get separate documents for each player-season combination
          
          // Filter for the specific season
          { $match: { 'regularSeasons.season': season } },
          
          // Calculate PPG on the server side
          { $addFields: {
            ppg: { 
              $cond: [
                { $gt: ['$regularSeasons.totals.games', 0] }, // IF games > 0
                { $divide: ['$regularSeasons.totals.points', '$regularSeasons.totals.games'] }, // THEN points / games
                0 // ELSE 0
              ]
            },
            team: '$regularSeasons.team',
            position: '$regularSeasons.position'
          }},
          
          // Sort by PPG descending
          { $sort: { ppg: -1 } },
          
          // Limit to top 10 (we'll further refine after team info is added)
          { $limit: 10 },
          
          // Project only needed fields
          { $project: {
            _id: 0,
            playerId: 1,
            name: 1,
            team: 1,
            ppg: { $round: ['$ppg', 1] }
          }}
        ]);
        
        // Format results with team abbreviations
        result = await Promise.all(topNbaPlayers.map(async (player) => {
          const fullPlayer = await Player.findOne({ nbaStatsRef: player.playerId });
          const teamId = fullPlayer?.teamId || '';
          const team = await Team.findOne({ teamId });
          const teamAbbr = getTeamAbbreviation(team?.displayName || player.team);
          
          return {
            id: `nba_${player.playerId}`,
            name: `${player.name} (${teamAbbr}) - ${player.ppg} ppg`
          };
        }));
      } else {
        // For current season, use the Player model with sportStats
        const topNbaPlayers = await Player.aggregate([
          // Match NBA players with games played
          { $match: { 
            league: 'NBA', 
            'stats.gamesPlayed': { $gt: 0 } 
          }},
          
          // Add calculated PPG field
          { $addFields: {
            ppg: { 
              $cond: [
                { $gt: ['$stats.gamesPlayed', 0] },
                { $divide: [
                  { $ifNull: [{ $toDouble: { $getField: { field: 'points', input: '$stats.sportStats' }}}, 0] },
                  '$stats.gamesPlayed'
                ]},
                0
              ]
            }
          }},
          
          // Sort by PPG descending
          { $sort: { ppg: -1 } },
          
          // Limit to top 10
          { $limit: 10 },
          
          // Project only needed fields
          { $project: {
            _id: 0,
            playerId: 1,
            name: 1,
            teamId: 1,
            ppg: 1
          }}
        ]);
        
        // Format results with team abbreviations
        result = await Promise.all(topNbaPlayers.map(async (player) => {
          const team = await Team.findOne({ teamId: player.teamId });
          const teamAbbr = getTeamAbbreviation(team?.displayName || 'Unknown');
          
          return {
            id: player.playerId,
            name: `${player.name} (${teamAbbr}) - ${player.ppg.toFixed(1)} ppg`
          };
        }));
      }
    } 
    // EPL top players with optimized aggregation
    else if (league === 'EPL') {
      if (season) {
        // Find top EPL players for a specific season
        const topEplPlayerStats = await EPLPlayerStats.aggregate([
          // Match players who have stats for this season
          { $match: { 'seasons.season': season } },
          
          // Unwind to work with individual seasons
          { $unwind: '$seasons' },
          
          // Filter for the specific season
          { $match: { 'seasons.season': season } },
          
          // Sort by goals descending
          { $sort: { 'seasons.goals.total': -1 } },
          
          // Limit to top 10
          { $limit: 10 },
          
          // Project only needed fields
          { $project: {
            _id: 0,
            playerId: 1,
            name: 1,
            teamId: { $concat: ['epl_', { $toString: '$seasons.teamId' }] },
            team: '$seasons.team',
            goals: { $ifNull: ['$seasons.goals.total', 0] }
          }}
        ]);
        
        // Format results with team info
        result = await Promise.all(topEplPlayerStats.map(async (player) => {
          const fullPlayer = await Player.findOne({ playerId: `epl_${player.playerId}` });
          const team = await Team.findOne({ teamId: fullPlayer?.teamId || player.teamId });
          const teamAbbr = team?.name?.split(' ')[0] || player.team?.split(' ')[0] || 'Unknown';
          
          return {
            id: `epl_${player.playerId}`,
            name: `${player.name} (${teamAbbr}) - ${player.goals} goals`
          };
        }));
      } else {
        // For current season, use the Player model with sportStats
        const topEplPlayers = await Player.aggregate([
          // Match EPL players
          { $match: { league: 'EPL' } },
          
          // Sort by goals descending
          { $sort: { 'stats.sportStats.goals': -1 } },
          
          // Limit to top 10
          { $limit: 10 },
          
          // Project only needed fields
          { $project: {
            _id: 0,
            playerId: 1,
            name: 1,
            teamId: 1,
            goals: { $ifNull: [{ $getField: { field: 'goals', input: '$stats.sportStats' }}, 0] }
          }}
        ]);
        
        // Format results with team info
        result = await Promise.all(topEplPlayers.map(async (player) => {
          const team = await Team.findOne({ teamId: player.teamId });
          const teamAbbr = team?.name?.split(' ')[0] || 'Unknown';
          
          return {
            id: player.playerId,
            name: `${player.name} (${teamAbbr}) - ${player.goals} goals`
          };
        }));
      }
    } 
    // NFL (simplified since it's using mock data)
    else if (league === 'NFL') {
      const topNflPlayers = await Player.find({ league: 'NFL' }).limit(5);
      result = topNflPlayers.map(player => ({
        id: player.playerId || `nfl_${Math.floor(Math.random() * 1000)}`,
        name: player.name
      }));
    }

    // Return top 5 players
    res.json(result.slice(0, 5));
  } catch (error) {
    console.error('Error fetching top players:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/last-update/:league/:season
 * Fetches the timestamp of the most recent data update for a specific league and season
 * @param {string} req.params.league - League code (NBA, EPL)
 * @param {number} req.params.season - Season year
 * @returns {Object} Last update timestamp information
 */
router.get('/last-update/:league?/:season?', async (req, res) => {
  try {
    const { league, season } = req.params;
    let key = 'lastUpdateTime';
    
    if (league) {
      key = `lastUpdate_${league}`;
      if (season) {
        key = `lastUpdate_${league}_${season}`;
      }
    }
    
    const lastUpdate = await SystemInfo.findOne({ key });
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
        nbaSeason: parseInt(req.body.nbaSeason || sportsConfig.nba.currentSeason, 10)
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
