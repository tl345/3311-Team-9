// This context provides a central place to manage and share selected seasons across all components
// Key features:
// 1. Persists selected seasons in localStorage between sessions
// 2. Uses React Context API to avoid prop drilling through component hierarchy
// 3. Provides season setters and getters for different sports leagues
// 4. Includes reset functionality to return to default seasons

import { createContext, useState, useContext, useEffect } from 'react';

// Default seasons based on configuration
const DEFAULT_SEASONS = {
  NBA: 2025,
  EPL: 2024
};

// Create context to share season data across components
const SportsContext = createContext();

export function SportsProvider({ children }) {
  // Initialize from localStorage or use defaults
  // Ensures user selection persists between sessions
  const [selectedSeasons, setSelectedSeasons] = useState(() => {
    const savedSeasons = localStorage.getItem('selectedSeasons');
    return savedSeasons ? JSON.parse(savedSeasons) : DEFAULT_SEASONS;
  });
  
  // Update localStorage when seasons change
  useEffect(() => {
    localStorage.setItem('selectedSeasons', JSON.stringify(selectedSeasons));
  }, [selectedSeasons]);
  
  // Function to update the selected season for a specific league
  // Components call this to change the global season state
  const setSeason = (league, season) => {
    setSelectedSeasons(prev => ({
      ...prev,
      [league]: season
    }));
  };
  
  // Helper to get current season for a league
  const getCurrentSeason = (league) => {
    return selectedSeasons[league] || DEFAULT_SEASONS[league];
  };
  
  // Reset all seasons to default
  const resetSeasons = () => {
    setSelectedSeasons(DEFAULT_SEASONS);
  };
  
  // Provide context value to children components
  return (
    <SportsContext.Provider value={{ 
      selectedSeasons, // Current seasons selections for all leagues
      setSeason, // Function to update a league's season
      getCurrentSeason, // Function to get a league's current season
      resetSeasons 
    }}>
      {children}
    </SportsContext.Provider>
  );
}

// Custom hook to use the sports context from any component instead of importing useContext directly
export function useSports() {
  return useContext(SportsContext);
}