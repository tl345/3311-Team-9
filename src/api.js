import axios from 'axios';

// API KEYS
const NFL_API_KEY = 'c0c8578d-1eeb-4976-978d-e25218';
const EPL_API_KEY = '74272b2cd0fc37666fcd516c9990a5c6';

// ---------------- NBA (BallDontLie API) ---------------- //
export const getNbaPlayers = async () => {
    try {
        const res = await axios.get('https://www.balldontlie.io/api/v1/players', {
            params: { page: 1, per_page: 5 },
        });

        return res.data.data.map((player) => ({
            id: player.id,
            name: `${player.first_name} ${player.last_name}`,
            team: player.team.full_name,
            points: 'N/A',
        }));
    } catch (error) {
        console.error('NBA Players Error (BallDontLie):', error);
        return [];
    }
};

export const getNbaTeams = async () => {
    try {
        const res = await axios.get('https://api-basketball.p.rapidapi.com/teams', {
            headers: {
                'x-apisports-key': EPL_API_KEY,
                'x-apisports-host': 'api-basketball.p.rapidapi.com',
            },
            params: { league: 12, season: '2023-2024' }, // NBA League ID is 12
        });

        return res.data.response.map((team) => ({
            id: team.id,
            name: team.name,
            logo: team.logo,
        }));
    } catch (error) {
        console.error('NBA Teams Error (API-Basketball):', error);
        return [];
    }
};


// ---------------- NFL (MySportsFeeds) ---------------- //
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


// ---------------- EPL (API-FOOTBALL) ---------------- //
export const getEplPlayers = async () => {
    try {
        const res = await axios.get('https://v3.football.api-sports.io/players/topscorers', {
            headers: { 'x-apisports-key': EPL_API_KEY },
            params: { league: 39, season: 2023 },
        });

        return res.data.response.slice(0, 5).map((playerData) => ({
            name: playerData.player.name,
            team: playerData.statistics[0].team.name,
            goals: playerData.statistics[0].goals.total,
        }));
    } catch (error) {
        console.error('EPL Players Error:', error);
        return [];
    }
};

export const getEplTeams = async () => {
    try {
        const res = await axios.get('https://v3.football.api-sports.io/standings', {
            headers: { 'x-apisports-key': EPL_API_KEY },
            params: { league: 39, season: 2023 },
        });

        return res.data.response[0].league.standings[0].map((team) => ({
            id: team.team.id,
            name: `${team.rank}. ${team.team.name}`, // Show Rank
            logo: team.team.logo,
        }));
    } catch (error) {
        console.error('EPL Standings Error:', error);
        return [];
    }
};
