import React from 'react';
import { Handle, Position } from '@xyflow/react';

import './BkCard.css';

const BkCardTemplate = ({ data, isConnectable }) => {
    return (
      <div className="bk-card">
        <Handle 
          type="source" 
          position={Position.Top} 
          id="top-source"
          isConnectable={isConnectable} 
        />
        <Handle 
          type="target" 
          position={Position.Top} 
          id="top-target"
          isConnectable={isConnectable} 
        />
        <div className="bk-card-header">
          {data.label}
        </div>
        <div className="bk-card-content">
          Background Card Content
        </div>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="bottom-source"
          isConnectable={isConnectable} 
        />
        <Handle 
          type="target" 
          position={Position.Bottom} 
          id="bottom-target"
          isConnectable={isConnectable} 
        />
      </div>
    );
};

export default BkCardTemplate;
