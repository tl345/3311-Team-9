/**
 * NBA Statistics Service
 * 
 * This service is responsible for fetching comprehensive NBA player statistics from external APIs and storing them in a structured format in MongoDB
 * 
 * Key features:
 * - Fetches bulk season data for both regular season and playoffs
 * - Handles traded players and identifies current teams
 * - Maintains separate data stores for regular season and playoff statistics
 * - Updates summary statistics in the Player model while storing details in NbaPlayerStats
 * - Supports visualization data generation for efficiency-usage charts
 * 
 * The service implements two primary API calls:
 * 1. PlayerDataTotals - Basic counting stats (points, rebounds, etc.)
 * 2. PlayerDataAdvanced - Advanced metrics (PER, TS%, Usage Rate, etc.)
 */
import axios from 'axios';
import NbaPlayerStats from '../models/NBAPlayerStats.js';
import Player from '../models/Player.js';
import SystemInfo from '../models/SystemInfo.js';
import sportsConfig from '../config/sportsConfig.js';
import { convertTeamFormat } from '../utils/nbaStatsUtils.js';

/**
 * Main function to update all NBA statistics
 * Determines whether to fetch regular season or playoff data based on configuration
 * @returns {Promise<boolean>} Success status of the operation
 */
export async function updateNbaStats(type = sportsConfig.nba.seasonType, season = sportsConfig.nba.currentSeason) {
    try {
        console.log(`Starting NBA ${type} statistics update for season ${season}...`);
        
        // Record start time for performance logging
        const startTime = new Date();
        
        // Determine which endpoints to use based on configuration
        if (type === 'regular') {
            // Update regular season data
            const totalsSuccess = await fetchAndProcessTotals(false, season);
            const advancedSuccess = await fetchAndProcessAdvanced(false, season);
            
            // Log and return overall success
            const success = totalsSuccess && advancedSuccess;
            logUpdateStatus('NBA Regular Season', success, startTime);
            return success;
        } 
        else if (type === 'playoff') {
            // Update playoff data
            const totalsSuccess = await fetchAndProcessTotals(true, season);
            const advancedSuccess = await fetchAndProcessAdvanced(true, season);
            
            // Log and return overall success
            const success = totalsSuccess && advancedSuccess;
            logUpdateStatus('NBA Playoffs', success, startTime);
            return success;
        }
        else {
            console.error(`Invalid update type: ${type}`);
            return false;
        }
    } 
    catch (error) {
        console.error('NBA statistics update failed:', error);
        return false;
    }
}

/**
 * Fetches and processes player totals statistics
 * @param {boolean} isPlayoffs - Whether to fetch playoff data (true) or regular season data (false)
 * @param {number} season - The season year to fetch
 * @returns {Promise<boolean>} Success status
 */
