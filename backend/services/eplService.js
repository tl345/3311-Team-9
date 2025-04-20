/**
 * EPL (English Premier League) Data Service
 * 
 * This service fetches data for the English Premier League from external APIs and stores it in MongoDB. 
 * 
 * It handles:
 * 1. Standings data - Team rankings, points, wins, losses, draws
 * 2. Player data - Goals, appearances, cards, etc.
 * 3. Rate limiting - Implements delays to avoid API throttling
 * 
 * The service is designed to be resilient to API failures and implements staggered requests to stay within API usage limits
 */

// Changes:
// 1. No longer deletes all data before update
// 2. Finds existing player records and updates only changed fields
// 3. Uses season parameter to fetch appropriate data from API-Football
// 4. Adds player season stats to array instead of replacing document
// 5. Processes both team standings and player stats with proper references

import axios, { all } from 'axios';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import EPLPlayerStats from '../models/EPLPlayerStats.js';
import SystemInfo from '../models/SystemInfo.js';

// API options for EPL
const API_SOURCES = {
  API_FOOTBALL: 'api-football'
};

// Active API source
const ACTIVE_API = API_SOURCES.API_FOOTBALL;
const CURRENT_SEASON = 2024;

/**
 * Helper function to safely extract player stats
 * @param {Object} stats - Statistics object from API
 * @param {string} field - Main field name (e.g., 'goals', 'passes')
 * @param {string} subfield - Sub field name (e.g., 'total', 'key')
 * @returns {number|null} The value or null if not available
 */
function getSafeStatValue(stats, field, subfield) {
  if (!stats || !stats[field] || stats[field][subfield] === undefined) {
    return null;
  }
  return stats[field][subfield];
}

/**
 * Determines if a player is a goalkeeper based on position string
 * @param {string} position - Player position from API
 * @returns {boolean} True if player is a goalkeeper
 */
function isGoalkeeper(position) {
  if (!position) return false;
  return position.toLowerCase().includes('goalkeeper') || position.toLowerCase() === 'gk';
}

/**
 * Updates all EPL data by fetching from the selected API source
 * @param {number} season - Season to fetch (defaults to current)
 * @returns {Promise<boolean>} Success status
 */
