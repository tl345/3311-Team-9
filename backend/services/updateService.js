/**
 * Update Service
 * 
 * This service orchestrates data updates for all sports leagues
 * It provides a single entry point to refresh data for all leagues or individual leagues as needed
 * 
 * The service is used when users click "Update Data" in the frontend
 * 
 * It tracks timing information and returns status for all updates.
 */
import { updateNBAData } from './nbaService.js';
import { updateNbaStats } from './nbaStatsService.js';
import { updateNFLData } from './nflService.js';
import { updateEPLData } from './eplService.js';
import SystemInfo from '../models/SystemInfo.js';
import sportsConfig from '../config/sportsConfig.js';

/**
 * Logs the status of an update operation with season information
 * @param {string} operation - Name of the operation (e.g., 'NBA', 'EPL')
 * @param {boolean} success - Whether the operation succeeded
 * @param {Date} startTime - When the operation started
 * @param {number} season - Season year that was updated
 */
async function logSeasonUpdate(operation, success, startTime, season) {
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log(`${operation} season ${season} update ${success ? 'completed successfully' : 'failed'} in ${duration.toFixed(2)} seconds`);
  
  try {
    // Create a general update record
    await SystemInfo.findOneAndUpdate(
      { key: `lastUpdate_${operation.replace(/\s+/g, '')}` },
      {
        value: {
          success,
          timestamp: endTime,
          formattedTimestamp: endTime.toLocaleString(),
          duration: duration.toFixed(2),
          season
        }
      },
      { upsert: true }
    );
    
    // Create a season-specific record
    await SystemInfo.findOneAndUpdate(
      { key: `lastUpdate_${operation.replace(/\s+/g, '')}_${season}` },
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
 * Updates data for all sports leagues based on provided options
 * Supports selective updates and configuration
 * 
 * @param {Object} options - Which sports to update
 * @param {boolean} options.nba - Whether to update NBA data
 * @param {boolean} options.nfl - Whether to update NFL data
 * @param {boolean} options.epl - Whether to update EPL data
 * @param {string} options.nbaType - 'regular' or 'playoff' 
 * @param {number} options.nbaSeason - Season year to update
 * @returns {Promise<Object>} Update results for all leagues
 */
export const updateSportsData = async (options = {
  nba: true,
  nfl: true,
  epl: true,
  nbaType: sportsConfig.nba.seasonType,
  nbaSeason: sportsConfig.nba.currentSeason,
  eplSeason: sportsConfig.epl.currentSeason
}) => {
  console.log('Starting sports data update...');
  
  const startTime = new Date();
  const results = {};
  
  // NBA data update
  if (options.nba) {
    const nbaStartTime = new Date();
    console.log(`Updating NBA ${options.nbaType} data for season ${options.nbaSeason}...`);
    // Use the comprehensive NBA stats service
    results.nba = await updateNbaStats(options.nbaType, options.nbaSeason);
    // Log NBA-specific update with season
    await logSeasonUpdate('NBA', results.nba, nbaStartTime, options.nbaSeason);
  }
  
  // NFL data update
  if (options.nfl) {
    console.log('Updating NFL data...');
    results.nfl = await updateNFLData();
  }
  
  // EPL data update
  if (options.epl) {
    const eplStartTime = new Date();
    console.log(`Updating EPL data for season ${options.eplSeason}...` );
    results.epl = await updateEPLData(options.eplSeason);
    // Log EPL-specific update with season
    await logSeasonUpdate('EPL', results.epl, eplStartTime, options.eplSeason);
  }
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds

  // Fomats date in US Central time
  const centralTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  }).format(endTime);
  
  console.log(`Update completed in ${duration} seconds.`);

  // Store the last update time in the database for persistence
  await SystemInfo.findOneAndUpdate(
    { key: 'lastUpdateTime' },  // Find by this key
    { 
      value: {
        timestamp: endTime,
        formattedTimestamp: centralTime
      }
    },
    { upsert: true, new: true }  // Create if doesn't exist
  );

  return {
    ...results,
    duration: duration,
    timestamp: endTime,
    formattedTimestamp: centralTime,
    options: {
      nba: options.nba,
      nfl: options.nfl,
      epl: options.epl,
      nbaType: options.nbaType,
      nbaSeason: options.nbaSeason,
      eplSeason: options.eplSeason
    }
  };
};

/**
 * Updates NBA data only, using either regular season or playoff data based on parameters
 * @param {string} type - 'regular' or 'playoff'
 * @param {number} season - Season year
 * @returns {Promise<boolean>} Success status
 */
export const updateNbaDataOnly = async (type = sportsConfig.nba.seasonType, season = sportsConfig.nba.currentSeason) => {
  try {    
    const startTime = new Date();
    console.log(`Starting NBA ${type} data update for season ${season}...`);
    const result = await updateNbaStats(type, season);

    // Log the season-specific update
    await logSeasonUpdate('NBA', result, startTime, season);
    
    return result;
  } catch (error) {
    console.error('NBA-only update failed:', error);
    return false;
  }
};

/**
 * Updates NFL data only
 * @returns {Promise<boolean>} Success status
 */
export const updateNflDataOnly = async () => {
  try {
    console.log('Starting NFL data update...');
    return await updateNFLData();
  } catch (error) {
    console.error('NFL-only update failed:', error);
    return false;
  }
};

/**
 * Updates EPL data only
 * @param {number} season - Season to update
 * @returns {Promise<boolean>} Success status
 */
export const updateEplDataOnly = async (season) => {
  try {
    const startTime = new Date();
    console.log(`Starting EPL data update for season ${season || 'current'}...`);
    const result = await updateEPLData(season);

    // Log the season-specific update
    await logSeasonUpdate('EPL', result, startTime, season);

    return result;
  } catch (error) {
    console.error('EPL-only update failed:', error);
    return false;
  }
};