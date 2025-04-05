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
import { updateSportsData } from '../services/updateService.js';
import { updateNBATeam } from '../services/nbaService.js';
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
 * Fetches detailed information for a specific player
 * 
 * This endpoint:
 * 1. Looks up the player by their unique ID
 * 2. Converts Mongoose Maps to regular objects for JSON serialization
 * @param {string} req.params.playerId - Player ID (e.g., "nba_jamesle01")
 * @returns {Object} Player details including stats
 */
router.get('/player/:playerId', async (req, res) => {
    try {
      const player = await Player.findOne({ playerId: req.params.playerId });

      if (!player) return res.status(404).json({ message: 'Player not found' });
      
      // Convert the player to a plain object
      const playerObj = player.toObject();
      
      // Convert the Map to a regular object for proper JSON serialization
      if (playerObj.stats && playerObj.stats.sportStats) {
        playerObj.stats.sportStats = Object.fromEntries(player.stats.sportStats);
      }
      
      res.json(playerObj);
    } catch (error) {
      console.error('Error fetching player:', error);
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
        // NBA players sorted by points (high to low)
        // players = await Player.find({ league })
        //   .sort({ 'stats.sportStats.points': -1 })
        //   .limit(10);

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
 * Manually triggers a full data refresh from all sports APIs
 * @returns {Object} Update results and status
 */
router.post('/update', async (req, res) => {
    try {
      const result = await updateSportsData();
      res.json({
        success: true,
        message: 'Sports data updated successfully',
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
