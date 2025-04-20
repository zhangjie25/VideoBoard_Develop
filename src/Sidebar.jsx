import React from 'react';
import { useDnD } from './DnDContext';

export default () => {
  const [_, setType, dndState] = useDnD();
  const { setIsDraggingTab } = dndState || {};

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    // Mark this as a sidebar drag (not an internal tab drag)
    event.dataTransfer.setData('application/reactflow/sidebar-drag', 'true');
    
    // Clear any tab dragging state
    if (setIsDraggingTab) {
      setIsDraggingTab(false);
    }
    
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">You can drag these nodes to the pane on the right.</div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'BaseCard')} draggable>
        Default Node
      </div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'BkCard')} draggable>
        BackGround Card
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'AnchorCard')} draggable>
        Anchor Card
      </div>
    </aside>
  );
};
