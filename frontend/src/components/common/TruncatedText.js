import React, { useState } from 'react';
import './TruncatedText.css';

const TruncatedText = ({ 
  text, 
  maxLength = 150, 
  className = '', 
  showToggle = true,
  inline = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...' 
    : text;

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const Component = inline ? 'span' : 'div';

  return (
    <Component className={`truncated-text ${className}`}>
      <span className="truncated-text-content">{displayText}</span>
      {shouldTruncate && showToggle && (
        <button 
          className="truncated-text-toggle"
          onClick={toggleExpanded}
          type="button"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </Component>
  );
};

export default TruncatedText;