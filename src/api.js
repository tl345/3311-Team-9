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

// Backend API base URL - uses Vite environment variable with fallback to localhost
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || (window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://three311-team-9.onrender.com');


// ---------------- NBA ---------------- //
/**
 * Fetches top NBA players for display on the homepage
 * Gets players from the specialized top-players endpoint that processes and formats players with their team names and stats
 * @returns {Promise<Array>} Array of top NBA players
 */
export const getNbaPlayers = async (season = null) => {
    try {
      console.log(`Fetching NBA players for season: ${season || 'latest'}`); 

      // Add season parameter to the API request if provided
      const endpoint = season ? 
        `${BACKEND_API_URL}/top-players/NBA?season=${season}` : 
        `${BACKEND_API_URL}/top-players/NBA`;
      // Get players from backend database
      const res = await axios.get(endpoint);
      console.log('NBA players response:', res.data); // Add debug log
      return res.data;
    } catch (error) {
      console.error('NBA Players Error:', error);
      return [];
    }
};

/**
 * Fetches all NBA teams
 * @param {number} season - Optional season parameter
 * @returns {Promise<Array>} Array of NBA teams sorted alphabetically
 */
export const getNbaTeams = async (season = null) => {
    try {
      // Add season parameter to URL if provided
      const endpoint = season ?
        `${BACKEND_API_URL}/teams/NBA?season=${season}` :
        `${BACKEND_API_URL}/teams/NBA`;

      // Get teams and sort alphabetically by name
      const res = await axios.get(endpoint);
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
export const getNbaPlayersByTeam = async (teamName, season = null) => {
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

      // Add season parameter to URL if provided
      const endpoint = season ? 
        `${BACKEND_API_URL}/team/${team.teamId}?season=${season}` :
        `${BACKEND_API_URL}/team/${team.teamId}`;
      
      // Get the team with its players
      const res = await axios.get(endpoint);
      return res.data.players.map(player => ({
        id: player.playerId,
        name: player.name,
        position: player.position || "N/A",
        number: player.number || "N/A",
        stats: player.stats
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
export const getEplPlayers = async (season = null) => {
    try {
      // Add season parameter to the API request if provided
      const endpoint = season ? 
        `${BACKEND_API_URL}/top-players/EPL?season=${season}` : 
        `${BACKEND_API_URL}/top-players/EPL`;
      // Get players from backend database
      const res = await axios.get(endpoint);
      return res.data;
    } catch (error) {
      console.error('EPL Players Error:', error);
      return [];
    }
};

/**
 * Fetches all EPL teams
 * @param {number} season - Optional season parameter
 * @returns {Promise<Array>} Array of EPL teams sorted by rank
 */
export const getEplTeams = async (season = null) => {
    try {
      // Add season parameter to URL if provided
      const endpoint = season ?
        `${BACKEND_API_URL}/teams/EPL?season=${season}` :
        `${BACKEND_API_URL}/teams/EPL`;

      // Get teams sorted by standings (the backend sorts them by rank)
      const res = await axios.get(endpoint);
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
export const getEplPlayersByTeam = async (teamName, season = null) => {
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
    
    // console.log("Matched team:", {
    //   id: team.teamId,
    //   name: team.name,
    //   displayName: team.displayName
    // });

    // Fetch players from the found team using full team ID
    const teamId = team.teamId;
    console.log(`Fetching players for team ID: ${teamId} and season: ${season}`); 
    
    const endpoint = season ?
      `${BACKEND_API_URL}/team/${teamId}?season=${season}` : 
      `${BACKEND_API_URL}/team/${teamId}`;
    
    const res = await axios.get(endpoint);
    console.log("Players response:", {
      status: res.status,
      data: res.data
    });

    return res.data.players.map(player => ({
      id: player.playerId,
      name: player.name,
      position: player.position || "N/A",
      number: player.number || "N/A",
      stats: player.stats
    }));

  } catch (error) {
    console.error(`EPL Team Players Error (${teamName}):`, error);
    return [];
  }
};

function isEplGoalkeeper(position) {
  if (!position) return false;
  return position.toLowerCase().includes('goalkeeper') || 
         position.toLowerCase() === 'gk' ||
         position.toLowerCase() === 'g';
}

/**
 * Fetches detailed player statistics for any player
 * @param {string} playerId - Player's unique ID
 * @returns {Promise<Object>} Player details with sport-specific stats
 */
export const getPlayerDetails = async (playerId, season = null) => {
    try {
      console.log(`Fetching player details for ${playerId} with season: ${season || 'default'}`);
      // Add season parameter to the API request if provided
      const endpoint = season ? 
        `${BACKEND_API_URL}/player/${playerId}?season=${season}` : 
        `${BACKEND_API_URL}/player/${playerId}`;

      // Get player details from backend database
      const res = await axios.get(endpoint);
      const player = res.data;

      // Preserve regularSeasons and playoffs arrays if available
      const regularSeasons = player.regularSeasons;
      const playoffs = player.playoffs;
      const seasons = player.seasons;
      
      // Common player fields
      const playerDetails = {
        id: player.playerId,
        name: player.name,
        image: player.photo, // only works if i add image as it seems to be using player database|| player.image,
        team: player.seasons?.[0]?.team || player.team,
        league: player.league,
        nationality: player.nationality || "N/A",
        age: player.age || "N/A",
        height: player.height || "N/A",
        weight: player.weight || "N/A",
        appearances: player.stats?.gamesPlayed || "N/A",
        stats: player.stats,
        // These preserve season data
        regularSeasons, 
        playoffs,
        seasons,
        nbaStatsRef: player.nbaStatsRef
      };
      
      // Add sport-specific stats based on league
      if (player.league === 'EPL') {
        const isKeeper = isEplGoalkeeper(player.seasons?.[0]?.position || player.position);
        const currentSeason = player.seasons?.[0] || {};
        
        // Get the season-specific age
        const currentAge = player.age || 0;
        const latestSeason = 2024; // Current EPL season (2024-2025)
        const selectedSeason = season || latestSeason;
        const ageDifference = latestSeason - selectedSeason;
        const adjustedAge = currentAge - ageDifference;

        return {
          ...playerDetails,
          age: adjustedAge || "N/A",
          height: player.height || "N/A",
          weight: player.weight || "N/A",
          appearances: currentSeason.appearances || playerDetails.appearances || 0,
          position: currentSeason.position || player.position || "N/A",
          yellowCards: currentSeason.cards?.yellow || 0,
          redCards: currentSeason.cards?.red || 0,
          isGoalkeeper: isKeeper,
          
          // Goalkeeper stats
          cleanSheets: isKeeper ? (currentSeason.cleanSheets || 0) : undefined,
          goalsSaved: isKeeper ? currentSeason.goals?.saves || 0 : undefined,
          goalsConceded: isKeeper ? currentSeason.goals?.conceded || 0 : undefined,
          penaltySaved: isKeeper ? currentSeason.penalty?.saved || 0 : undefined,
          
          // Outfield player stats
          goals: !isKeeper ? currentSeason.goals?.total || 0 : undefined,
          assists: !isKeeper ? currentSeason.goals?.assists || 0 : undefined,
          keyPasses: !isKeeper ? currentSeason.passes?.key || 0 : undefined,
          totalPasses: !isKeeper ? currentSeason.passes?.total || 0 : undefined,
          tackles: !isKeeper ? currentSeason.tackles?.total || 0 : undefined,
          interceptions: !isKeeper ? currentSeason.tackles?.interceptions || 0 : undefined,
          duelsTotal: !isKeeper ? currentSeason.duels?.total || 0 : undefined,
          duelsWon: !isKeeper ? currentSeason.duels?.won || 0 : undefined,
          dribblesAttempted: !isKeeper ? currentSeason.dribbles?.attempts || 0 : undefined,
          dribblesSuccessful: !isKeeper ? currentSeason.dribbles?.success || 0 : undefined,
          penaltyScored: !isKeeper ? currentSeason.penalty?.scored || 0 : undefined,
          penaltyMissed: !isKeeper ? currentSeason.penalty?.missed || 0 : undefined
        };
      } else if (player.league === 'NBA') {
        // Find the season-specific stats instead of using the default stats
        let seasonStats = {};
        let currentSeason = null;
        
        if (regularSeasons && regularSeasons.length > 0) {
          // Find the current season data
          currentSeason = regularSeasons.find(s => s.season === season) || regularSeasons[0];
          
          // Calculate per-game stats from the season totals
          if (currentSeason.totals && currentSeason.totals.games > 0) {
            seasonStats = {
              points: (currentSeason.totals.points / currentSeason.totals.games).toFixed(1),
              rebounds: (currentSeason.totals.totalRb / currentSeason.totals.games).toFixed(1),
              assists: (currentSeason.totals.assists / currentSeason.totals.games).toFixed(1),
              blocks: (currentSeason.totals.blocks / currentSeason.totals.games).toFixed(1),
              steals: (currentSeason.totals.steals / currentSeason.totals.games).toFixed(1)
            };
          }
        }
        
        return {
          ...playerDetails,
          // Use the season-specific stats we calculated above
          age: currentSeason?.age || playerDetails.age,
          points: parseFloat(seasonStats.points || player.stats?.sportStats?.points || 0),
          assists: parseFloat(seasonStats.assists || player.stats?.sportStats?.assists || 0),
          rebounds: parseFloat(seasonStats.rebounds || player.stats?.sportStats?.rebounds || 0),
          blocks: parseFloat(seasonStats.blocks || player.stats?.sportStats?.blocks || 0),
          steals: parseFloat(seasonStats.steals || player.stats?.sportStats?.steals || 0),
          stats: {
            ...(playerDetails.stats || {}),
            gamesPlayed: currentSeason?.totals?.games || playerDetails.stats?.gamesPlayed || 0,
            sportStats: {
              // Add optional chaining to prevent errors if seasonStats is undefined
              points: seasonStats?.points || playerDetails.stats?.sportStats?.points || "0",
              assists: seasonStats?.assists || playerDetails.stats?.sportStats?.assists || "0",
              rebounds: seasonStats?.rebounds || playerDetails.stats?.sportStats?.rebounds || "0",
              blocks: seasonStats?.blocks || playerDetails.stats?.sportStats?.blocks || "0",
              steals: seasonStats?.steals || playerDetails.stats?.sportStats?.steals || "0"
            }
          }
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
 * Fetches detailed NBA statistics for a player
 * @param {string} playerId - Player ID (without nba_ prefix)
 * @returns {Promise<Object>} Detailed player statistics
 */
export const getNbaPlayerStats = async (playerId) => {
  try {
    // Remove 'nba_' prefix if it exists
    const id = playerId.startsWith('nba_') ? playerId.substring(4) : playerId;
    const response = await axios.get(`${BACKEND_API_URL}/nba-stats/player/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching NBA player stats:', error);
    return null;
  }
};

/**
 * Fetches visualization data for efficiency-usage scatter plot
 * 
 * This function retrieves processed data for the NBA player visualization:
 * - Gets filtered player data based on minimum games threshold
 * - Supports both regular season and playoff views
 * - Handles parameter validation and error states
 * 
 * The returned data powers the interactive scatter plot showing
 * True Shooting % vs Usage Rate with PER as bubble size
 * @param {number} season - Season year to visualize
 * @param {string} type - 'regular' or 'playoff'
 * @param {number} minGames - Minimum games played to be included
 * @returns {Promise<Array>} Formatted data for the scatter plot
 */
export const getEfficiencyUsageData = async (season = 2025, type = 'regular', minGames = 20) => {
  try {
    const url = `${BACKEND_API_URL}/nba-stats/visualization/efficiency-usage?season=${season}&type=${type}&minGames=${minGames}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching efficiency vs usage data:', error);
    return [];
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
 * Fetches the last update time for the sports data
 * @returns {Promise<Object|null>} Last update time object or null on error
 */
export const getLastUpdateTime = async (league = null, season = null) => {
  try {
    let endpoint = `${BACKEND_API_URL}/last-update`;
    if (league) {
      endpoint += `/${league}`;
      if (season) {
        endpoint += `/${season}`;
      }
    }
    const res = await axios.get(endpoint);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch update time:', error);
    return null;
  }
};
