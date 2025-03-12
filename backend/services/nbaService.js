/**
 * NBA Data Service
 * 
 * This service is responsible for fetching NBA data from external APIs and storing it in MongoDB.
 * It implements a two-pass approach to handle player trades correctly:
 * 
 * 1. First pass: Fetch all teams and their players from the external API
 * 2. Second pass: Process players to ensure each appears once with their most recent team
 * 
 * The service handles special cases like:
 * - Players who were traded between teams during the season
 * - Combined stats entries (marked as "2TM" for players on two teams)
 * - Filtering out non-current players
 * 
 * NOTE: This service relies on REST NBA API as its data source
 */

import axios from 'axios';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

// Multiple API options defined for easy switching
const API_SOURCES = {
  BALLDONTLIE: 'balldontlie', // Has pretty good player info
  RAPIDAPI_BASKETBALL: 'rapidapi-basketball', // Might use for standings and player info
  REST_NBA_API: 'rest-nba-api'
};

// Active API source
const ACTIVE_API = API_SOURCES.REST_NBA_API;

/**
 * Updates all NBA data by fetching from the selected API source
 * @returns {Promise<boolean>} Success status
 */
export const updateNBAData = async () => {
    try {
      return await updateFromRestNbaApi();
    } catch (error) {
      console.error('NBA update error:', error);
      return false;
    }
};

/**
 * Updates data for all NBA teams from REST API
 * 
 * This function:
 * 1. Fetches and updates all NBA teams
 * 2. For each team, fetches players from the current season
 * 3. Collects all players in memory to handle trades properly
 * 4. Processes all players to ensure each appears with their current team
 * 5. Handles special cases like combined stats entries ("2TM")
 * @returns {Promise<boolean>} Success status
 */
