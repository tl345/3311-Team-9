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
import axios from 'axios';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

// API options for EPL
const API_SOURCES = {
  API_FOOTBALL: 'api-football'
};

// Active API source
const ACTIVE_API = API_SOURCES.API_FOOTBALL;

/**
 * Updates all EPL data by fetching from the selected API source
 * @returns {Promise<boolean>} Success status
 */
export const updateEPLData = async () => {
  try {
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
    // First API call: Get standings which includes teams
    const response = await axios.get('https://v3.football.api-sports.io/standings', {
      headers: { 'x-apisports-key': process.env.EPL_API_KEY },
      params: { league: 39, season: 2024 }, // 2024-2025 season
    });
    
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
      try {
        const playersResponse = await axios.get('https://v3.football.api-sports.io/players', {
          headers: { 'x-apisports-key': process.env.EPL_API_KEY },
          params: { team: team.id, season: 2024 }, // 2024-2025 season
        });
        
        // Process each player from this team
        for (const playerData of playersResponse.data.response) {
          const player = playerData.player;
          const stats = playerData.statistics[0]; // First stat entry has current season stats
          
          // Update or create player record
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
        
        // Add a delay to avoid hitting API rate limits (API-Football has strict limits)
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (playerError) {
        // If player fetching fails for one team, log it but continue with other teams
        console.error(`Error fetching players for team ${team.name}:`, playerError);
      }
    }
    
    console.log(`Successfully updated ${successCount} EPL teams`);
    return true;
  } catch (error) {
    console.error('API-Football update error:', error);
    return false;
  }
}