async function fetchAndProcessTotals(isPlayoffs, season) { // First API call
    // Determine the endpoint based on whether we're fetching regular season or playoff data
    const endpoint = isPlayoffs 
        ? `${sportsConfig.nba.apiBaseUrl}/PlayerDataTotalsPlayoffs/season/${season}`
        : `${sportsConfig.nba.apiBaseUrl}/PlayerDataTotals/season/${season}`;
    
    try {
        console.log(`Fetching ${isPlayoffs ? 'playoff' : 'regular season'} totals for ${season}...`);
        
        // Make API call to fetch bulk player data
        const response = await axios.get(endpoint);
        
        // Early validation of the response
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Invalid API response format for totals data');
            return false;
        }
        
        //console.log(`Received ${response.data.length} player season totals records`);
        
        // Process the data - this includes handling traded players and stat consolidation
        await processBulkPlayerData(response.data, isPlayoffs, 'totals');
        
        return true;
    }
    catch (error) {
        console.error(`Error fetching ${isPlayoffs ? 'playoff' : 'regular season'} totals:`, error.message);
        if (error.response) {
            console.error(`Status code: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

/**
 * Fetches and processes player advanced statistics
 * @param {boolean} isPlayoffs - Whether to fetch playoff data (true) or regular season data (false)
 * @param {number} season - Season year to fetch
 * @returns {Promise<boolean>} Success status
 */
async function fetchAndProcessAdvanced(isPlayoffs, season) { // Second API call
    // Determine the endpoint based on whether we're fetching regular season or playoff data
    const endpoint = isPlayoffs 
        ? `${sportsConfig.nba.apiBaseUrl}/PlayerDataAdvancedPlayoffs/season/${season}`
        : `${sportsConfig.nba.apiBaseUrl}/PlayerDataAdvanced/season/${season}`;
    
    try {
        console.log(`Fetching ${isPlayoffs ? 'playoff' : 'regular season'} advanced stats for ${season}...`);
        
        // Make API call to fetch bulk player data
        const response = await axios.get(endpoint);
        
        // Early validation of the response
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Invalid API response format for advanced data');
            return false;
        }
        
        console.log(`Received ${response.data.length} player advanced stats records`);
        
        // Process the data - this includes handling traded players and stat consolidation
        await processBulkPlayerData(response.data, isPlayoffs, 'advanced');
        
        return true;
    }
    catch (error) {
        console.error(`Error fetching ${isPlayoffs ? 'playoff' : 'regular season'} advanced stats:`, error.message);
        if (error.response) {
            console.error(`Status code: ${error.response.status}`);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

/**
 * Processes bulk player data from the API
 * This is the core function that handles:
 * 1. Grouping players by their playerId - This creates a dictionary where:
 *    - Each key is a player ID (like "jamesle01")
 *    - Each value is an array of stat records for that player (one per team if traded)
 * 2. Selecting the appropriate aggregated stats ("2TM", "3TM" etc)
 * 3. Determining the current team from the entry with highest ID
 * 4. Updating the database with combined data
 * 
 * @param {Array} playerData - Array of player statistics from the API
 * @param {boolean} isPlayoffs - Whether this is playoff data
 * @param {string} dataType - The type of data ('totals' or 'advanced')
 */
async function processBulkPlayerData(playerData, isPlayoffs, dataType) { // Data organization/normalization occurs
    try {
        // Step 1: Group players by their playerId
        // This helps identify players who were traded (multiple entries with same playerId)
        const playerGroups = {};
        
        for (const record of playerData) {
            if (!record.playerId) {
                console.warn('Found record without playerId, skipping:', record.playerName);
                continue;
            }
            
            // Create an array for this player if it doesn't exist yet
            if (!playerGroups[record.playerId]) {
                playerGroups[record.playerId] = [];
            }
            
            // Add this record to the player's array
            playerGroups[record.playerId].push(record);
        }
        
        console.log(`Processing ${Object.keys(playerGroups).length} unique players`);
        
        // Step 2: Process each player's data
        for (const playerId in playerGroups) {
            await processPlayerGroup(playerGroups[playerId], isPlayoffs, dataType);
        }
    }
    catch (error) {
        console.error('Error processing bulk player data:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

/**
 * Process a group of records for a single player
 * Handles trade scenarios by:
 * 1. Looking for aggregate stats (2TM, 3TM) as the source of truth
 * 2. Finding the player's current team based on most recent record
 * 3. Using the best available stats with the correct team assignment
 * 
 * @param {Array} playerRecords - All records for a single player
 * @param {boolean} isPlayoffs - Whether this is playoff data
 * @param {string} dataType - Type of data ('totals' or 'advanced')
 */
async function processPlayerGroup(playerRecords, isPlayoffs, dataType) {
    if (!playerRecords || playerRecords.length === 0) return;
    
    try {
        // First, get the player's name from the first record
        const playerName = playerRecords[0].playerName;
        const playerId = playerRecords[0].playerId;
        const season = playerRecords[0].season;
        
        // Check if we need to handle a traded player scenario (more than one record)
        let statsRecord = null;
        let finalTeam = null;
        
        if (playerRecords.length > 1) {
            //console.log(`Player ${playerName} has ${playerRecords.length} records - likely traded`);
            
            // Step 1: Look for aggregated stats record (e.g., "2TM", "3TM")
            const aggregatedRecord = playerRecords.find(record => 
                record.team && record.team.includes('TM')
            );
            
            if (aggregatedRecord) {
                //console.log(`Found aggregated "${aggregatedRecord.team}" record for ${playerName}`);
                statsRecord = aggregatedRecord;
            } else {
                // If no aggregated record, use the record with the most games as stats source
                statsRecord = playerRecords.reduce((prev, current) => 
                    (prev.games > current.games) ? prev : current
                ); // Might change the else
            }
            
            // Step 2: Find the player's current team (highest ID value)
            const teamRecords = playerRecords.filter(record => 
                !record.team.includes('TM') // Exclude aggregated records
            );
            
            if (teamRecords.length > 0) {
                // Sort by ID descending to get the most recent team entry
                teamRecords.sort((a, b) => b.id - a.id);
                finalTeam = teamRecords[0].team;
                //console.log(`Final team for ${playerName} is ${finalTeam} (ID: ${teamRecords[0].id})`);
            }
        } else {
            // Only one record - simple case
            statsRecord = playerRecords[0];
            finalTeam = playerRecords[0].team;
        }
        
        if (!statsRecord) {
            console.warn(`No valid stats record found for ${playerName}, skipping`);
            return;
        }
        
        // Now, update or create the player's stats document
        await updatePlayerStats(
            playerId, 
            playerName,
            finalTeam, 
            statsRecord, 
            isPlayoffs, 
            dataType
        );
    }
    catch (error) {
        console.error(`Error processing player group for ${playerRecords[0]?.playerName || 'unknown player'}:`, error);
        // Continue processing other players - don't throw
    }
}

/**
 * Updates a player's stats in the database
 * Creates the player if they don't exist
 * 
 * @param {string} playerId - Player's unique ID
 * @param {string} playerName - Player's name
 * @param {string} team - Player's current team
 * @param {Object} statsRecord - The statistics record to use
 * @param {boolean} isPlayoffs - Whether this is playoff data
 * @param {string} dataType - Type of data ('totals' or 'advanced')
 */
async function updatePlayerStats(playerId, playerName, team, statsRecord, isPlayoffs, dataType) {
    try {
        // First, find or create the player's stats document
        let playerStats = await NbaPlayerStats.findOne({ playerId });
        
        if (!playerStats) {
            //console.log(`Creating new stats record for ${playerName} (${playerId})`);
            playerStats = new NbaPlayerStats({
                playerId,
                name: playerName,
                regularSeasons: [],
                playoffs: []
            });
        }
        
        // Determine which array to update (regularSeasons or playoffs)
        const seasonsArray = isPlayoffs ? 'playoffs' : 'regularSeasons';
        
        // Find the specific season within the array
        let seasonStats = playerStats[seasonsArray].find(s => s.season === statsRecord.season);
        
        if (!seasonStats) {
            //console.log(`Adding new ${isPlayoffs ? 'playoff' : 'regular season'} entry for ${playerName}, season ${statsRecord.season}`);
            
            // Create a new season stats object
            seasonStats = {
                season: statsRecord.season,
                team: team,
                position: statsRecord.position,
                age: statsRecord.age,
                totals: {},
                advanced: {},
                lastUpdated: new Date()
            };
            
            // Add it to the appropriate array
            playerStats[seasonsArray].push(seasonStats);
        } else {
            //console.log(`Updating existing ${isPlayoffs ? 'playoff' : 'regular season'} stats for ${playerName}, season ${statsRecord.season}`);
            
            // Update team and position in case they've changed
            seasonStats.team = team;
            seasonStats.position = statsRecord.position;
            seasonStats.age = statsRecord.age;
            seasonStats.lastUpdated = new Date();
        }
        
        // Update the specific data type (totals or advanced)
        if (dataType === 'totals') {
            // Map totals data fields
            seasonStats.totals = {
                games: statsRecord.games,
                gamesStarted: statsRecord.gamesStarted,
                minutesPg: statsRecord.minutesPg,
                fieldGoals: statsRecord.fieldGoals,
                fieldAttempts: statsRecord.fieldAttempts,
                fieldPercent: statsRecord.fieldPercent,
                threeFg: statsRecord.threeFg,
                threeAttempts: statsRecord.threeAttempts,
                threePercent: statsRecord.threePercent,
                twoFg: statsRecord.twoFg,
                twoAttempts: statsRecord.twoAttempts,
                twoPercent: statsRecord.twoPercent,
                effectFgPercent: statsRecord.effectFgPercent,
                ft: statsRecord.ft,
                ftAttempts: statsRecord.ftAttempts,
                ftPercent: statsRecord.ftPercent,
                offensiveRb: statsRecord.offensiveRb,
                defensiveRb: statsRecord.defensiveRb,
                totalRb: statsRecord.totalRb,
                assists: statsRecord.assists,
                steals: statsRecord.steals,
                blocks: statsRecord.blocks,
                turnovers: statsRecord.turnovers,
                personalFouls: statsRecord.personalFouls,
                points: statsRecord.points
            };
        } 
        else if (dataType === 'advanced') {
            // Map advanced data fields
            seasonStats.advanced = {
                games: statsRecord.games,
                minutesPlayed: statsRecord.minutesPlayed,
                per: statsRecord.per,
                tsPercent: statsRecord.tsPercent,
                threePAR: statsRecord.threePAR,
                ftr: statsRecord.ftr,
                offensiveRBPercent: statsRecord.offensiveRBPercent,
                defensiveRBPercent: statsRecord.defensiveRBPercent,
                totalRBPercent: statsRecord.totalRBPercent,
                assistPercent: statsRecord.assistPercent,
                stealPercent: statsRecord.stealPercent,
                blockPercent: statsRecord.blockPercent,
                turnoverPercent: statsRecord.turnoverPercent,
                usagePercent: statsRecord.usagePercent,
                offensiveWS: statsRecord.offensiveWS,
                defensiveWS: statsRecord.defensiveWS,
                winShares: statsRecord.winShares,
                winSharesPer: statsRecord.winSharesPer,
                offensiveBox: statsRecord.offensiveBox,
                defensiveBox: statsRecord.defensiveBox,
                box: statsRecord.box,
                vorp: statsRecord.vorp
            };
        }
        
        // Update the player's overall lastUpdated timestamp
        playerStats.lastUpdated = new Date();

        // console.log('Before saving ${playerName} ${dataType} stats:',
        //     dataType === 'totals' ? JSON.stringify(seasonStats.totals) : "Advanced stats");

        // Fixes Mongoose issue where nested objects aren't detected as modified
        if (dataType === 'totals') {
            playerStats.markModified(`${seasonsArray}.${playerStats[seasonsArray].indexOf(seasonStats)}.totals`);
        } else if (dataType === 'advanced') {
            playerStats.markModified(`${seasonsArray}.${playerStats[seasonsArray].indexOf(seasonStats)}.advanced`);
        }
        
        // Save the updated document
        await playerStats.save();
        
        // Verify save worked
        // console.log(`After saving ${playerName}, checking totals:`, 
        // Boolean(playerStats[seasonsArray].find(s => s.season === statsRecord.season)?.totals?.games));

        // Also update the Player model with a reference to the NbaPlayerStats
        if (dataType === 'totals' && !isPlayoffs) {
            await updatePlayerReference(playerId, playerName, team, statsRecord);
        }
    }
    catch (error) {
        console.error(`Error updating stats for player ${playerName}:`, error);
        throw error;
    }
}

/**
 * Maintains data consistency between NbaPlayerStats and Player models
 * Creates the reference link and summary stats in the Player model
 * This function enables the Player model to show accurate stats while the detailed data remains in the NbaPlayerStats collection
 * 
 * @param {string} playerId - Player's unique ID
 * @param {string} playerName - Player's name
 * @param {string} team - Player's team
 * @param {Object} statsRecord - Stats data
 */
async function updatePlayerReference(playerId, playerName, team, statsRecord) {
    try {
        // Find team ID based on abbreviation
        const teamId = convertTeamFormat(team, 'id');
        
        // Calculate per-game stats for Player schema summary
        const ppg = statsRecord.points / statsRecord.games;
        const rpg = statsRecord.totalRb / statsRecord.games;
        const apg = statsRecord.assists / statsRecord.games;
        const bpg = statsRecord.blocks / statsRecord.games;
        const spg = statsRecord.steals / statsRecord.games;
        
        // Create a Map for sportStats (NBA specific stats)
        const sportStats = new Map();
        sportStats.set('points', statsRecord.points);
        sportStats.set('rebounds', statsRecord.totalRb);
        sportStats.set('assists', statsRecord.assists);
        sportStats.set('blocks', statsRecord.blocks);
        sportStats.set('steals', statsRecord.steals);
        
        // Update or create the Player record with reference AND summary stats
        await Player.findOneAndUpdate(
            { playerId: `nba_${playerId}` },
            {
                teamId: `nba_${teamId}`,
                league: 'NBA',
                name: playerName,
                position: statsRecord.position,
                age: statsRecord.age,
                nbaStatsRef: playerId,  // Reference to NbaPlayerStats
                stats: {
                    gamesPlayed: statsRecord.games,
                    gamesStarted: statsRecord.gamesStarted,
                    sportStats: sportStats
                },
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );
    }
    catch (error) {
        console.error(`Error updating Player reference for ${playerName}:`, error);
    }
}

/**
 * Logs the status of an update operation
 * @param {string} operation - Name of the operation
 * @param {boolean} success - Whether the operation succeeded
 * @param {Date} startTime - When the operation started
 */
function logUpdateStatus(operation, success, startTime) {
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    if (success) {
        console.log(`${operation} update completed successfully in ${duration.toFixed(2)} seconds`);
    } else {
        console.error(`${operation} update failed after ${duration.toFixed(2)} seconds`);
    }
    
    // Update status in database for UI display
    SystemInfo.findOneAndUpdate(
        { key: `lastUpdate_${operation.replace(/\s+/g, '')}` },
        { 
            value: {
                success,
                timestamp: endTime,
                formattedTimestamp: endTime.toLocaleString(),
                duration: duration.toFixed(2)
            }
        },
        { upsert: true, new: true }
    ).catch(err => console.error(`Error updating system info:`, err));
}

export default {
    updateNbaStats
};