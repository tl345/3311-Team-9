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
import { updateNFLData } from './nflService.js';
import { updateEPLData } from './eplService.js';
import SystemInfo from '../models/SystemInfo.js';

/**
 * Updates data for all sports leagues sequentially
 * 
 * This function:
 * 1. Updates NBA data first
 * 2. Then updates NFL data (currently mock data)
 * 3. Finally updates EPL data (may be limited by API rate)
 * 4. Tracks timing information for all updates
 * @returns {Promise<Object>} Update results for all leagues
 */
export const updateSportsData = async () => {
  console.log('Starting sports data update...');
  
  const startTime = new Date();
  
  console.log('Updating NBA data...');
  const nbaResult = await updateNBAData();
  
  console.log('Updating NFL data...');
  const nflResult = await updateNFLData();
  
  console.log('Updating EPL data...');
  const eplResult = await updateEPLData();
  
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
    nba: nbaResult,
    nfl: nflResult,
    epl: eplResult,
    duration: duration,
    timestamp: endTime,
    formattedTimestamp: centralTime
  };
};
