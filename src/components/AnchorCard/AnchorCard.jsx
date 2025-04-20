import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import './AnchorCard.css';
import AnchorCardBrick from './AnchorCardBrick';

// No CSS import needed for built-in node

const AnchorCardTemplate = ({ data, isConnectable }) => {
  const [expanded, setExpanded] = useState(false);
  const nodeLabel = data.label || 'Anchor Node';
  
  // State for storing bricks and active tab
  const [bricks, setBricks] = useState(data.bricks || [{ id: 1, text: '' }]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Add a new brick tab
  const addBrick = () => {
    const newBrick = {
      id: bricks.length + 1,
      text: ''
    };
    setBricks([...bricks, newBrick]);
    setActiveTabIndex(bricks.length);
  };

  // Handle brick content changes
  const handleBrickChange = (index, text) => {
    const updatedBricks = [...bricks];
    updatedBricks[index] = { ...updatedBricks[index], text };
    setBricks(updatedBricks);
  };

  return (
    <div className="anchor-card">
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable}
      />
      
      {/* Header can be dragged - add drag-handle class */}
      <div className="anchor-card-header drag-handle">
        <span className="anchor-card-title">{nodeLabel}</span>
        <button 
          className="anchor-card-expand-button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {/* Body content - only visible when expanded */}
      {expanded && (
        <div className="anchor-card-body">
          {/* Tab navigation */}
          <div className="anchor-card-tabs">
            {bricks.map((brick, index) => (
              <div 
                key={brick.id}
                className={`anchor-card-tab ${activeTabIndex === index ? 'active' : ''}`}
                onClick={() => setActiveTabIndex(index)}
              >
                Tab {index + 1}
              </div>
            ))}
            <button className="add-tab-button" onClick={addBrick}>+</button>
          </div>
          
          {/* Active brick content */}
          <div className="anchor-card-tab-content">
            <AnchorCardBrick 
              index={activeTabIndex}
              data={{ bricks }}
              onBrickChange={handleBrickChange}
            />
          </div>
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default AnchorCardTemplate;
