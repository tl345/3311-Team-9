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
import axios, { all } from 'axios';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

// API options for EPL
const API_SOURCES = {
  API_FOOTBALL: 'api-football'
};

// Active API source
const ACTIVE_API = API_SOURCES.API_FOOTBALL;
const CURRENT_SEASON = 2024;

/**
 * Updates all EPL data by fetching from the selected API source
 * @returns {Promise<boolean>} Success status
 */
export const updateEPLData = async () => {
  try {
    console.log('Clearing existing EPL data before update...');
    await Team.deleteMany({ league: 'EPL' });
    await Player.deleteMany({ league: 'EPL' });

    if (ACTIVE_API === API_SOURCES.API_FOOTBALL) {
      return await updateFromApiFootball();
    }
    
    return false;
  } catch (error) {
    console.error('EPL update error:', error);
    return false;
  }
};

/**
 * Updates EPL data from the API-Football service
 * This function:
 * 1. Fetches league standings which include team data
 * 2. Updates team records in the database
 * 3. For each team, fetches its players (with rate limiting)
 * 4. Updates player records with current stats
 * 
 * The function implements staggered requests with delays to avoid
 * hitting API rate limits (API-Football has strict limits)
 * @returns {Promise<boolean>} Success status
 */
async function updateFromApiFootball() {
  try {
    console.log('Fetching EPL standings data for season 2024...');
    // First API call: Get standings which includes teams
    const response = await axios.get('https://v3.football.api-sports.io/standings', {
      headers: { 'x-apisports-key': process.env.EPL_API_KEY },
      params: { league: 39, season: CURRENT_SEASON },
    });
    
    // Log response structure to help diagnose issues
    //console.log(`EPL standings API response status: ${response.status}`);
    console.log(`EPL teams found: ${response.data?.response?.[0]?.league?.standings?.[0]?.length || 0}`);

    // Extract teams from the standings response
    const teams = response.data.response[0].league.standings[0];
    let successCount = 0;
    
    // Process each team (updating team data and fetching players)
    for (const teamData of teams) {
      const team = teamData.team;
      
      // Update or create a team record
      await Team.findOneAndUpdate(
        { teamId: `epl_${team.id}` },
        {
          league: 'EPL',
          name: team.name,
          displayName: team.name,
          logo: team.logo,
          standings: {
            rank: teamData.rank, // Position in standings
            points: teamData.points, // Season points
            wins: teamData.all.win,
            losses: teamData.all.lose,
            draws: teamData.all.draw,
            gamesPlayed: teamData.all.played,
            winPercentage: teamData.all.played > 0 
              ? (teamData.all.win / teamData.all.played) 
              : 0
          },
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
      successCount++;
      
      // Second API call: Get players for this team (implementing careful rate limiting to avoid API throttling)
      // Implemented pagination to get all players who might be on page 2 or beyond
      try {
        //console.log(`Fetching players for ${team.name} (ID: ${team.id})...`);

        let allPlayers = [];
        let currentPage = 1;
        let totalPages = 1;

        // Loop through all pages of players
        while (currentPage <= totalPages) {
          const playersResponse = await axios.get('https://v3.football.api-sports.io/players', {
            headers: { 'x-apisports-key': process.env.EPL_API_KEY },
            params: { 
              team: team.id, 
              season: CURRENT_SEASON,
              page: currentPage
            },
          });

          // Add this page's players to our collection
          allPlayers = [...allPlayers, ...playersResponse.data.response];
          
          // Update pagination info
          totalPages = playersResponse.data.paging.total;
          //console.log(`Fetched page ${currentPage} of ${totalPages} for ${team.name}`);
          currentPage++;

          // Delay between pages
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`Found ${allPlayers.length} players for ${team.name}`);
        
        // Process each player from this team
        for (const playerData of allPlayers) {
          const player = playerData.player;

          // Extract Premier League-specific statistics from player data
          // Players may have stats from multiple competitions (Champions League, FA Cup, etc.)
          // By filtering for league ID 39 (Premier League), we get more accurate statistics
          // Fallback to first entry only if no Premier League stats exist
          const stats = playerData.statistics.find(
            (stat) => stat.league.id === 39 && stat.league.season === CURRENT_SEASON
          ) || playerData.statistics[0]; // Fallback to first entry if no EPL stats
          
          // Update or create player record
          // Only includes players with at least one appearance in the Premier League
          if (stats && stats.games?.appearences > 0) {
            await Player.findOneAndUpdate(
              { playerId: `epl_${player.id}` },
              {
                teamId: `epl_${team.id}`,
                league: 'EPL',
                name: player.name,
                position: stats?.games?.position || "N/A",
                number: stats?.games?.number,
                nationality: player.nationality,
                age: player.age,
                height: player.height,
                weight: player.weight,
                image: player.photo,
                stats: {
                  gamesPlayed: stats?.games?.appearences || 0,
                  gamesStarted: stats?.games?.lineups || 0,
                  sportStats: new Map([
                    ['goals', stats?.goals?.total || 0],
                    ['assists', stats?.goals?.assists || 0],
                    ['yellowCards', stats?.cards?.yellow || 0],
                    ['redCards', stats?.cards?.red || 0]
                  ])
                },
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
          }
          //console.log(`Updated player: ${player.name} (${player.id}) for ${team.name}`);
        }
        
        // Add a delay to avoid hitting API rate limits (API-Football has strict limits)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (playerError) {
        console.error(`Error fetching players for team ${team.name}:`, playerError.message);
        if (playerError.response) {
          console.error(`Status: ${playerError.response.status}`);
          console.error('Response data:', playerError.response.data);
        }
      }
    }
    
    console.log(`Successfully updated ${successCount} EPL teams`);
    return true;
  } catch (error) {
    console.error('API-Football update error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}
