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
import config from '../config/nbaStatsConfig.js';

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
  nbaType: 'regular',
  nbaSeason: 2025
}) => {
  console.log('Starting sports data update...');
  
  const startTime = new Date();
  const results = {};
  
  // console.log('Updating NBA data...');
  // const nbaResult = await updateNBAData();
  
  // console.log('Updating NFL data...');
  // const nflResult = await updateNFLData();
  
  // console.log('Updating EPL data...');
  // const eplResult = await updateEPLData();

  // Save original config values to restore later
  const originalType = config.updateType;
  const originalSeason = config.currentSeason;
  
  // Update config with options if provided
  if (options.nbaType && ['regular', 'playoff'].includes(options.nbaType)) {
    config.updateType = options.nbaType;
  }
  
  if (options.nbaSeason) {
    config.currentSeason = options.nbaSeason;
  }
  
  // NBA data update
  if (options.nba) {
    console.log(`Updating NBA ${config.updateType} data for season ${config.currentSeason}...`);
    // Use the comprehensive NBA stats service
    results.nba = await updateNbaStats();
  }
  
  // NFL data update
  if (options.nfl) {
    console.log('Updating NFL data...');
    results.nfl = await updateNFLData();
  }
  
  // EPL data update
  if (options.epl) {
    console.log('Updating EPL data...');
    results.epl = await updateEPLData();
  }
  
  // Restore original config values
  config.updateType = originalType;
  config.currentSeason = originalSeason;
  
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
      nbaSeason: options.nbaSeason
    }
  };
};

/**
 * Updates NBA data only, using either regular season or playoff data based on parameters
 * @param {string} type - 'regular' or 'playoff'
 * @param {number} season - Season year
 * @returns {Promise<boolean>} Success status
 */
export const updateNbaDataOnly = async (type = 'regular', season = config.currentSeason) => {
  try {
    // Temporarily override the config
    const originalType = config.updateType;
    const originalSeason = config.currentSeason;
    
    config.updateType = type;
    config.currentSeason = season;
    
    console.log(`Starting NBA ${type} data update for season ${season}...`);
    const result = await updateNbaStats();
    
    // Restore original config
    config.updateType = originalType;
    config.currentSeason = originalSeason;
    
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
 * @returns {Promise<boolean>} Success status
 */
export const updateEplDataOnly = async () => {
  try {
    console.log('Starting EPL data update...');
    return await updateEPLData();
  } catch (error) {
    console.error('EPL-only update failed:', error);
    return false;
  }
};