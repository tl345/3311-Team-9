/**
 * Script for updating sports data from the terminal
 * 
 * Usage:
 *   node scripts/updateData.js                  - Update all enabled sports
 *   node scripts/updateData.js --nba            - Update only NBA data
 *   node scripts/updateData.js --epl            - Update only EPL data
 *   node scripts/updateData.js --nba-season=2024 - Update NBA with specific season
 *   node scripts/updateData.js --epl-season=2023 - Update EPL with specific season
 *   node scripts/updateData.js --nba-type=playoff - Update NBA playoff data
 * 
 * Example use: scripts/updateData.js --epl --epl-season=2024 (only EPL data for 2024 season)
 */
import dotenv from 'dotenv';
dotenv.config();

import { updateSportsData } from '../services/updateService.js';
import sportsConfig from '../config/sportsConfig.js';
import connectDB from '../config/db.js';

// Parse command line arguments for selective updates
const args = process.argv.slice(2);
const options = {
  nba: args.includes('--nba') || !args.some(arg => arg.startsWith('--')),
  epl: args.includes('--epl') || !args.some(arg => arg.startsWith('--')),
  nfl: args.includes('--nfl') || !args.some(arg => arg.startsWith('--')),
};

// Parse season-specific options
let nbaSeason = sportsConfig.nba.currentSeason;
let eplSeason = sportsConfig.epl.currentSeason;
let nbaType = sportsConfig.nba.seasonType;

// Extract season and type parameters from command line
args.forEach(arg => {
  if (arg.startsWith('--nba-season=')) {
    nbaSeason = parseInt(arg.split('=')[1], 10);
  }
  if (arg.startsWith('--epl-season=')) {
    eplSeason = parseInt(arg.split('=')[1], 10);
  }
  if (arg.startsWith('--nba-type=')) {
    nbaType = arg.split('=')[1];
  }
});

// Apply configuration from command line
const updateOptions = {
  nba: options.nba && sportsConfig.nba.enabled,
  epl: options.epl && sportsConfig.epl.enabled,
  nfl: options.nfl && sportsConfig.nfl.enabled,
  nbaSeason,
  eplSeason,
  nbaType,
};

console.log('Starting data update with options:', updateOptions);

// Connect to the database and run the update with parsed options
async function runUpdate() {
    try {
      console.log('Connecting to database...');
      await connectDB();
      
      console.log('Database connected. Starting update...');
      const result = await updateSportsData(updateOptions);
      
      console.log('Update completed with result:', result);
      process.exit(0);
    } catch (error) {
      console.error('Update failed:', error);
      process.exit(1);
    }
  }
  
  runUpdate();