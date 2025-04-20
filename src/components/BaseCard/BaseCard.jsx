import React from 'react';
import { Handle, useReactFlow } from '@xyflow/react';
import './BaseCard.css';
import BaseCardSub from './BaseCardSub';
import { useDnD } from '../../DnDContext';
import { useTabManagement, useTabDragAndDrop } from './hooks';

function BaseCardTemplate({ id, data, isConnectable }) {
  // ===== HOOKS =====
  const [_, __, dndState] = useDnD();
  
  // Custom hook for tab management
  const {
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
    animation,
    toggleExpand,
    addNewTab
  } = useTabManagement({ id, data });
  
  // Custom hook for drag and drop functionality
  const {
    draggedTab,
    tabsRef,
    cardRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave
  } = useTabDragAndDrop({ id, tabs, activeTab, setTabs, setActiveTab, dndState });
  
  // ===== DERIVED PROPS =====
  const nodeLabel = data.label || 'Node Content';
  const isExpanded = data.isExpanded || false;
  
  // ===== RENDER =====
  return (
    <div 
      className={`base-card ${isExpanded ? 'expanded' : ''}`} 
      ref={cardRef}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top connection handle */}
      <Handle
        type="target"
        position="top"
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      
      <div className="card-div">
        {/* Card header with title and expand/collapse button */}
        <div className="card-header xxx">
          <span className="card-title">{nodeLabel}</span>
          <button className="expand-button" onClick={toggleExpand}>
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        {/* Tab container - only visible when expanded */}
        {isExpanded && (
          <div 
            className="tab-container" 
            ref={tabsRef} 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                data-tab-id={tab.id}
                onClick={() => setActiveTab(tab.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragEnd={handleDragEnd}
              >
                {tab.title}
              </div>
            ))}
            <div className="tab-item add-tab" onClick={addNewTab}>+</div>
          </div>
        )}
        
        {/* Card content body */}
        <div className={`card-body ${animation}`}>
          {(isExpanded || animation === 'card-collapse') && (
            <>
              {tabs.map(tab => (
                <div 
                  key={tab.id} 
                  className={`tab-content ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <BaseCardSub data={{...data, tabs: tabs}} tabId={tab.id} nodeId={id} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Bottom connection handle */}
      <Handle
        type="source"
        position="bottom"
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default BaseCardTemplate;