async function updateFromRestNbaApi() {
  try {
    const nbaTeams = [
      { id: 1, name: 'Atlanta Hawks', abbreviation: 'ATL' },
      { id: 2, name: 'Boston Celtics', abbreviation: 'BOS' },
      { id: 3, name: 'Brooklyn Nets', abbreviation: 'BRK' },
      { id: 4, name: 'Charlotte Hornets', abbreviation: 'CHO' },
      { id: 5, name: 'Chicago Bulls', abbreviation: 'CHI' },
      { id: 6, name: 'Cleveland Cavaliers', abbreviation: 'CLE' },
      { id: 7, name: 'Dallas Mavericks', abbreviation: 'DAL' },
      { id: 8, name: 'Denver Nuggets', abbreviation: 'DEN' },
      { id: 9, name: 'Detroit Pistons', abbreviation: 'DET' },
      { id: 10, name: 'Golden State Warriors', abbreviation: 'GSW' },
      { id: 11, name: 'Houston Rockets', abbreviation: 'HOU' },
      { id: 12, name: 'Indiana Pacers', abbreviation: 'IND' },
      { id: 13, name: 'Los Angeles Clippers', abbreviation: 'LAC' },
      { id: 14, name: 'Los Angeles Lakers', abbreviation: 'LAL' },
      { id: 15, name: 'Memphis Grizzlies', abbreviation: 'MEM' },
      { id: 16, name: 'Miami Heat', abbreviation: 'MIA' },
      { id: 17, name: 'Milwaukee Bucks', abbreviation: 'MIL' },
      { id: 18, name: 'Minnesota Timberwolves', abbreviation: 'MIN' },
      { id: 19, name: 'New Orleans Pelicans', abbreviation: 'NOP' },
      { id: 20, name: 'New York Knicks', abbreviation: 'NYK' },
      { id: 21, name: 'Oklahoma City Thunder', abbreviation: 'OKC' },
      { id: 22, name: 'Orlando Magic', abbreviation: 'ORL' },
      { id: 23, name: 'Philadelphia 76ers', abbreviation: 'PHI' },
      { id: 24, name: 'Phoenix Suns', abbreviation: 'PHO' },
      { id: 25, name: 'Portland Trail Blazers', abbreviation: 'POR' },
      { id: 26, name: 'Sacramento Kings', abbreviation: 'SAC' },
      { id: 27, name: 'San Antonio Spurs', abbreviation: 'SAS' },
      { id: 28, name: 'Toronto Raptors', abbreviation: 'TOR' },
      { id: 29, name: 'Utah Jazz', abbreviation: 'UTA' },
      { id: 30, name: 'Washington Wizards', abbreviation: 'WAS' }
    ];
    
    // Store all players across all teams
    const allPlayers = {};
    
    // First pass: Fetch all teams and all players
    // This section updates team records and collects all player data
    for (const team of nbaTeams) {
      // Update the team
      await Team.findOneAndUpdate(
        { teamId: `nba_${team.id}` },
        { 
          league: 'NBA', 
          name: team.name, 
          displayName: team.name, 
          logo: '', 
          city: team.name.split(' ')[0],
          lastUpdated: new Date() 
        },
        { upsert: true, new: true }
      );
      
      // Fetch players for this team
      try {
        console.log(`Fetching players for ${team.name} (${team.abbreviation})`);
        
        // Fetching data from REST NBA API
        const playersResponse = await axios.get(`http://rest.nbaapi.com/api/PlayerDataTotals/team/${team.abbreviation}`, {
          params: { season: 2025, pageSize: 20 }
        });
        
        if (playersResponse.data?.length > 0) {
          const currentPlayers = playersResponse.data.filter(p => 
            p.season === 2025 && p.games > 0
          );
          
          // Store all players with their team info
          for (const player of currentPlayers) {
            if (!allPlayers[player.playerName]) {
              allPlayers[player.playerName] = [];
            }
            // Store player data and current team
            allPlayers[player.playerName].push({
              playerData: player,
              teamId: `nba_${team.id}`,
              teamName: team.name
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error fetching players for ${team.name}:`, error);
      }
    }
    
    // Second pass: Process all players AFTER fetching all data
    // This ensures players who were traded appear on their most recent team
    console.log("Processing all players to resolve trades...");
    
    // First, clear all NBA player records to prevent duplicates
    await Player.deleteMany({ league: 'NBA' });
    
    // Process each player
    for (const playerName in allPlayers) {
        try {
            // Filter out combines stats entries with "2TM", "3TM" etc
            const validTeamEntries = allPlayers[playerName].filter(entry => 
              !entry.playerData.team.includes('TM')
            );
            
            // If no valid team entries, use all entries
            const entriesToProcess = validTeamEntries.length > 0 ? validTeamEntries : allPlayers[playerName];
            
            // Sort by ID to get most recent team (higher ID = more recent entry)
            const playerVersions = entriesToProcess.sort((a, b) => b.playerData.id - a.playerData.id);
            
            // Use the most recent version of the player
            const mostRecent = playerVersions[0];
            const player = mostRecent.playerData;
            
            // Skip entries with "2TM", "3TM" etc. as team assignment
            if (player.team.includes('TM')) {
              console.log(`Skipping combined stats entry for ${player.playerName}`);
              continue;
            }
        
            const teamId = mostRecent.teamId;
            
            // Log for debugging
            //console.log(`Player ${player.playerName}: Team=${player.team}, ID=${player.id}`);
            
            // Add the player with their most recent team
            await Player.create({
              playerId: `nba_${player.playerId}`,
              teamId: teamId,
              league: 'NBA',
              name: player.playerName,
              position: player.position,
              number: '',
              age: player.age,
              stats: {
                gamesPlayed: player.games,
                gamesStarted: player.gamesStarted,
                sportStats: new Map([
                  ['points', player.points],
                  ['assists', player.assists],
                  ['rebounds', player.totalRb],
                  ['blocks', player.blocks],
                  ['steals', player.steals]
                ])
              },
              lastUpdated: new Date()
            });
            
            //console.log(`Processed ${player.playerName} to team ${mostRecent.teamName}`);
        } catch (error) {
            console.error(`Error processing player ${playerName}:`, error);
        }
    }
    
    return true;
  } catch (error) {
    console.error('NBA update error:', error);
    return false;
  }
}

// Export the function
export { updateFromRestNbaApi as updateNBATeam };