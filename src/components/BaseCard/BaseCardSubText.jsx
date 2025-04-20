import React, { useCallback, useEffect, useState, useRef } from 'react';
import './BaseCard.css';
import { useReactFlow } from '@xyflow/react';

function BaseCardSubText({ data, tabId, nodeId }) {
  const { setNodes, getNode } = useReactFlow();
  const [localText, setLocalText] = useState('');
  const prevTextRef = useRef('');
  const prevTabIdRef = useRef('');
  const initializedRef = useRef(false);
  
  // Initialize local text state from tab content
  useEffect(() => {
    // Only update local state from props if tab changed or we haven't initialized yet
    if (!initializedRef.current || tabId !== prevTabIdRef.current) {
      const currentTab = data?.tabs?.find(tab => tab.id === tabId);
      const textFromData = currentTab?.content?.text || '';
      setLocalText(textFromData);
      prevTextRef.current = textFromData;
      prevTabIdRef.current = tabId;
      initializedRef.current = true;
    }
  }, [data, tabId, data?.tabs]);
  
  // Handle text changes and store them in local state first
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setLocalText(newText);
  }, []);
  
  // Save to React Flow store when text changes (with debounce)
  useEffect(() => {
    // Skip the initial render and only update if text has changed
    if (!initializedRef.current || localText === prevTextRef.current) {
      return;
    }
    
    const saveTimer = setTimeout(() => {
      prevTextRef.current = localText;
      
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            // Find the current tab in the tabs array
            const updatedTabs = node.data.tabs.map(tab => {
              if (tab.id === tabId) {
                // Update the content of the specific tab
                return {
                  ...tab,
                  content: {
                    ...tab.content,
                    text: localText
                  }
                };
              }
              return tab;
            });
            
            // Return updated node with new tabs data
            return {
              ...node,
              data: {
                ...node.data,
                tabs: updatedTabs
              }
            };
          }
          return node;
        })
      );
    }, 300); // 300ms debounce
    
    return () => clearTimeout(saveTimer);
  }, [localText, nodeId, tabId, setNodes]);
  
  return (
    <div className="text-div">
      <textarea 
        placeholder="Add your text here..." 
        value={localText}
        onChange={handleTextChange}
        className="text-input"
      />
    </div>
  );
}

export default BaseCardSubText; 