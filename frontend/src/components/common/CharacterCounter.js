import React from 'react';
import './CharacterCounter.css';

const CharacterCounter = ({ 
  current, 
  max, 
  warningThreshold = 0.8, 
  className = '' 
}) => {
  const percentage = current / max;
  const isWarning = percentage >= warningThreshold;
  const isOverLimit = current > max;

  return (
    <div className={`character-counter ${className} ${isWarning ? 'warning' : ''} ${isOverLimit ? 'over-limit' : ''}`}>
      <span className="counter-text">
        {current}/{max}
      </span>
      {isOverLimit && (
        <span className="over-limit-text">
          Exceeds limit by {current - max}
        </span>
      )}
    </div>
  );
};

export default CharacterCounter;