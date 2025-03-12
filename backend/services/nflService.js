/**
 * NFL Data Service
 * 
 * This service handles NFL data using mock data since we don't have a reliable NFL API yet
 * It provides realistic team and player data with fictional statistics
 * 
 * The mock data approach:
 * 1. Creates realistic NFL teams with current season win/loss records
 * 2. Populates each team with star players (primarily quarterbacks)
 * 
 * This design allows easy replacement with a real API in the future
 * Just need to change the ACTIVE_API constant and implement the corresponding API connection function
 */
import axios from 'axios';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

// Example API sources for NFL
const API_SOURCES = {
  MOCK_DATA: 'mock-data'
};

// Active API source - easy to switch when we find a good NFL API
const ACTIVE_API = API_SOURCES.MOCK_DATA;

/**
 * Main function to update NFL data
 * Routes to the appropriate data source based on ACTIVE_API setting
 * @returns {Promise<boolean>} Success status of the update operation
 */
export const updateNFLData = async () => {
  try {
    if (ACTIVE_API === API_SOURCES.MOCK_DATA) {
      return await updateFromMockData();
    }
    // Our future API implementation would go here
    
    return false;
  } catch (error) {
    console.error('NFL update error:', error);
    return false;
  }
};

/**
 * Updates NFL data using locally defined mock data
 * This function:
 * 1. Creates/updates NFL teams with realistic season records
 * 2. Associates players with their teams
 * 
 * @returns {Promise<boolean>} Success status of the update operation
 */
