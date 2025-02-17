import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerDetails } from '../api';

function PlayerPage() {
    const { id } = useParams();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerDetails = async () => {
            setLoading(true);
            try {
                const data = await getPlayerDetails(id);
                setPlayer(data);
            } catch (error) {
                console.error('Failed to fetch player details:', error);
            }
            setLoading(false);
        };

        fetchPlayerDetails();
    }, [id]);

    if (loading) return <p>Loading player details...</p>;
    if (!player) return <p>Player not found.</p>;

    return (
        <div>
            <h1>{player.name}</h1>
            <Link to="/">← Back to Home</Link>
            <ul>
                <li><strong>Nationality:</strong> {player.nationality || 'N/A'}</li>
                <li><strong>Age:</strong> {player.age || 'N/A'}</li>
                <li><strong>Date of Birth:</strong> {player.birth?.date || 'N/A'}</li>
                <li><strong>Height:</strong> {player.height || 'N/A'}</li>
                <li><strong>Weight:</strong> {player.weight || 'N/A'}</li>

                <li><strong>Appearances:</strong> {player.appearances || 'N/A'}</li>
                <li><strong>Goals:</strong> {player.goals || 0}</li>
                <li><strong>Assists:</strong> {player.assists || 0}</li>
                <li><strong>Yellow Cards:</strong> {player.yellowCards || 0}</li>
                <li><strong>Red Cards:</strong> {player.redCards || 0}</li>

                <li><strong>Key Passes:</strong> {player.keyPasses || 0}</li>
                <li><strong>Pass Accuracy:</strong> {player.passAccuracy ? `${player.passAccuracy}%` : 'N/A'}</li>
                <li><strong>Penalty Goals:</strong> {player.penaltyGoals || 0}</li>
                <li><strong>Tackles:</strong> {player.tackles || 0}</li>
                <li><strong>Goal Saves:</strong> {player.goalSaves || 0}</li>
            </ul>
        </div>
    );
}

export default PlayerPage;
