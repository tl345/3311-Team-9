/**
 * UpdatePage Component
 * 
 * This component provides admin functionality to manually trigger data updates from external sports APIs.
 * It allows administrators to:
 * 1. Refresh all sports data (NBA, NFL, EPL) with one click
 * 2. View the update process status and results
 * 3. Track successful/failed updates for each sport
 * 4. See detailed timing information for the update process
 */
import { useState } from 'react';
import { updateSportsData } from '../api';

function UpdatePage() {
  // State for managing update process
  const [updating, setUpdating] = useState(false); // Update in progress flag
  const [result, setResult] = useState(null); // Stores update results
  const [error, setError] = useState(null); // Tracks errors

  /**
   * Initiates the data update process
   * Calls the backend API to refresh data from external sources
   */
  const handleUpdate = async () => {
    // Reset states at the start of the update
    setUpdating(true);
    setResult(null);
    setError(null);
    
    try {
      // Call API functino to trigger backend update
      const updateResult = await updateSportsData();
      setResult(updateResult);
    } catch (err) {
      setError(err.message || 'Failed to update data');
    } finally {
      // Always disable updating state when finished
      setUpdating(false);
    }
  };

  return (
    <div className="update-page">
      <h1>Update Sports Data</h1>
      <p>
        Use this page to manually trigger a data update from external APIs to the database.
        This process may take several minutes depending on the API rate limits.
      </p>
      
      {/* Update button - disabled during active updates */}
      <button 
        onClick={handleUpdate} 
        disabled={updating}
        className="update-button"
      >
        {updating ? 'Updating...' : 'Update Data Now'}
      </button>
      
      {/* Error message display */}
      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* Success result display */}
      {result && (
        <div className="result-container">
        <h3>Update Result</h3>
        <div className="update-summary">
          <p><strong>Update completed at:</strong> {result.formattedTimestamp}</p>
          <p><strong>Duration:</strong> {result.duration.toFixed(2)} seconds</p>
          <p><strong>Status:</strong></p>
          <ul>
            <li>NBA: {result.nba ? 'Success' : 'Failed'}</li>
            <li>NFL: {result.nfl ? 'Success' : 'Failed'}</li>
            <li>EPL: {result.epl ? 'Success' : 'Failed'}</li>
          </ul>
        </div>

        {/* Collapsible section for response data */}
        <details>
          <summary>View Full Response</summary>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </details>
        </div>
      )}
      
      {/* Component-specific styling */}
      <style>{`
        .update-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .update-button {
          background-color: #4caf50;
          color: white;
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin: 20px 0;
        }
        
        .update-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        
        .result-container {
          background-color: #e8f5e9;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          overflow-x: auto;
        }
        
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .update-summary {
        margin-bottom: 20px;
        }

        .update-summary ul {
        list-style-type: none;
        padding-left: 20px;
        }

        .update-summary li {
        margin-bottom: 8px;
        }

        details {
        margin-top: 20px;
        border-top: 1px solid #ddd;
        padding-top: 15px;
        }

        summary {
        cursor: pointer;
        color: #646cff;
        font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default UpdatePage;
