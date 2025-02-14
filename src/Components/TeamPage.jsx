import { useParams } from 'react-router-dom';

function TeamPage() {
    const { sport, teamName } = useParams();

    return (
        <div>
            <h1>{teamName} - {sport}</h1>
            <p>Players will be displayed here in the future.</p>
        </div>
    );
}

export default TeamPage;
