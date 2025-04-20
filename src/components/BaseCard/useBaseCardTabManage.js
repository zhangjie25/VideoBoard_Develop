import { useState, useEffect } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import { useBaseCardNodeUtils } from './useBaseCardNodeUtils';
import { useBaseCardIdGenerator } from './useBaseCardIdGenerator';

export function useBaseCardTabManage({ id, data }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeData } = useBaseCardNodeUtils({ id });
  const { generateTabId } = useBaseCardIdGenerator();
  
  // Initialize tabs from data or with a default tab
  const [tabs, setTabs] = useState(data.tabs || [{ id: '1', title: 'Tab 1', content: {} }]);
  const [activeTab, setActiveTab] = useState(data.activeTab || '1');
  const [animation, setAnimation] = useState('');
  
  // Update node internals when expanded state changes to ensure proper handle positioning
  useEffect(() => {
    updateNodeInternals(id);
  }, [data.isExpanded, id, updateNodeInternals]);

  // Keep tabs state in sync with React Flow node data
  useEffect(() => {
    if (data.tabs && JSON.stringify(data.tabs) !== JSON.stringify(tabs)) {
      setTabs(data.tabs);
      // If active tab doesn't exist in new tabs, select the first tab
      if (data.tabs.length > 0 && !data.tabs.find(tab => tab.id === activeTab)) {
        setActiveTab(data.tabs[0].id);
      }
    }
  }, [data.tabs, activeTab]);

  // Save tabs to the node data when tabs change
  useEffect(() => {
    if (tabs.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      updateNodeData({ tabs });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [tabs, updateNodeData]);
  
  // Sync activeTab with node data
  useEffect(() => {
    if (data.activeTab && data.activeTab !== activeTab) {
      setActiveTab(data.activeTab);
    }
  }, [data.activeTab]);

  const toggleExpand = () => {
    const isExpanded = data.isExpanded || false;
    // Set animation class based on current state
    setAnimation(isExpanded ? 'card-collapse' : 'card-expand');
    
    // Update the node data with delay for animation
    setTimeout(() => {
      updateNodeData({ 
        isExpanded: !isExpanded,
        activeTab: activeTab // Preserve the active tab
      });
      
      // Reset animation class after animation completes
      setTimeout(() => setAnimation(''), 500);
    }, isExpanded ? 500 : 0);
  };

  const addNewTab = () => {
    // Create unique ID for new tab using the generator
    const newTabId = generateTabId();
    const newTab = {
      id: newTabId,
      title: `Tab ${tabs.length + 1}`,
      content: {}
    };
    
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTab(newTabId);
    
    // Immediately update the node data with the new tabs and active tab
    updateNodeData({ 
      tabs: newTabs,
      activeTab: newTabId
    });
  };

  return {
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
    animation,
    toggleExpand,
    addNewTab
  };
} 