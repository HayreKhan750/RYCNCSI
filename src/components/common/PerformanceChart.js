import React from 'react';
import { motion } from 'framer-motion';

export default function PerformanceChart({ data, title, subtitle }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value));
  
  return (
    <div className="performance-chart-container glass-card">
      <div className="chart-header">
        <div>
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
        <div className="trend-indicator positive">
          <span className="icon">📈</span>
          <span>+12%</span>
        </div>
      </div>
      
      <div className="chart-visual">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="chart-svg">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid Lines */}
          <line x1="0" y1="0" x2="400" y2="0" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="40" x2="400" y2="40" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="var(--border-subtle)" strokeWidth="0.5" />

          {/* Area */}
          <path 
            d={`M 0 120 ${data.map((d, i) => `L ${(i / (data.length - 1)) * 400} ${120 - (d.value / maxVal) * 100}`).join(' ')} L 400 120 Z`}
            fill="url(#chartGradient)"
          />
          
          {/* Line */}
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d={`M 0 ${120 - (data[0].value / maxVal) * 100} ${data.map((d, i) => `L ${(i / (data.length - 1)) * 400} ${120 - (d.value / maxVal) * 100}`).join(' ')}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Points */}
          {data.map((d, i) => (
            <circle 
              key={i}
              cx={(i / (data.length - 1)) * 400}
              cy={120 - (d.value / maxVal) * 100}
              r="4"
              fill="white"
              stroke="var(--primary)"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
      
      <div className="chart-labels">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>

      <style jsx>{`
        .performance-chart-container {
          padding: 24px;
          margin-top: 24px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .chart-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .chart-header p {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .chart-visual {
          height: 120px;
          width: 100%;
          margin-bottom: 12px;
        }
        .chart-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .chart-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
