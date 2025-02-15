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
export const getNbaPlayersByTeam = async (teamName) => {
    try {
        const res = await axios.get('https://www.balldontlie.io/api/v1/players', {
            params: { search: teamName },
        });

        return res.data.data.map((player) => ({
            id: player.id,
            name: `${player.first_name} ${player.last_name}`,
            position: player.position || 'N/A',
            number: 'N/A', // BallDontLie doesn't provide jersey numbers
        }));
    } catch (error) {
        console.error(`NBA Team Players Error (${teamName}):`, error);
        return [];
    }
};
export const getEplPlayersByTeam = async (teamName) => {
    try {
        const eplTeams = await getEplTeams();
        const team = eplTeams.find((t) => t.name.toLowerCase().includes(teamName.toLowerCase()));


        if (!team) {
            console.error(`Team ${teamName} not found in EPL Teams`);
            return [];
        }

        let allPlayers = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
            const res = await axios.get('https://v3.football.api-sports.io/players', {
                headers: { 'x-apisports-key': EPL_API_KEY },
                params: { team: team.id, season: 2023, page },
            });

            const playersOnPage = res.data.response.map((playerData) => ({
                id: playerData.player.id,
                name: playerData.player.name,
                position: playerData.statistics[0].games.position || 'N/A',
                number: playerData.statistics[0].games.number || 'N/A',
                goals: playerData.statistics[0].goals.total || 0,
                appearances: playerData.statistics[0].games.appearances || 0,
            }));

            allPlayers = [...allPlayers, ...playersOnPage];
            totalPages = res.data.paging.total;
            page++;
        }

        // REMOVE DUPLICATES BASED ON PLAYER ID
        const uniquePlayersMap = new Map();
        allPlayers.forEach((player) => {
            if (!uniquePlayersMap.has(player.id)) {
                uniquePlayersMap.set(player.id, player);
            }
        });

        const uniquePlayers = Array.from(uniquePlayersMap.values());

        // Optional: Sort players by appearances (descending)
        return uniquePlayers.sort((a, b) => b.appearances - a.appearances);
    } catch (error) {
        console.error(`EPL Team Players Error (${teamName}):`, error);
        return [];
    }
};
export const getPlayerDetails = async (playerId) => {
    try {
        const res = await axios.get('https://v3.football.api-sports.io/players', {
            headers: { 'x-apisports-key': EPL_API_KEY },
            params: { id: playerId, season: 2023 },
        });

        const playerData = res.data.response[0].player;
        const stats = res.data.response[0].statistics[0]; // Assuming the first competition is EPL

        return {
            id: playerData.id,
            name: playerData.name,
            height: playerData.height,
            weight: playerData.weight,
            birth: playerData.birth,
            nationality: playerData.nationality,
            age: playerData.age,
            yellowCards: stats.cards.yellow || 0,
            redCards: stats.cards.red || 0,
            assists: stats.goals.assists || 0,
            pastClubs: [], // Not available in this API, you'd need another source if you want past clubs
        };
    } catch (error) {
        console.error(`Player Details Error (ID: ${playerId}):`, error);
        return null;
    }
};
