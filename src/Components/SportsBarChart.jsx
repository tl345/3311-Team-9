/**
 * Sports Bar Chart Component
 * 
 * Shows shooting/performance statistics as a bar chart:
 * - NBA: FG, 2PT, 3PT, FT made vs attempted with percentages
 * - EPL: Shots, dribbles, duels, passes with sport-specific labels and colors
 */

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LabelList, Cell 
} from 'recharts';
import './SportsBarChart.css';

const SportsBarChart = ({ 
  player,
  sport = 'NBA',
  season = null,
  compact = false 
}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define distinct colors for EPL stat categories
  const eplColors = {
    shots: '#4CAF50',     // Green for Shots
    dribbles: '#FF9800',  // Orange for Dribbles
    duels: '#9C27B0',     // Purple for Duels
    passes: '#2196F3',    // Blue for Passes
  };
  
  // NBA uses consistent colors
  const nbaColors = {
    made: '#82ca9d',      // Light green for Made
    attempted: '#8884d8'  // Purple for Attempted
  };

  useEffect(() => {
    const prepareData = () => {
      try {
        setIsLoading(true);
        
        if (!player) {
          setError("No player data provided");
          setData([]);
          return;
        }

        if (sport === 'NBA') {
          // Find the season data in player's regularSeasons
          const regularSeasons = player.regularSeasons || [];
          const currentSeason = season 
            ? regularSeasons.find(s => s.season === season) 
            : regularSeasons[0];
            
          if (!currentSeason || !currentSeason.totals) {
            setError("No season data available for this player");
            setData([]);
            return;
          }

          // Format NBA shooting data from totals
          const totals = currentSeason.totals;
          const nbaData = [
            {
              name: 'Field Goals',
              made: totals.fieldGoals || 0,
              attempted: totals.fieldAttempts || 0,
              percentage: totals.fieldPercent || 0,
              madeLabel: 'Made',
              attemptedLabel: 'Attempted'
            },
            {
              name: '2-Pointers',
              made: totals.twoFg || 0,
              attempted: totals.twoAttempts || 0,
              percentage: totals.twoPercent || 0,
              madeLabel: 'Made',
              attemptedLabel: 'Attempted'
            },
            {
              name: '3-Pointers',
              made: totals.threeFg || 0,
              attempted: totals.threeAttempts || 0,
              percentage: totals.threePercent || 0,
              madeLabel: 'Made',
              attemptedLabel: 'Attempted'
            },
            {
              name: 'Free Throws',
              made: totals.ft || 0,
              attempted: totals.ftAttempts || 0,
              percentage: totals.ftPercent || 0,
              madeLabel: 'Made',
              attemptedLabel: 'Attempted'
            }
          ];
          setData(nbaData);
        } 
        else if (sport === 'EPL') {
          // Find current season in player's seasons data
          const seasons = player.seasons || [];
          const currentSeason = season 
            ? seasons.find(s => s.season === season)
            : seasons[0];

          if (!currentSeason) {
            setError("No season data available for this player");
            setData([]);
            return;
          }

          // Format EPL performance data with specific labels and colors
          const eplData = [
            {
              name: 'Shots',
              made: currentSeason.shots?.on || 0,
              attempted: currentSeason.shots?.total || 0,
              percentage: currentSeason.shots?.total > 0 
                ? ((currentSeason.shots?.on / currentSeason.shots?.total) * 100) 
                : 0,
              madeLabel: 'On Target',
              attemptedLabel: 'Total Shots',
              category: 'shots' // For color mapping
            },
            {
              name: 'Dribbles',
              made: currentSeason.dribbles?.success || 0,
              attempted: currentSeason.dribbles?.attempts || 0,
              percentage: currentSeason.dribbles?.attempts > 0 
                ? ((currentSeason.dribbles?.success / currentSeason.dribbles?.attempts) * 100)
                : 0,
              madeLabel: 'Successful',
              attemptedLabel: 'Attempts',
              category: 'dribbles' // For color mapping
            },
            {
              name: 'Duels',
              made: currentSeason.duels?.won || 0,
              attempted: currentSeason.duels?.total || 0,
              percentage: currentSeason.duels?.total > 0 
                ? ((currentSeason.duels?.won / currentSeason.duels?.total) * 100)
                : 0,
              madeLabel: 'Won',
              attemptedLabel: 'Total',
              category: 'duels' // For color mapping
            },
            {
              name: 'Passes',
              made: currentSeason.passes?.key || 0,
              attempted: currentSeason.passes?.total || 0,
              percentage: currentSeason.passes?.total > 0 
                ? ((currentSeason.passes?.key / currentSeason.passes?.total) * 100)
                : 0,
              madeLabel: 'Key Passes',
              attemptedLabel: 'Total Passes',
              category: 'passes' // For color mapping
            }
          ];
          setData(eplData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error preparing data for bar chart:', err);
        setError('Failed to process player statistics.');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    prepareData();
  }, [player, sport, season]);

  const renderPercentageLabel = (props) => {
    const { x, y, width, height, value } = props;
    
    // Convert percentage values properly - NBA uses 0-1 scale, EPL uses 0-100
    let formattedValue;
    if (sport === 'NBA' && value >= 0 && value <= 1) {
        formattedValue = (value * 100).toFixed(1);
    } else {
        formattedValue = typeof value === 'number' ? value.toFixed(1) : '0.0';
    }
    
    // Position above the bar, closer to the x-line as requested
    return (
      <text 
        x={x + width/2} 
        y={y + height - 5} // Positioning above x-line
        fill="#333" 
        fontSize={12} 
        textAnchor="middle" // Center text
        fontWeight="bold"
      >
        {formattedValue}%
      </text>
    );
  };
  
  // Custom tooltip that uses the item-specific labels
  const renderCustomTooltip = (props) => {
    const { active, payload } = props;
    
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload; // Get the full data item
      const dataKey = payload[0].dataKey; // Get which value we're hovering (made, attempted, percentage)
      
      let value, label;
      
      if (dataKey === 'percentage') {
        // Handle percentage display
        if (sport === 'NBA' && dataItem.percentage >= 0 && dataItem.percentage <= 1) {
          value = `${(dataItem.percentage * 100).toFixed(1)}%`;
        } else {
          value = `${dataItem.percentage.toFixed(1)}%`;
        }
        label = `${dataItem.name} %`;
      } 
      else if (dataKey === 'made') {
        // Use the custom made label from the data
        value = dataItem.made;
        label = dataItem.madeLabel;
      } 
      else if (dataKey === 'attempted') {
        // Use the custom attempted label from the data
        value = dataItem.attempted;
        label = dataItem.attemptedLabel;
      }
      
      return (
        <div className="custom-tooltip">
          <p>{label}: {value}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Get bar color based on sport and category
  const getBarFill = (entry, dataKey) => {
    if (sport === 'NBA') {
      return nbaColors[dataKey]; // Assumes keys match exactly
    }
    const baseColor = eplColors[entry.category] || '#999';
    return dataKey === 'made' ? baseColor : `${baseColor}80`;
  };
  
  // Custom legend for EPL that explains what each stat represents
  const renderEplLegend = () => {
    if (sport !== 'EPL') return null;
    
    return (
      <div className="epl-legend">
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: eplColors.shots }}></span>
          <span>Shots: On Target / Total</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: eplColors.dribbles }}></span>
          <span>Dribbles: Successful / Total</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: eplColors.duels }}></span>
          <span>Duels: Won / Total</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: eplColors.passes }}></span>
          <span>Passes: Key / Total</span>
        </div>
      </div>
    );
  };

  const renderNbaLegend = () => {
    if (sport !== 'NBA') return null;
    
    return (
      <div className="nba-legend">
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: nbaColors.made }}></span>
          <span>Made</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: nbaColors.attempted }}></span>
          <span>Attempted</span>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="loading-container">Loading chart data...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!data.length) return <div className="no-data-container">No data available for this player.</div>;

  return (
    <div className={`bar-chart-container ${compact ? 'compact-chart' : ''}`}>
      <h2>{sport === 'NBA' ? 'Shooting Statistics' : 'Performance Statistics'}</h2>
      <p className="chart-subtitle">
        {sport === 'NBA' 
          ? 'Made vs Attempted with Percentages' 
          : 'Success Rate Statistics'}
      </p>
      
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }} 
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={renderCustomTooltip} />
            
            {/* Bars with dynamic coloring based on sport and category */}
            <Bar 
              dataKey="made"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`made-${index}`} 
                  fill={getBarFill(entry, 'made')}
                />
              ))}
              <LabelList dataKey="made" position="top" />
            </Bar>
            
            <Bar 
              dataKey="attempted"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`attempted-${index}`} 
                  fill={getBarFill(entry, 'attempted')}
                />
              ))}
              <LabelList dataKey="attempted" position="top" />
            </Bar>
            
            {/* Invisible bar to hold percentage labels */}
            <Bar 
              dataKey="percentage" 
              fill="none"
              opacity={0}
            >
              <LabelList dataKey="percentage" content={renderPercentageLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Render EPL and NBA legend below chart */}
      {sport === 'EPL' && renderEplLegend()}
      {sport === 'NBA' && renderNbaLegend()}

      {compact && (
        <div className="compact-explanation">
            <p>
            {sport === 'NBA' 
                ? 'This chart shows shooting statistics with made (green) vs attempted (purple) shots. Percentages indicate shooting efficiency.'
                : 'This chart shows key performance metrics using color-coded categories: shots on target (green), successful dribbles (orange), duels won (purple), and key passes (blue). The darker bars represent successful actions, while lighter bars show total attempts. Percentages indicate success rates.'}
            </p>
        </div>
        )}
    </div>
  );
};

export default SportsBarChart;