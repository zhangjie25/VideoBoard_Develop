import React, { useState, useEffect } from 'react';
import './AnchorCard.css';

const AnchorCardBrick = ({ index, data, onBrickChange }) => {
  const [brickText, setBrickText] = useState('');
  
  // Update brickText when the index or data changes
  useEffect(() => {
    setBrickText(data?.bricks?.[index]?.text || '');
  }, [index, data?.bricks]);
  
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setBrickText(newText);
    if (onBrickChange) {
      onBrickChange(index, newText);
    }
  };

  return (
    <div className="anchor-card-brick">
      <input
        type="text"
        className="brick-input"
        value={brickText}
        onChange={handleTextChange}
        placeholder="Enter brick text..."
      />
    </div>
  );
};

export default AnchorCardBrick; 