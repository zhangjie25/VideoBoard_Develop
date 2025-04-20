import React, { useState, useEffect, useRef } from 'react';
import { Handle, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import './BaseCard.css';
import BaseCardSub from './BaseCardSub';
import { useDnD } from '../../DnDContext';

function BaseCardTemplate({ id, data, isConnectable }) {
  // ===== HOOKS =====
  const { setNodes, getNode, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [_, __, dndState] = useDnD();
  const { setIsDraggingTab, setTabSourceNodeId, isDraggingTab, tabSourceNodeId } = dndState || {};
  
  // ===== STATE =====
  const [animation, setAnimation] = useState('');
  const [tabs, setTabs] = useState(data.tabs || [{ id: '1', title: 'Tab 1', content: {} }]);
  const [activeTab, setActiveTab] = useState('1');
  const [draggedTab, setDraggedTab] = useState(null);
  
  // ===== REFS =====
  const tabsRef = useRef(null);
  const cardRef = useRef(null);
  
  // ===== DERIVED PROPS =====
  const nodeLabel = data.label || 'Node Content';
  const isExpanded = data.isExpanded || false;
  
  // ===== EFFECTS =====
  
  // Update node internals when expanded state changes to ensure proper handle positioning
  useEffect(() => {
    updateNodeInternals(id);
  }, [isExpanded, id, updateNodeInternals]);

  // Keep tabs state in sync with React Flow node data
  useEffect(() => {
    if (data.tabs && JSON.stringify(data.tabs) !== JSON.stringify(tabs)) {
      setTabs(data.tabs);
      // If active tab doesn't exist in new tabs, select the first tab
      if (data.tabs.length > 0 && !data.tabs.find(tab => tab.id === activeTab)) {
        setActiveTab(data.tabs[0].id);
      }
    }
  }, [data.tabs]);

  // Save tabs to the node data when tabs change
  useEffect(() => {
    if (tabs.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      setNodes(nodes => nodes.map(node => 
        node.id === id ? { 
          ...node, 
          data: { ...node.data, tabs }
        } : node
      ));
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [tabs, id, setNodes]);
  
  // Add a new effect to handle activeTab updates from node data
  useEffect(() => {
    if (data.activeTab && data.activeTab !== activeTab) {
      setActiveTab(data.activeTab);
    }
  }, [data.activeTab]);
  
  // ===== NODE ACTIONS =====
  
  const toggleExpand = () => {
    // Set animation class based on current state
    setAnimation(isExpanded ? 'card-collapse' : 'card-expand');
    
    // Update the node data with delay for animation
    setTimeout(() => {
      setNodes(nodes => nodes.map(node => 
        node.id === id ? { 
          ...node, 
          data: { 
            ...node.data, 
            isExpanded: !isExpanded,
            activeTab: activeTab // Preserve the active tab
          }
        } : node
      ));
      
      // Reset animation class after animation completes
      setTimeout(() => setAnimation(''), 500);
    }, isExpanded ? 500 : 0);
  };

  const addNewTab = () => {
    // Use unique ID generation for new tabs too
    const newTabId = `tab_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newTab = {
      id: newTabId,
      title: `Tab ${tabs.length + 1}`,
      content: {}
    };
    
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTab(newTabId);
    
    // Immediately update the node data with the new tabs and active tab
    // This helps ensure tab content shows right away
    setNodes(nodes => nodes.map(node => 
      node.id === id ? { 
        ...node, 
        data: { 
          ...node.data, 
          tabs: newTabs,
          activeTab: newTabId
        }
      } : node
    ));
  };
  
  // ===== DRAG & DROP: TAB MANAGEMENT =====

  const handleDragStart = (e, tabId) => {
    e.stopPropagation();
    
    // Set transfer data
    e.dataTransfer.setData('application/reactflow/internal-tab-drag', tabId);
    e.dataTransfer.setData('application/reactflow/source-node-id', id);
    
    // Update global DnD context
    if (setIsDraggingTab) setIsDraggingTab(true);
    if (setTabSourceNodeId) setTabSourceNodeId(id);
    
    setDraggedTab(tabId);
    
    // Create ghost element for drag feedback
    addDragGhostImage(e, tabId);
  };
  
  const addDragGhostImage = (e, tabId) => {
    if (!e.dataTransfer) return;
    
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('tab-ghost');
    ghostElement.textContent = tabs.find(tab => tab.id === tabId)?.title || '';
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    
    setTimeout(() => document.body.removeChild(ghostElement), 0);
  };

  const handleDragOver = (e) => {
    if (!e.dataTransfer.types.includes('application/reactflow/internal-tab-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (tabsRef.current && draggedTab && tabSourceNodeId === id) {
      handleTabReordering(e);
    } else if (isDraggingTab && tabSourceNodeId !== id) {
      // Visual indicator for drop target
      cardRef.current?.classList.add('tab-drop-target');
    }
  };
  
  const handleTabReordering = (e) => {
    const tabElements = Array.from(tabsRef.current.querySelectorAll('.tab-item:not(.add-tab)'));
    const draggedElement = tabsRef.current.querySelector(`[data-tab-id="${draggedTab}"]`);
    
    if (!draggedElement) return;
    
    const draggedIndex = tabs.findIndex(tab => tab.id === draggedTab);
    
    // Find the tab being dragged over
    for (let i = 0; i < tabElements.length; i++) {
      const tabElement = tabElements[i];
      const tabRect = tabElement.getBoundingClientRect();
      const tabId = tabElement.getAttribute('data-tab-id');
      
      if (tabId !== draggedTab) {
        const targetIndex = tabs.findIndex(tab => tab.id === tabId);
        
        // Determine if we're dragging over this tab
        if (e.clientX > tabRect.left && e.clientX < tabRect.right) {
          if (draggedIndex !== targetIndex) {
            // Reorder tabs
            const newTabs = [...tabs];
            const [draggedTabObj] = newTabs.splice(draggedIndex, 1);
            newTabs.splice(targetIndex, 0, draggedTabObj);
            setTabs(newTabs);
            break;
          }
        }
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    cardRef.current?.classList.remove('tab-drop-target');
    
    // Only handle internal tab drags from other nodes
    if (!e.dataTransfer.types.includes('application/reactflow/internal-tab-drag') || !isDraggingTab) {
      return;
    }
    
    const sourceNodeId = e.dataTransfer.getData('application/reactflow/source-node-id');
    const draggedTabId = e.dataTransfer.getData('application/reactflow/internal-tab-drag');
    
    // Only process if this is a different node
    if (sourceNodeId && sourceNodeId !== id && draggedTabId) {
      moveTabBetweenNodes(sourceNodeId, draggedTabId);
    }
  };
  
  const moveTabBetweenNodes = (sourceNodeId, draggedTabId) => {
    const sourceNode = getNode(sourceNodeId);
    
    if (!sourceNode || !sourceNode.data.tabs) return;
    
    // Find the tab in the source node
    const sourceTabs = sourceNode.data.tabs;
    const draggedTabIndex = sourceTabs.findIndex(tab => tab.id === draggedTabId);
    
    if (draggedTabIndex === -1) return;
    
    // Extract the dragged tab
    const draggedTab = sourceTabs[draggedTabIndex];
    
    // Generate a truly unique ID that won't conflict with existing tab IDs
    // Use a timestamp combined with a random number to ensure uniqueness
    const newTabId = `tab_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newTab = {
      id: newTabId,
      title: draggedTab.title,
      content: draggedTab.content || {}
    };
    
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTab(newTabId);
    
    // Remove tab from source node
    const updatedSourceTabs = [...sourceTabs];
    updatedSourceTabs.splice(draggedTabIndex, 1);
    
    // Update nodes in React Flow
    updateNodesAfterTabMove(sourceNodeId, newTabs, updatedSourceTabs);
  };
  
  const updateNodesAfterTabMove = (sourceNodeId, targetTabs, sourceTabs) => {
    setNodes(nodes => {
      // First update this node with new tabs
      const updatedNodes = nodes.map(node => 
        node.id === id ? { 
          ...node, 
          data: { 
            ...node.data, 
            tabs: targetTabs,
            activeTab: activeTab // Store the active tab in node data
          } 
        } : node
      );
      
      // If source node has no more tabs, remove it
      if (sourceTabs.length === 0) {
        return updatedNodes.filter(node => node.id !== sourceNodeId);
      } 
      
      // Otherwise update source node with remaining tabs and its activeTab if needed
      return updatedNodes.map(node => {
        if (node.id === sourceNodeId) {
          // For the source node, set activeTab to the first tab if there are any tabs left
          const sourceActiveTab = sourceTabs.length > 0 ? sourceTabs[0].id : null;
          return { 
            ...node, 
            data: { 
              ...node.data, 
              tabs: sourceTabs,
              activeTab: sourceActiveTab
            } 
          };
        }
        return node;
      });
    });
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    
    // Reset global DnD context
    if (setIsDraggingTab) setIsDraggingTab(false);
    if (setTabSourceNodeId) setTabSourceNodeId(null);
    
    // Check if tab was dragged outside to create a new node
    if (tabsRef.current && cardRef.current && draggedTab) {
      const wasDraggedOutside = checkIfDraggedOutside(e);
      
      if (wasDraggedOutside) {
        const isOverExistingNode = checkIfOverExistingNode(e);
        
        // Create new node if not dropped on an existing one
        if (!isOverExistingNode) {
          createNewNodeFromTab(e, draggedTab);
        }
      }
    }
    
    setDraggedTab(null);
  };
  
  const checkIfDraggedOutside = (e) => {
    const tabsRect = cardRef.current.getBoundingClientRect();
    return (
      e.clientX < tabsRect.left - 50 || 
      e.clientX > tabsRect.right + 50 || 
      e.clientY < tabsRect.top - 50 || 
      e.clientY > tabsRect.bottom + 50
    );
  };
  
  const checkIfOverExistingNode = (e) => {
    return getNodes().some(node => {
      if (node.id === id) return false; // Skip the source node
      
      // Get the DOM element for the node
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
      if (!nodeElement) return false;
      
      const nodeRect = nodeElement.getBoundingClientRect();
      return (
        e.clientX >= nodeRect.left &&
        e.clientX <= nodeRect.right &&
        e.clientY >= nodeRect.top &&
        e.clientY <= nodeRect.bottom
      );
    });
  };
  
  const createNewNodeFromTab = (e, tabId) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const draggedTabData = tabs[tabIndex];
    
    if (!draggedTabData) return;
    
    // Get the React Flow container bounds
    const reactFlowBounds = document.querySelector('.reactflow-wrapper').getBoundingClientRect();
    
    // Calculate position for new node
    const newPosition = {
      x: e.clientX - reactFlowBounds.left,
      y: e.clientY - reactFlowBounds.top
    };
    
    // Create a unique ID for the new node
    const newNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create a new tab ID for the new node
    const newTabId = `tab_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create new node with the tab data
    const newNode = {
      id: newNodeId,
      type: 'BaseCard',
      position: newPosition,
      data: {
        label: draggedTabData.title,
        isExpanded: true,
        // Set activeTab in the node data so content shows immediately
        activeTab: newTabId,
        tabs: [{ 
          id: newTabId,
          title: draggedTabData.title, 
          content: draggedTabData.content || {} 
        }]
      },
      dragHandle: '.card-header.xxx'
    };
    
    // Add the new node to the flow
    setNodes(nodes => [...nodes, newNode]);
    
    // Remove the tab from the original node
    handleTabRemoval(tabIndex, tabId);
  };
  
  const handleTabRemoval = (tabIndex, tabId) => {
    const newTabs = [...tabs];
    newTabs.splice(tabIndex, 1);
    
    // If all tabs are removed, remove the node entirely
    if (newTabs.length === 0) {
      setNodes(nodes => nodes.filter(node => node.id !== id));
    } else {
      // Otherwise, update the tabs in the original node
      setTabs(newTabs);
      
      // Update active tab if needed
      if (activeTab === tabId) {
        setActiveTab(newTabs[0].id);
      }
    }
  };
  
  // ===== EVENT HANDLERS =====
  
  const handleDragEnter = (e) => {
    if (e.dataTransfer.types.includes('application/reactflow/internal-tab-drag')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Only add drop target indicator if drag is from another node
      const sourceNodeId = e.dataTransfer.getData('application/reactflow/source-node-id');
      if (sourceNodeId && sourceNodeId !== id) {
        cardRef.current?.classList.add('tab-drop-target');
      }
    }
  };
  
  const handleDragLeave = (e) => {
    if (e.dataTransfer.types.includes('application/reactflow/internal-tab-drag')) {
      e.preventDefault();
      e.stopPropagation();
      cardRef.current?.classList.remove('tab-drop-target');
    }
  };

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
