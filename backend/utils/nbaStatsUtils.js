/**
 * NBA Statistics Utility Functions
 * 
 * This module provides helper functions for processing NBA statistics:
 * - Calculating per-game averages from season totals
 * - Converting between team name formats (abbreviations, full names, IDs)
 * - Processing player statistics for visualization
 * 
 * These utilities are used throughout the NBA statistics pipeline to ensure consistent data processing and transformation
 */

/**
 * Converts statistics totals to per-game averages
 * Handles division by zero and maintains statistical accuracy
 * 
 * @param {Object} totals - Season total statistics
 * @param {number} gamesPlayed - Number of games played
 * @returns {Object} Per-game statistics
 */
export function calculatePerGameStats(totals, gamesPlayed) {
    if (!gamesPlayed || gamesPlayed === 0) {
        return {
            minutes: 0,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fg_made: 0,
            fg_att: 0,
            fg_pct: 0,
            three_made: 0,
            three_att: 0,
            three_pct: 0,
            ft_made: 0,
            ft_att: 0,
            ft_pct: 0
        };
    }

    return {
        minutes: totals.minutesPg || 0,
        points: totals.points / gamesPlayed,
        rebounds: totals.totalRb / gamesPlayed,
        assists: totals.assists / gamesPlayed,
        steals: totals.steals / gamesPlayed,
        blocks: totals.blocks / gamesPlayed,
        turnovers: totals.turnovers / gamesPlayed,
        fg_made: totals.fieldGoals / gamesPlayed,
        fg_att: totals.fieldAttempts / gamesPlayed,
        fg_pct: totals.fieldPercent,
        three_made: totals.threeFg / gamesPlayed,
        three_att: totals.threeAttempts / gamesPlayed,
        three_pct: totals.threePercent,
        ft_made: totals.ft / gamesPlayed,
        ft_att: totals.ftAttempts / gamesPlayed,
        ft_pct: totals.ftPercent
    };
}

/**
 * Standardizes team identification across different API formats
 * Supports conversion between:
 * - Abbreviations (e.g., "LAL")
 * - Full names (e.g., "Los Angeles Lakers") 
 * - Internal IDs (e.g., 14)
 * 
 * @param {string} teamName - Team name or abbreviation
 * @param {string} format - Desired output format ('full', 'abbr', 'id')
 * @returns {string|number} Converted team identifier
 */
export function convertTeamFormat(teamName, format = 'full') {
    const teamMap = {
        'ATL': { full: 'Atlanta Hawks', id: 1 },
        'BOS': { full: 'Boston Celtics', id: 2 },
        'BRK': { full: 'Brooklyn Nets', id: 3 },
        'BKN': { full: 'Brooklyn Nets', id: 3 }, // Alternative abbreviation
        'CHO': { full: 'Charlotte Hornets', id: 4 },
        'CHA': { full: 'Charlotte Hornets', id: 4 }, // Alternative abbreviation
        'CHI': { full: 'Chicago Bulls', id: 5 },
        'CLE': { full: 'Cleveland Cavaliers', id: 6 },
        'DAL': { full: 'Dallas Mavericks', id: 7 },
        'DEN': { full: 'Denver Nuggets', id: 8 },
        'DET': { full: 'Detroit Pistons', id: 9 },
        'GSW': { full: 'Golden State Warriors', id: 10 },
        'HOU': { full: 'Houston Rockets', id: 11 },
        'IND': { full: 'Indiana Pacers', id: 12 },
        'LAC': { full: 'Los Angeles Clippers', id: 13 },
        'LAL': { full: 'Los Angeles Lakers', id: 14 },
        'MEM': { full: 'Memphis Grizzlies', id: 15 },
        'MIA': { full: 'Miami Heat', id: 16 },
        'MIL': { full: 'Milwaukee Bucks', id: 17 },
        'MIN': { full: 'Minnesota Timberwolves', id: 18 },
        'NOP': { full: 'New Orleans Pelicans', id: 19 },
        'NYK': { full: 'New York Knicks', id: 20 },
        'OKC': { full: 'Oklahoma City Thunder', id: 21 },
        'ORL': { full: 'Orlando Magic', id: 22 },
        'PHI': { full: 'Philadelphia 76ers', id: 23 },
        'PHO': { full: 'Phoenix Suns', id: 24 },
        'PHX': { full: 'Phoenix Suns', id: 24 }, // Alternative abbreviation
        'POR': { full: 'Portland Trail Blazers', id: 25 },
        'SAC': { full: 'Sacramento Kings', id: 26 },
        'SAS': { full: 'San Antonio Spurs', id: 27 },
        'TOR': { full: 'Toronto Raptors', id: 28 },
        'UTA': { full: 'Utah Jazz', id: 29 },
        'WAS': { full: 'Washington Wizards', id: 30 }
    };
    
    // Handle abbreviations
    if (teamName && teamName.length <= 3) {
        const team = teamMap[teamName.toUpperCase()];
        if (team) {
            if (format === 'full') return team.full;
            if (format === 'id') return team.id;
            return teamName.toUpperCase();
        }
    }
    
    // Handle full names by searching
    for (const [abbr, team] of Object.entries(teamMap)) {
        if (team.full.toLowerCase() === teamName.toLowerCase()) {
            if (format === 'abbr') return abbr;
            if (format === 'id') return team.id;
            return team.full;
        }
    }
    
    // If no match found, return the original
    return teamName;
}

export default {
    calculatePerGameStats,
    convertTeamFormat
};