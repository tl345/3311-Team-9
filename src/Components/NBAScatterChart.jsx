import { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { getEfficiencyUsageData } from '../api';
import './NBAScatterChart.css';

/**
 * NBA Efficiency vs Usage Scatter Plot Component
 * 
 * Displays NBA players on a scatter plot where:
 * - X-axis: Usage Percentage (how often a player uses possessions)
 * - Y-axis: True Shooting Percentage (shooting efficiency)
 * - Bubble size: PER (Player Efficiency Rating)
 * - Color coding: Player position
 *
 * This visualization helps identify players who are both efficient and
 * high-usage (stars), efficient but low-usage (role players), or
 * inefficient but high-usage (volume shooters).
 * 
 * Features:
 * - Responsive design that works in both standalone and embedded modes
 * - Interactive tooltips showing detailed player metrics
 * - Highlighting of selected player for comparison
 * - Reference lines showing league averages
 * - Compact mode for embedding in player profiles
 * - Explanatory text to help interpret the visualization
 */
const NBAScatterChart = ({ season = 2025, type = 'regular', minGames = 20, playerId = null, compact = false }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    // Add state for position visibility
    const [visiblePositions, setVisiblePositions] = useState({
      'PG': true,
      'SG': true,
      'SF': true,
      'PF': true,
      'C': true
    });
    
    // Position-based color scheme
    const positionColors = {
      'PG': '#1f77b4', // Blue
      'SG': '#ff7f0e', // Orange
      'SF': '#2ca02c', // Green
      'PF': '#d62728', // Red
      'C': '#9467bd',  // Purple
      'default': '#17becf' // Light blue
    };

    // Toggle position visibility
    const togglePosition = (position) => {
      setVisiblePositions(prev => ({
        ...prev,
        [position]: !prev[position]
      }));
    };
    
    // Filter data based on visible positions, but always include the selected player
    const getFilteredData = () => {
      // First filter the data by visible positions
      const filtered = data.filter(player => 
        visiblePositions[player.position] || 
        player.playerId === playerId
      );
      
      // Then sort to ensure highlighted player comes last (will be rendered on top)
      return filtered.sort((a, b) => {
        // If a is the highlighted player, it should come after b
        if (a.playerId === playerId || 
          (selectedPlayer && a.playerId === selectedPlayer.playerId)) {
          return 1;
        }
        // If b is the highlighted player, it should come after a
        if (b.playerId === playerId || 
          (selectedPlayer && b.playerId === selectedPlayer.playerId)) {
          return -1;
        }
        // Otherwise, keep original order
        return 0;
      });
    };
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const chartData = await getEfficiencyUsageData(season, type, minGames);
          setData(chartData);
          
          // If a specific player ID was provided, automatically select that player
          if (playerId) {
            const playerData = chartData.find(p => p.playerId === playerId);
            if (playerData) {
              setSelectedPlayer(playerData);
            }
          }
          
          setError(null);
        } catch (err) {
          console.error('Error fetching chart data:', err);
          setError('Failed to load chart data. Please try again later.');
          setData([]);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [season, type, minGames, playerId]);
  
    const handleClick = (data) => {
      setSelectedPlayer(data.payload);
    };
  
    const renderTooltip = (props) => {
      const { active, payload } = props;
      
      if (active && payload && payload.length) {
        const player = payload[0].payload;
        
        return (
          <div className="custom-tooltip">
            <p className="tooltip-name">{player.name}</p>
            <p className="tooltip-team">{player.team}</p>
            <p className="tooltip-position">{player.position}</p>
            <p className="tooltip-stat">True Shooting: {(player.tsPercent * 100).toFixed(1)}%</p>
            <p className="tooltip-stat">Usage: {player.usagePercent.toFixed(1)}%</p>
            <p className="tooltip-stat">PER: {player.per.toFixed(1)}</p>
          </div>
        );
      }
      
      return null;
    };

    // Render position filter toggles
    const renderPositionFilters = () => {
      return (
        <div className="position-filters">
          {Object.keys(positionColors)
            .filter(pos => pos !== 'default')
            .map(position => (
              <div key={position} className="position-filter">
                <label>
                  <input 
                    type="checkbox" 
                    checked={visiblePositions[position]} 
                    onChange={() => togglePosition(position)}
                  />
                  <span className="position-color" style={{backgroundColor: positionColors[position]}}></span>
                  {position}
                </label>
              </div>
            ))
          }
        </div>
      );
    };
  
    if (isLoading) return <div className="loading-container">Loading chart data...</div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!data.length) return <div className="no-data-container">No data available for the selected parameters.</div>;
  
    // Get filtered data for display
    const filteredData = getFilteredData();

    return (
      <div className={`scatter-chart-container ${compact ? 'compact-chart' : ''}`}>
        <h2>NBA Player Efficiency vs Usage ({type === 'regular' ? 'Regular Season' : 'Playoffs'} {season})</h2>
        <p className="chart-subtitle">Minimum {minGames} games played · Bubble size represents Player Efficiency Rating (PER)</p>
        
        {/* Position filters */}
        {renderPositionFilters()}

        <div className="chart-area">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="usagePercent" 
                name="Usage Rate" 
                domain={[5, 40]}
                allowDataOverflow={true}
                label={{ value: 'Usage Rate (%)', position: 'bottom', offset: 20 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="tsPercent" 
                name="True Shooting %" 
                domain={[0.4, 0.85]}
                allowDataOverflow={true}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                label={{ 
                  value: 'True Shooting %', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
                tick={{ fontSize: 12 }}
              />
              <ZAxis 
                type="number" 
                dataKey="per" 
                range={[30, 200]} // Bubble size
                name="PER" 
              />
              <Tooltip content={renderTooltip} />
              
              <Scatter 
                name="Players" 
                data={filteredData} 
                fill="#8884d8" 
                onClick={handleClick}
                isAnimationActive={false}
              >
                {filteredData.map((entry, index) => {
                  const color = positionColors[entry.position] || positionColors.default;
                  // Highlight the selected player or the player that matches the provided ID
                  const isHighlighted = 
                    playerId === entry.playerId || 
                    (selectedPlayer && selectedPlayer.playerId === entry.playerId);
                
                  const zIndex = isHighlighted ? 999 : entry.per; // Higher zIndex for selected player
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color} 
                      stroke={isHighlighted ? "#000" : "none"}
                      strokeWidth={isHighlighted ? 2 : 0}
                      style={{ zIndex: zIndex}} // Control layering
                    />
                  );
                })}
              </Scatter>
              
              {/* League average reference lines */}
              <ReferenceLine 
                y={0.55} 
                stroke="#666" 
                strokeDasharray="3 3" 
                label={{ value: "League Avg TS%", position: 'insideTopLeft', fill: "#000", style: { pointerEvents: "none"} }} 
              />
              <ReferenceLine 
                x={20} 
                stroke="#666" 
                strokeDasharray="3 3" 
                label={{ value: "League Avg Usage", position: 'insideBottomRight', fill: "#000", style: { pointerEvents: "none"} }} 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {compact && (
          <div className="compact-explanation">
            <p>
              This chart shows the player's scoring <strong>efficiency</strong> (True Shooting %) 
              vs <strong>usage rate</strong> (% of team's possesions a player uses while on the floor). 
              The top-right quadrant represents elite offensive players who efficiently 
              handle high volume. Highlighted point shows the current player.
            </p>
          </div>
        )}
        
        {!compact && (
          <div className="chart-explanation">
            <h3>Understanding This Chart</h3>
            <div className="chart-quadrants">
              <div className="quadrant">
                <h4>High Efficiency, High Usage</h4>
                <p>Elite players who efficiently score while heavily involved in offense</p>
              </div>
              <div className="quadrant">
                <h4>High Efficiency, Low Usage</h4>
                <p>Efficient role players who score well in limited opportunities</p>
              </div>
              <div className="quadrant">
                <h4>Low Efficiency, High Usage</h4>
                <p>Volume scorers who use many possessions with below-average efficiency</p>
              </div>
              <div className="quadrant">
                <h4>Low Efficiency, Low Usage</h4>
                <p>Limited offensive contributors who focus on other aspects of the game</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default NBAScatterChart;