export const updateEPLData = async (season = CURRENT_SEASON) => {
  try {
    console.log(`Starting EPL data update for season ${season}...`);
    
    // No longer deleting all data - using incremental updates instead
    if (ACTIVE_API === API_SOURCES.API_FOOTBALL) {
      const startTime = new Date();
      const success = await updateFromApiFootball(season);
      
      // Log update status
      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      await logUpdateStatus('EPL', success, startTime, endTime, duration);
      
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('EPL update error:', error);
    return false;
  }
};

/**
 * Logs the status of data update operations
 * @param {string} operation - The operation being performed (e.g., 'EPL Update')
 * @param {boolean} success - Whether the operation succeeded
 * @param {Date} startTime - When the operation started
 * @param {Date} endTime - When the operation ended
 * @param {number} duration - Duration of operation in seconds
 */
async function logUpdateStatus(operation, success, startTime, endTime, duration) {
  try {
    await SystemInfo.findOneAndUpdate(
      { key: `lastUpdate_${operation.replace(/\s+/g, '')}` },
      {
        value: {
          success,
          timestamp: endTime,
          formattedTimestamp: endTime.toLocaleString(),
          duration: duration.toFixed(2)
        }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Error updating system info:`, err);
  }
}

/**
 * Makes an API call to the API-Football service
 * @param {string} endpoint - API endpoint to call
 * @param {Object} params - Parameters to include in the request
 * @returns {Promise<Object>} API response
 */
async function callApiFootball(endpoint, params = {}) {
  try {
    console.log(`Calling API-Football ${endpoint} endpoint with params:`, params);
    
    const response = await axios.get(`https://v3.football.api-sports.io/${endpoint}`, {
      headers: { 'x-apisports-key': process.env.EPL_API_KEY },
      params: params
    });
    
    return response.data;
  } catch (error) {
    console.error(`API-Football call error (${endpoint}):`, error.message);
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Recursively fetches all players for a league and season with proper pagination
 * @param {number} league - League ID (39 for Premier League)
 * @param {number} season - Season year
 * @param {number} page - Current page number
 * @param {Array} playersData - Accumulated player data
 * @returns {Promise<Array>} Complete array of player data
 */
async function fetchAllPlayers(league, season, page = 1, playersData = []) {
  try {
    // Make API call for current page
    const response = await callApiFootball('players', {
      league: league,
      season: season,
      page: page
    });
    
    // Early exit if there's an API error
    if (!response || !response.response) {
      console.error('Invalid response from API-Football players endpoint');
      return playersData;
    }
    
    console.log(`Fetched ${response.results} players from page ${page}/${response.paging.total}`);
    
    // Add current page results to our collection
    playersData = [...playersData, ...response.response];
    
    // Check if we need to fetch more pages
    if (response.paging.current < response.paging.total) {
      const nextPage = response.paging.current + 1;
      
      // Add delay to avoid hitting API rate limits
      // Even pages get 1 second delay, odd pages get 1.5 second delay
      const delayMs = nextPage % 2 === 0 ? 1000 : 1500;
      console.log(`Waiting ${delayMs}ms before fetching next page...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Recursive call to get next page
      return fetchAllPlayers(league, season, nextPage, playersData);
    }
    
    return playersData;
  } catch (error) {
    console.error(`Error fetching players page ${page}:`, error);
    
    // If we already have some data, return it rather than failing completely
    if (playersData.length > 0) {
      console.warn(`Returning ${playersData.length} players collected before the error`);
      return playersData;
    }
    throw error;
  }
}

/**
 * Updates EPL data from the API-Football service with incremental updates
 * This function:
 * 1. Fetches league standings which include team data
 * 2. Updates team records in the database
 * 3. Fetches ALL players for the league and season with pagination
 * 4. Updates player records with current stats
 * 
 * @param {number} season - Season to fetch
 * @returns {Promise<boolean>} Success status
 */
async function updateFromApiFootball(season = CURRENT_SEASON) {
  try {
    console.log(`Fetching EPL standings data for season ${season}...`);

    // Step 1: Get standings (teams) data
    const standingsResponse = await callApiFootball('standings', {
      league: 39, // Premier League ID
      season: season
    });

    if (!standingsResponse || !standingsResponse.response || !standingsResponse.response[0]) {
      console.error('Invalid API response for standings');
      return false;
    }

    const teams = standingsResponse.response[0].league.standings[0];
    console.log(`Found ${teams.length} EPL teams for season ${season}`);

    // Step 2: Update teams in database without deleting existing records
    for (const teamData of teams) {
      const team = teamData.team;
      
      // Update or create a team record - uses findOneAndUpdate for incremental updates
      await Team.findOneAndUpdate(
        { teamId: `epl_${team.id}` },
        {
          league: 'EPL',
          name: team.name.replace(/ FC$/, ''), // Store base name without "FC"
          displayName: team.name, // Keep original for display
          logo: team.logo,
          standings: {
            rank: teamData.rank, // Position in standings
            points: teamData.points, // Season points
            wins: teamData.all.win,
            losses: teamData.all.lose,
            draws: teamData.all.draw,
            gamesPlayed: teamData.all.played,
            winPercentage: teamData.all.played > 0 ? (teamData.all.win / teamData.all.played) : 0
          },
          lastUpdated: new Date()
        },
        { upsert: true } // Create if doesn't exist, update if it does
      );
    }

    console.log(`Updated ${teams.length} teams successfully`);

    // Step 3: Get all players with pagination to handle API limits
    console.log(`Fetching all EPL players for season ${season}...`);
    const allPlayers = await fetchAllPlayers(39, season);
    console.log(`Successfully fetched ${allPlayers.length} EPL players`);

    // Step 4: Process each player incrementally
    console.log(`Processing player data and updating database...`);
    let updatedPlayers = 0;
    let createdPlayers = 0;

    for (const playerData of allPlayers) {
      try {
        const player = playerData.player;

        // Player might have stats from multiple competitions
        // Find EPL stats specifically - or fall back to first entry
        const stats = playerData.statistics.find(
          stat => stat.league.id === 39 && stat.league.season === season 
        ) || playerData.statistics[0];

        // Debug log to see raw accuracy data
        // console.log(`Player ${player.name} pass data:`, {
        //   total: stats.passes?.total,
        //   key: stats.passes?.key,
        //   rawAccuracy: stats.passes?.accuracy,
        //   accuracyType: typeof stats.passes?.accuracy
        // });

        // Skip players with no appearances
        if (!stats || stats.games?.appearences <= 0) {
          continue;
        }

        const teamId = `epl_${stats.team.id}`;

        // Step 4a: Update or create detailed EPLPlayerStats record
        let eplPlayerStats = await EPLPlayerStats.findOne({ playerId: player.id.toString()});

        if (!eplPlayerStats) {
          // Create new player stats record
          eplPlayerStats = new EPLPlayerStats({
            playerId: player.id.toString(),
            name: player.name,
            firstname: player.firstname,
            lastname: player.lastname,
            age: player.age,
            nationality: player.nationality,
            height: player.height,
            weight: player.weight,
            photo: player.photo,
            seasons: []
          });
          createdPlayers++;
        }

        // Check if this season already exists
        let seasonStats = eplPlayerStats.seasons.find(s => s.season === season);

        if (!seasonStats) {
          // Create a new season entry
          seasonStats = {
            season: season,
            team: stats.team.name,
            teamId: teamId,
            position: stats.games.position,

            // Game stats
            appearances: stats.games.appearences || 0,
            lineups: stats.games.lineups || 0,
            minutes : stats.games.minutes || 0,
            rating: stats.games.rating ? parseFloat(stats.games.rating) : null,

            // Goals
            goals: {
              total: stats.goals.total || 0,
              assists: stats.goals.assists || 0,
              conceded: stats.goals.conceded || 0,
              saves: stats.goals.saves || 0
            },

            // Cards
            cards: {
              yellow: stats.cards.yellow || 0,
              yellowred: stats.cards.yellowred || 0,
              red: stats.cards.red || 0
            },

            // Additional stats
            shots: {
              total: stats.shots.total || 0,
              on: stats.shots.on || 0
            },

            passes: {
              total: stats.passes.total || 0,
              key: stats.passes.key || 0,
              accuracy: stats.passes.accuracy || 0
            },

            tackles: {
              total: stats.tackles.total || 0,
              blocks: stats.tackles.blocks || 0,
              interceptions: stats.tackles.interceptions || 0
            },

            duels: {
              total: stats.duels.total || 0,
              won: stats.duels.won || 0
            },

            dribbles: {
              attempts: stats.dribbles.attempts || 0,
              success: stats.dribbles.success || 0,
              past: stats.dribbles.past || 0
            },

            fouls: {
              drawn: stats.fouls.drawn || 0,
              committed: stats.fouls.committed || 0
            },

            penalty: {
              won: stats.penalty.won || 0,
              commited: stats.penalty.commited || 0,
              scored: stats.penalty.scored || 0,
              missed: stats.penalty.missed || 0,
              saved: stats.penalty.saved || 0
            },

            lastUpdated: new Date()
          };
          // Push to seasons array instead of replacing entire document
          eplPlayerStats.seasons.push(seasonStats);
        } else {
          // Update existing season entry
          seasonStats.team = stats.team.name;
          seasonStats.teamId = teamId;
          seasonStats.position = stats.games.position;
          seasonStats.appearances = stats.games.appearences || 0;
          seasonStats.lineups = stats.games.lineups || 0;
          seasonStats.minutes = stats.games.minutes || 0;
          seasonStats.rating = stats.games.rating ? parseFloat(stats.games.rating) : null;

          // Update nested objects
          seasonStats.goals = {
            total: stats.goals.total || 0,
            assists: stats.goals.assists || 0,
            conceded: stats.goals.conceded || 0,
            saves: stats.goals.saves || 0
          };

          seasonStats.cards = {
            yellow: stats.cards.yellow || 0,
            yellowred: stats.cards.yellowred || 0,
            red: stats.cards.red || 0
          };

          seasonStats.shots = {
            total: stats.shots.total || 0,
            on: stats.shots.on || 0
          },

          seasonStats.passes = {
            total: stats.passes.total || 0,
            key: stats.passes.key || 0,
            accuracy: stats.passes.accuracy || 0
          },

          seasonStats.tackles = {
            total: stats.tackles.total || 0,
            blocks: stats.tackles.blocks || 0,
            interceptions: stats.tackles.interceptions || 0
          },

          seasonStats.duels = {
            total: stats.duels.total || 0,
            won: stats.duels.won || 0
          },

          seasonStats.dribbles = {
            attempts: stats.dribbles.attempts || 0,
            success: stats.dribbles.success || 0,
            past: stats.dribbles.past || 0
          },

          seasonStats.fouls = {
            drawn: stats.fouls.drawn || 0,
            committed: stats.fouls.committed || 0
          },

          seasonStats.penalty = {
            won: stats.penalty.won || 0,
            commited: stats.penalty.commited || 0,
            scored: stats.penalty.scored || 0,
            missed: stats.penalty.missed || 0,
            saved: stats.penalty.saved || 0
          },

          seasonStats.lastUpdated = new Date();
        }

        // Save the detailed stats document
        await eplPlayerStats.save();
        updatedPlayers++;

        const isKeeper = isGoalkeeper(stats.games.position);

        // Step 4b: Update the reference in the Player model
        // This maintains the connection between the detailed stats and the Player model
        await Player.findOneAndUpdate(
          { playerId: `epl_${player.id}` },
          {
            teamId: teamId,
            league: 'EPL',
            name: player.name,
            position: stats.games.position || "N/A",
            number: stats.games.number,
            nationality: player.nationality,
            age: player.age,
            height: player.height,
            weight: player.weight,
            image: player.photo,
            isCaptain: stats.games.captain || false,
            isInjured: player.injured || false,


            eplStatsRef: player.id.toString(), // Link to detailed stats
            stats: {
              gamesPlayed: stats.games.appearances || 0,
              gamesStarted: stats.games.lineups || 0,
              sportStats: isKeeper 
                ? new Map([
                    // Goalkeeper-specific stats
                    ['yellowCards', getSafeStatValue(stats, 'cards', 'yellow') || 0],
                    ['redCards', getSafeStatValue(stats, 'cards', 'red') || 0],
                    ['cleanSheets', (getSafeStatValue(stats, 'goals', 'conceded') === 0 && stats.games.appearances > 0) ? 1 : 0],
                    ['goalsSaved', getSafeStatValue(stats, 'goals', 'saves') || 0],
                    ['goalsConceded', getSafeStatValue(stats, 'goals', 'conceded') || 0],
                    ['penaltySaved', getSafeStatValue(stats, 'penalty', 'saved') || 0]
                  ])
                : new Map([
                    // Outfield player stats
                    ['goals', getSafeStatValue(stats, 'goals', 'total') || 0],
                    ['assists', getSafeStatValue(stats, 'goals', 'assists') || 0],
                    ['yellowCards', getSafeStatValue(stats, 'cards', 'yellow') || 0],
                    ['redCards', getSafeStatValue(stats, 'cards', 'red') || 0],
                    ['keyPasses', getSafeStatValue(stats, 'passes', 'key') || 0],
                    ['totalPasses', getSafeStatValue(stats, 'passes', 'total') || 0],
                    ['passAccuracy', getSafeStatValue(stats, 'passes', 'accuracy') || 0], // This might be a percentage
                    ['tackles', getSafeStatValue(stats, 'tackles', 'total') || 0],
                    ['blocks', getSafeStatValue(stats, 'tackles', 'blocks') || 0],
                    ['interceptions', getSafeStatValue(stats, 'tackles', 'interceptions') || 0],
                    ['shotsTotal', getSafeStatValue(stats, 'shots', 'total') || 0],
                    ['shotsOnTarget', getSafeStatValue(stats, 'shots', 'on') || 0],
                    ['dribblesAttempted', getSafeStatValue(stats, 'dribbles', 'attempts') || 0],
                    ['dribblesSuccessful', getSafeStatValue(stats, 'dribbles', 'success') || 0],
                    ['foulsDrawn', getSafeStatValue(stats, 'fouls', 'drawn') || 0],
                    ['foulsCommitted', getSafeStatValue(stats, 'fouls', 'committed') || 0],
                    ['penaltyScored', getSafeStatValue(stats, 'penalty', 'scored') || 0],
                    ['penaltyMissed', getSafeStatValue(stats, 'penalty', 'missed') || 0],
                    ['penaltyWon', getSafeStatValue(stats, 'penalty', 'won') || 0]
                  ])
            },
            lastUpdated: new Date()
          },
          { upsert: true }
        );
        
        // Add a delay to avoid hitting API rate limits (API-Football has strict limits)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (playerError) {
        console.error(`Error processing player ${playerData.player?.name || 'unknown'}:`, playerError);
      }
    }
    
    console.log(`EPL update completed: ${createdPlayers} new players, ${updatedPlayers} total players processed`);
    return true;

  } catch (error) {
    console.error('API-Football update error:', error.message);
    if (error.response) {
      console.error(`Status code: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}
