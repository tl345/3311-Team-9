/**
 * Central configuration file for sports data settings
 * Edit these values to control which seasons/leagues are updated
 */
export default {
    // NBA Configuration
    nba: {
      enabled: true,
      currentSeason: 2025,
      seasonType: 'regular', // Options: 'regular', 'playoff'
      updateEndpoints: ['players', 'teams', 'stats'],
      minGamesForStats: 5,
      // Base URL for the NBA API
      apiBaseUrl: 'http://rest.nbaapi.com/api',

      // Whether to preserve existing data when API calls fail
      preserveDataOnFailure: true,

      // Delay between API calls in milliseconds to prevent rate limiting
      apiDelay: 1000,
    },
    
    // EPL Configuration
    epl: {
      enabled: true,
      currentSeason: 2024, // 2024: 2024-2025 season
      updateEndpoints: ['standings', 'players'],
      minAppearances: 1
    },
    
    // NFL Configuration
    nfl: {
      enabled: false, // Set to false to skip NFL updates
      currentSeason: 2024
    },
    
    // Update Settings
    updateSettings: {
      logLevel: 'info', // Options: 'debug', 'info', 'warn', 'error'
      apiDelayMs: 1500, // Delay between API calls to avoid rate limiting
      cleanupOrphanedRecords: false // Whether to remove records no longer in source API
    }
  };