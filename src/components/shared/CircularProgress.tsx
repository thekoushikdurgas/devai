import React from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size = 20, strokeWidth = 2.5, showPercentage = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          className="text-gray-200 dark:text-dark-border"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-300 ease-in-out"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showPercentage && size >= 20 && (
        <span className="absolute text-[8px] font-mono font-semibold text-gray-700 dark:text-dark-text-secondary">
          {`${Math.round(progress)}`}
        </span>
      )}
    </div>
  );
};
