import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerDetails } from '../api'; // You will create this in the next step

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
                <li><strong>Height:</strong> {player.height || 'N/A'}</li>
                <li><strong>Weight:</strong> {player.weight || 'N/A'}</li>
                <li><strong>Date of Birth:</strong> {player.birth?.date || 'N/A'}</li>
                <li><strong>Nationality:</strong> {player.nationality || 'N/A'}</li>
                <li><strong>Age:</strong> {player.age || 'N/A'}</li>
                <li><strong>Yellow Cards:</strong> {player.yellowCards}</li>
                <li><strong>Red Cards:</strong> {player.redCards}</li>
                <li><strong>Assists:</strong> {player.assists}</li>
                <li><strong>Past Clubs:</strong> {player.pastClubs?.join(', ') || 'N/A'}</li>
            </ul>
        </div>
    );
}

export default PlayerPage;