async function updateFromMockData() {
  try {
    // NFL mock data
    const nflTeams = [
      { id: 1, name: 'Arizona Cardinals', city: 'Arizona', wins: 4, losses: 3 },
      { id: 2, name: 'Atlanta Falcons', city: 'Atlanta', wins: 5, losses: 2 },
      { id: 3, name: 'Baltimore Ravens', city: 'Baltimore', wins: 6, losses: 1 },
      { id: 4, name: 'Buffalo Bills', city: 'Buffalo', wins: 5, losses: 2 },
      { id: 5, name: 'Carolina Panthers', city: 'Carolina', wins: 1, losses: 6 },
      { id: 6, name: 'Chicago Bears', city: 'Chicago', wins: 3, losses: 4 },
      { id: 7, name: 'Cincinnati Bengals', city: 'Cincinnati', wins: 4, losses: 3 },
      { id: 8, name: 'Cleveland Browns', city: 'Cleveland', wins: 2, losses: 5 },
      { id: 9, name: 'Dallas Cowboys', city: 'Dallas', wins: 4, losses: 3 },
      { id: 10, name: 'Denver Broncos', city: 'Denver', wins: 4, losses: 3 },
      { id: 11, name: 'Detroit Lions', city: 'Detroit', wins: 6, losses: 1 },
      { id: 12, name: 'Green Bay Packers', city: 'Green Bay', wins: 5, losses: 2 },
      { id: 13, name: 'Houston Texans', city: 'Houston', wins: 5, losses: 2 },
      { id: 14, name: 'Indianapolis Colts', city: 'Indianapolis', wins: 3, losses: 4 },
      { id: 15, name: 'Jacksonville Jaguars', city: 'Jacksonville', wins: 2, losses: 5 },
      { id: 16, name: 'Kansas City Chiefs', city: 'Kansas City', wins: 7, losses: 0 },
      { id: 17, name: 'Las Vegas Raiders', city: 'Las Vegas', wins: 2, losses: 5 },
      { id: 18, name: 'Los Angeles Chargers', city: 'Los Angeles', wins: 3, losses: 3 },
      { id: 19, name: 'Los Angeles Rams', city: 'Los Angeles', wins: 3, losses: 4 },
      { id: 20, name: 'Miami Dolphins', city: 'Miami', wins: 2, losses: 5 },
      { id: 21, name: 'Minnesota Vikings', city: 'Minnesota', wins: 6, losses: 1 },
      { id: 22, name: 'New England Patriots', city: 'New England', wins: 1, losses: 6 },
      { id: 23, name: 'New Orleans Saints', city: 'New Orleans', wins: 3, losses: 4 },
      { id: 24, name: 'New York Giants', city: 'New York', wins: 2, losses: 5 },
      { id: 25, name: 'New York Jets', city: 'New York', wins: 3, losses: 4 },
      { id: 26, name: 'Philadelphia Eagles', city: 'Philadelphia', wins: 4, losses: 3 },
      { id: 27, name: 'Pittsburgh Steelers', city: 'Pittsburgh', wins: 5, losses: 2 },
      { id: 28, name: 'San Francisco 49ers', city: 'San Francisco', wins: 3, losses: 4 },
      { id: 29, name: 'Seattle Seahawks', city: 'Seattle', wins: 4, losses: 3 },
      { id: 30, name: 'Tampa Bay Buccaneers', city: 'Tampa Bay', wins: 4, losses: 3 },
      { id: 31, name: 'Tennessee Titans', city: 'Tennessee', wins: 1, losses: 5 },
      { id: 32, name: 'Washington Commanders', city: 'Washington', wins: 6, losses: 1 }
    ];
    
    const nflPlayers = [
      { id: 101, teamId: 1, name: 'Kyler Murray', position: 'QB', number: '1' },
      { id: 102, teamId: 2, name: 'Kirk Cousins', position: 'QB', number: '8' },
      { id: 103, teamId: 3, name: 'Lamar Jackson', position: 'QB', number: '8' },
      { id: 104, teamId: 4, name: 'Josh Allen', position: 'QB', number: '17' },
      { id: 105, teamId: 5, name: 'Bryce Young', position: 'QB', number: '9' },
      { id: 106, teamId: 6, name: 'Caleb Williams', position: 'QB', number: '18' },
      { id: 107, teamId: 7, name: 'Joe Burrow', position: 'QB', number: '9' },
      { id: 108, teamId: 8, name: 'Deshaun Watson', position: 'QB', number: '4' },
      { id: 109, teamId: 9, name: 'Dak Prescott', position: 'QB', number: '4' },
      { id: 110, teamId: 10, name: 'Bo Nix', position: 'QB', number: '10' },
      { id: 111, teamId: 11, name: 'Jared Goff', position: 'QB', number: '16' },
      { id: 112, teamId: 12, name: 'Jordan Love', position: 'QB', number: '10' },
      { id: 113, teamId: 13, name: 'C.J. Stroud', position: 'QB', number: '7' },
      { id: 114, teamId: 14, name: 'Anthony Richardson', position: 'QB', number: '5' },
      { id: 115, teamId: 15, name: 'Trevor Lawrence', position: 'QB', number: '16' },
      { id: 116, teamId: 16, name: 'Patrick Mahomes', position: 'QB', number: '15' },
      { id: 117, teamId: 16, name: 'Travis Kelce', position: 'TE', number: '87' },
      { id: 118, teamId: 17, name: 'Gardner Minshew', position: 'QB', number: '15' },
      { id: 119, teamId: 18, name: 'Justin Herbert', position: 'QB', number: '10' },
      { id: 120, teamId: 19, name: 'Matthew Stafford', position: 'QB', number: '9' },
      { id: 121, teamId: 20, name: 'Tua Tagovailoa', position: 'QB', number: '1' },
      { id: 122, teamId: 21, name: 'Sam Darnold', position: 'QB', number: '14' },
      { id: 123, teamId: 22, name: 'Drake Maye', position: 'QB', number: '10' },
      { id: 124, teamId: 23, name: 'Derek Carr', position: 'QB', number: '4' },
      { id: 125, teamId: 24, name: 'Daniel Jones', position: 'QB', number: '8' },
      { id: 126, teamId: 25, name: 'Aaron Rodgers', position: 'QB', number: '8' },
      { id: 127, teamId: 26, name: 'Jalen Hurts', position: 'QB', number: '1' },
      { id: 128, teamId: 27, name: 'Russell Wilson', position: 'QB', number: '3' },
      { id: 129, teamId: 28, name: 'Brock Purdy', position: 'QB', number: '13' },
      { id: 130, teamId: 29, name: 'Geno Smith', position: 'QB', number: '7' },
      { id: 131, teamId: 30, name: 'Baker Mayfield', position: 'QB', number: '6' },
      { id: 132, teamId: 31, name: 'Will Levis', position: 'QB', number: '8' },
      { id: 133, teamId: 32, name: 'Jayden Daniels', position: 'QB', number: '5' }
    ];
    
    // Save teams to MongoDB
    for (const team of nflTeams) {
      await Team.findOneAndUpdate(
        { teamId: `nfl_${team.id}` },
        {
          league: 'NFL',
          name: team.name,
          displayName: team.name,
          city: team.city,
          standings: {
            wins: team.wins,
            losses: team.losses,
            winPercentage: team.wins / (team.wins + team.losses)
          },
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    // Save players to MongoDB
    for (const player of nflPlayers) {
      await Player.findOneAndUpdate(
        { playerId: `nfl_${player.id}` },
        {
          teamId: `nfl_${player.teamId}`,
          league: 'NFL',
          name: player.name,
          position: player.position,
          number: player.number,
          stats: {
            sportStats: new Map([
              ['touchdowns', Math.floor(Math.random() * 30)], // Random TD count
              ['yards', Math.floor(Math.random() * 3000)] // Random yards
            ])
          },
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    console.log(`Successfully updated ${nflTeams.length} NFL teams with mock data`);
    return true;
  } catch (error) {
    console.error('Mock NFL data update error:', error);
    return false;
  }
}
