import { useState, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useBaseCardNodeUtils } from './useBaseCardNodeUtils';
import { useBaseCardIdGenerator } from './useBaseCardIdGenerator';

export function useBaseCardTabDnD({ id, tabs, activeTab, setTabs, setActiveTab, dndState }) {
  const { getNode, getNodes, setNodes } = useReactFlow();
  const { updateNodeData, updateMultipleNodes, removeNode } = useBaseCardNodeUtils({ id });
  const { generateTabId, generateNodeId } = useBaseCardIdGenerator();
  const { setIsDraggingTab, setTabSourceNodeId, isDraggingTab, tabSourceNodeId } = dndState || {};
  
  // State for drag handling
  const [draggedTab, setDraggedTab] = useState(null);
  
  // Refs for DOM elements
  const tabsRef = useRef(null);
  const cardRef = useRef(null);

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
    const newTabId = generateTabId();
    
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
    const updates = {
      [id]: {
        tabs: targetTabs,
        activeTab
      }
    };

    // If source node has no more tabs, remove it
    if (sourceTabs.length === 0) {
      // Use the React Flow hook that was declared at the component level
      setNodes(nodes => {
        const updatedNodes = nodes.map(node => 
          node.id === id ? { 
            ...node, 
            data: { 
              ...node.data, 
              ...updates[id] 
            } 
          } : node
        );
        return updatedNodes.filter(node => node.id !== sourceNodeId);
      });
    } else {
      // Otherwise update source node with remaining tabs and its activeTab
      updates[sourceNodeId] = {
        tabs: sourceTabs,
        activeTab: sourceTabs.length > 0 ? sourceTabs[0].id : null
      };
      updateMultipleNodes(updates);
    }
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
    const newNodeId = generateNodeId();
    
    // Create a new tab ID for the new node
    const newTabId = generateTabId();
    
    // Create new node with the tab data
    const newNode = {
      id: newNodeId,
      type: 'BaseCard',
      position: newPosition,
      data: {
        label: draggedTabData.title,
        isExpanded: true,
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
      removeNode();
    } else {
      // Otherwise, update the tabs in the original node
      setTabs(newTabs);
      
      // Update active tab if needed
      if (activeTab === tabId) {
        const newActiveTab = newTabs[0].id;
        setActiveTab(newActiveTab);
        updateNodeData({ 
          tabs: newTabs,
          activeTab: newActiveTab
        });
      } else {
        updateNodeData({ tabs: newTabs });
      }
    }
  };
  
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

  return {
    draggedTab,
    tabsRef,
    cardRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave
  };
} 