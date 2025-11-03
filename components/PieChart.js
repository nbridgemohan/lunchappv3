'use client';

export default function PieChart({ restaurant, voters }) {
  if (!restaurant || !voters || voters.length === 0) {
    return (
      <div className="pie-chart-container">
        <p>No voting data available</p>
      </div>
    );
  }

  // Create segments for each voter
  const segments = voters.map((voter, index) => {
    const percentage = (1 / voters.length) * 100;
    const rotation = (index / voters.length) * 360;

    return {
      percentage,
      rotation,
      voter: voter.username || 'Unknown',
    };
  });

  // Generate conic gradient
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B88B',
    '#ABEBC6',
  ];

  let gradientStops = [];
  let currentRotation = 0;

  segments.forEach((segment, index) => {
    const color = colors[index % colors.length];
    const nextRotation = currentRotation + segment.percentage;

    gradientStops.push(`${color} ${currentRotation}% ${nextRotation}%`);
    currentRotation = nextRotation;
  });

  const conicGradient = `conic-gradient(${gradientStops.join(', ')})`;

  return (
    <div className="pie-chart-container">
      <div className="pie-chart" style={{ background: conicGradient }}>
        <div className="pie-chart-center">
          <span className="pie-chart-text">{voters.length}</span>
          <span className="pie-chart-label">votes</span>
        </div>
      </div>
      <div className="pie-chart-legend">
        {segments.map((segment, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="legend-text">{segment.voter}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .pie-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .pie-chart {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .pie-chart-center {
          width: 200px;
          height: 200px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pie-chart-text {
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
        }

        .pie-chart-label {
          font-size: 0.875rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pie-chart-legend {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          width: 100%;
          max-width: 400px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .legend-text {
          font-size: 0.875rem;
          color: #555;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
