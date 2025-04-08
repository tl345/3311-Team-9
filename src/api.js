/**
 * API client for the sports stats app
 * 
 * This file serves as the central interface between the frontend React components
 * and the backend Express API. It handles all data fetching operations and
 * transforms the data into formats expected by the components.
 * 
 * The structure is organized by sport (NBA, NFL, EPL) with separate functions
 * for different data needs (teams, players, standings, etc.)
 */
import axios from 'axios';

// Backend API base URL - automatically handles dev vs production
const BACKEND_API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : '/api';

// ---------------- NBA ---------------- //
/**
 * Fetches top NBA players for display on the homepage
 * Gets players from the specialized top-players endpoint that processes and formats players with their team names and stats
 * @returns {Promise<Array>} Array of top NBA players
 */
export const getNbaPlayers = async () => {
    try {
      const res = await axios.get(`${BACKEND_API_URL}/top-players/NBA`);
      return res.data;
    } catch (error) {
      console.error('NBA Players Error:', error);
      return [];
    }
};

/**
 * Fetches all NBA teams
 * @returns {Promise<Array>} Array of NBA teams sorted alphabetically
 */
export const getNbaTeams = async () => {
    try {
      // Get teams and sort alphabetically by name
      const res = await axios.get(`${BACKEND_API_URL}/teams/NBA`);
      return res.data
        .map(team => ({
          id: team.teamId,
          name: team.displayName,
          logo: team.logo,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    } catch (error) {
      console.error('NBA Teams Error:', error);
      return [];
    }
};

/**
 * Fetches players for a specific NBA team
 * @param {*} teamName - Name of the team
 * @returns {Promise<Array>} Array of players for the team
 */
export const getNbaPlayersByTeam = async (teamName) => {
    try {
      // Find the team ID first
      const teamsRes = await axios.get(`${BACKEND_API_URL}/teams/NBA`);
    // More flexible team name matching
    const team = teamsRes.data.find(t => {
      const displayName = t.displayName.toLowerCase();
      const searchName = teamName.toLowerCase();
      
      // Match exact name or common variations
      return displayName.includes(searchName) || 
             searchName.includes(displayName) ||
             displayName.replace(' fc', '').includes(searchName) ||
             searchName.replace(' fc', '').includes(displayName);
    });
      
      if (!team) return [];
      
      // Get the team with its players
      const res = await axios.get(`${BACKEND_API_URL}/team/${team.teamId}`);
      return res.data.players.map(player => ({
        id: player.playerId,
        name: player.name,
        position: player.position || "N/A",
        number: player.number || "N/A",
      }));
    } catch (error) {
      console.error(`NBA Team Players Error (${teamName}):`, error);
      return [];
    }
};

// ---------------- NFL (Mock Data) ---------------- //
/**
 * Fetches players for a specific NFL team
 * @param {string} teamName - Name of the team
 * @returns {Promise<Array>} Array of players for the team
 */
export const getNflPlayersByTeam = async (teamName) => {
    // For now, return mock NFL players data based on team name
    const mockPlayers = [
      { id: `nfl_${Math.floor(Math.random() * 1000)}`, name: `QB ${teamName} #1`, position: "QB", number: "1" },
      { id: `nfl_${Math.floor(Math.random() * 1000)}`, name: `RB ${teamName} #2`, position: "RB", number: "22" },
      { id: `nfl_${Math.floor(Math.random() * 1000)}`, name: `WR ${teamName} #3`, position: "WR", number: "88" },
      { id: `nfl_${Math.floor(Math.random() * 1000)}`, name: `TE ${teamName} #4`, position: "TE", number: "87" },
      { id: `nfl_${Math.floor(Math.random() * 1000)}`, name: `OL ${teamName} #5`, position: "OL", number: "76" },
    ];
    
    return mockPlayers;
  };

export const getNflPlayers = async () => {
    return [
        { name: 'Patrick Mahomes' },
        { name: 'Josh Allen' },
        { name: 'Tyreek Hill' },
        { name: 'Justin Jefferson' },
        { name: 'Travis Kelce' },
    ];
};

export const getNflTeams = async () => {
    return [
        { name: 'Arizona Cardinals' },
        { name: 'Atlanta Falcons' },
        { name: 'Baltimore Ravens' },
        { name: 'Buffalo Bills' },
        { name: 'Carolina Panthers' },
        { name: 'Chicago Bears' },
        { name: 'Cincinnati Bengals' },
        { name: 'Cleveland Browns' },
        { name: 'Dallas Cowboys' },
        { name: 'Denver Broncos' },
        { name: 'Detroit Lions' },
        { name: 'Green Bay Packers' },
        { name: 'Houston Texans' },
        { name: 'Indianapolis Colts' },
        { name: 'Jacksonville Jaguars' },
        { name: 'Kansas City Chiefs' },
        { name: 'Las Vegas Raiders' },
        { name: 'Los Angeles Chargers' },
        { name: 'Los Angeles Rams' },
        { name: 'Miami Dolphins' },
        { name: 'Minnesota Vikings' },
        { name: 'New England Patriots' },
        { name: 'New Orleans Saints' },
        { name: 'New York Giants' },
        { name: 'New York Jets' },
        { name: 'Philadelphia Eagles' },
        { name: 'Pittsburgh Steelers' },
        { name: 'San Francisco 49ers' },
        { name: 'Seattle Seahawks' },
        { name: 'Tampa Bay Buccaneers' },
        { name: 'Tennessee Titans' },
        { name: 'Washington Commanders' },
    ];
};

// ---------------- EPL (Premier League) ---------------- //

/**
 * Fetches top EPL players based on goals scored
 * @returns {Promise<Array>} Array of top goal-scoring EPL players
 */
export const getEplPlayers = async () => {
    try {
      const res = await axios.get(`${BACKEND_API_URL}/top-players/EPL`);
      return res.data;
    } catch (error) {
      console.error('EPL Players Error:', error);
      return [];
    }
};

/**
 * Fetches all EPL teams
 * @returns {Promise<Array>} Array of EPL teams sorted by rank
 */
export const getEplTeams = async () => {
    try {
      // Get teams sorted by standings (the backend sorts them by rank)
      const res = await axios.get(`${BACKEND_API_URL}/teams/EPL`);
      return res.data.map(team => ({
        id: team.teamId,
        name: team.displayName,
        logo: team.logo,
      }));
    } catch (error) {
      console.error('EPL Teams Error:', error);
      return [];
    }
};

/**
 * Fetches players for a specific EPL team
 * @param {string} teamName - Name of the team
 * @returns {Promise<Array>} Array of players for the team
 */
export const getEplPlayersByTeam = async (teamName) => {
  try {
    console.log(`Fetching players for team: ${teamName}`); // Debug log

    // Fetch all teams first to find the correct team
    const teamsRes = await axios.get(`${BACKEND_API_URL}/teams/EPL`);
    console.log("Teams response:", teamsRes.data);

    // Comprehensive team name matching
    const team = teamsRes.data.find(t => {
      const displayName = t.displayName.toLowerCase();
      const baseName = t.name.toLowerCase();
      const searchName = teamName.toLowerCase();
      
      console.log(`Matching team: ${displayName} (${baseName}) against ${searchName}`);
      
      // Match against both display name and base name
      return displayName === searchName ||
             baseName === searchName ||
             displayName.includes(searchName) || 
             baseName.includes(searchName) ||
             searchName.includes(displayName) ||
             searchName.includes(baseName) ||
             displayName.replace(/ fc$/, '') === searchName ||
             baseName.replace(/ fc$/, '') === searchName;
    });

    if (!team) {
      console.warn(`No team found matching: ${teamName}`);
      console.log('Available teams:', teamsRes.data.map(t => `${t.name} (${t.displayName})`));
      return [];
    }
    
    console.log("Matched team:", {
      id: team.teamId,
      name: team.name,
      displayName: team.displayName
    });

    // Fetch players from the found team using full team ID
    const teamId = `epl_${team.teamId}`;
    console.log(`Fetching players for team ID: ${teamId}`);
    const res = await axios.get(`${BACKEND_API_URL}/team/${teamId}`);
    console.log("Players response:", {
      status: res.status,
      data: res.data
    });

    return res.data.players.map(player => ({
      id: player.playerId,
      name: player.name,
      position: player.position || "N/A",
      number: player.number || "N/A",
      appearances: player.stats?.gamesPlayed || "N/A",
      goals: player.stats?.sportStats?.goals || 0,
    }));

  } catch (error) {
    console.error(`EPL Team Players Error (${teamName}):`, error);
    return [];
  }
};


/**
 * Fetches detailed player statistics for any player
 * @param {string} playerId - Player's unique ID
 * @returns {Promise<Object>} Player details with sport-specific stats
 */
export const getPlayerDetails = async (playerId) => {
    try {
      // Get player details from backend database
      const res = await axios.get(`${BACKEND_API_URL}/player/${playerId}`);
      const player = res.data;
      
      // Common player fields
      const playerDetails = {
        id: player.playerId,
        name: player.name,
        league: player.league,
        nationality: player.nationality || "N/A",
        age: player.age || "N/A",
        height: player.height || "N/A",
        weight: player.weight || "N/A",
        appearances: player.stats?.gamesPlayed || "N/A",
      };
      
      // Add sport-specific stats based on league
      if (player.league === 'EPL') {
        return {
          ...playerDetails,
          goals: player.stats?.sportStats?.goals || 0,
          assists: player.stats?.sportStats?.assists || 0,
          yellowCards: player.stats?.sportStats?.yellowCards || 0,
          redCards: player.stats?.sportStats?.redCards || 0,
        };
      } else if (player.league === 'NBA') {
        return {
          ...playerDetails,
          points: player.stats?.sportStats?.points || 0,
          assists: player.stats?.sportStats?.assists || 0,
          rebounds: player.stats?.sportStats?.rebounds || 0,
          blocks: player.stats?.sportStats?.blocks || 0,
          steals: player.stats?.sportStats?.steals || 0
        };
      } else {
        // NFL stats
        return {
          ...playerDetails,
          touchdowns: player.stats?.sportStats?.touchdowns || 0,
          yards: player.stats?.sportStats?.yards || 0,
        };
      }
    } catch (error) {
      console.error(`Player Details Error (ID: ${playerId}):`, error);
      return null;
    }
};

/**
 * Triggers a manual update of the sports data in the database
 * Makes API calls to fetch fresh data from external sources
 * @returns {Promise<Object>} Update results
 */
export const updateSportsData = async () => {
  try {
    const res = await axios.post(`${BACKEND_API_URL}/update`);
    // Extract the nested result object
    return res.data.result;
  } catch (error) {
    console.error('Failed to update sports data:', error);
    return { success: false, message: 'Failed to update data' };
  }
};

/**
 * Fetches the most recent update timestamp
 * @returns {Promise<Object|null>} Object containing timestamp information or null if not found
 */
export const getLastUpdateTime = async () => {
    try {
      const res = await axios.get(`${BACKEND_API_URL}/last-update`);
      return res.data;
    } catch (error) {
      console.error('Failed to fetch update time:', error);
      return null;
    }
};