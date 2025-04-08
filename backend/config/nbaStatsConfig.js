/**
 * NBA Statistics Configuration
 * 
 * This configuration centralizes all settings related to NBA data updates:
 * - Season year to use for data fetching
 * - Type of data to update (regular season vs. playoffs)
 * - API endpoint configuration
 * - Rate limiting and error handling preferences
 * 
 * Using a central configuration makes it easy to switch between different seasons or update modes without changing service code
 */
export default {
    // Current season to fetch by default
    currentSeason: 2025,
    
    // Type of data to update by default ('regular' or 'playoff')
    updateType: 'regular',
    
    // Base URL for the NBA API
    apiBaseUrl: 'http://rest.nbaapi.com/api',
    
    // Whether to preserve existing data when API calls fail
    preserveDataOnFailure: true,
    
    // Delay between API calls in milliseconds to prevent rate limiting
    apiDelay: 1000,
    
    // Logging settings
    logging: {
      enabled: true,
      level: 'info' // 'debug', 'info', 'warn', 'error'
    }
  };