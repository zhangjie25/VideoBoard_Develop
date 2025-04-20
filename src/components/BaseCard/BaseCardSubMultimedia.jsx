import React, { useCallback, useState, useEffect, useRef } from 'react';
import './BaseCard.css';
import { useReactFlow } from '@xyflow/react';

function BaseCardSubMultimedia({ data, tabId, nodeId }) {
  const { setNodes } = useReactFlow();
  const [localMedia, setLocalMedia] = useState({});
  const prevMediaRef = useRef({});
  const prevTabIdRef = useRef('');
  const initializedRef = useRef(false);
  
  // Initialize local media state from tab content
  useEffect(() => {
    // Only update if tab has changed or component just initialized
    if (!initializedRef.current || tabId !== prevTabIdRef.current) {
      const currentTab = data?.tabs?.find(tab => tab.id === tabId);
      const mediaFromData = currentTab?.content?.multimedia || {};
      setLocalMedia(mediaFromData);
      prevMediaRef.current = mediaFromData;
      prevTabIdRef.current = tabId;
      initializedRef.current = true;
    }
  }, [data, tabId, data?.tabs]);
  
  // Function to update the local multimedia state
  const updateLocalMedia = useCallback((type, mediaData) => {
    setLocalMedia(prev => ({
      ...prev,
      [type]: mediaData
    }));
  }, []);
  
  // Save to React Flow store when media changes
  useEffect(() => {
    // Skip initial render and only update if media has changed
    if (!initializedRef.current || JSON.stringify(localMedia) === JSON.stringify(prevMediaRef.current)) {
      return;
    }
    
    // Only update if we have actual media data
    if (Object.keys(localMedia).length > 0) {
      prevMediaRef.current = localMedia;
      
      setNodes(nodes => 
        nodes.map(node => {
          if (node.id === nodeId) {
            // Find and update the current tab
            const updatedTabs = node.data.tabs.map(tab => {
              if (tab.id === tabId) {
                return {
                  ...tab,
                  content: {
                    ...tab.content,
                    multimedia: localMedia
                  }
                };
              }
              return tab;
            });
            
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
    }
  }, [localMedia, nodeId, tabId, setNodes]);
  
  // Example handlers for the control buttons
  const handleAttachment = () => {
    // Mock implementation - would normally open a file dialog
    updateLocalMedia('attachment', { name: 'document.pdf', type: 'file' });
  };
  
  const handleImage = () => {
    // Mock implementation
    updateLocalMedia('image', { url: 'placeholder-image.jpg', type: 'image' });
  };
  
  const handleDrawing = () => {
    // Mock implementation
    updateLocalMedia('drawing', { type: 'drawing', strokes: [] });
  };
  
  return (
    <div className="multimedia-div">
      <div className="media-placeholder">
        {localMedia.image ? (
          <img src={localMedia.image.url} alt="Media content" style={{ maxWidth: '100%' }} />
        ) : localMedia.attachment ? (
          <div>
            <span>📎</span>
            <p>{localMedia.attachment.name}</p>
          </div>
        ) : localMedia.drawing ? (
          <div>
            <span>🎨</span>
            <p>Drawing</p>
          </div>
        ) : (
          <>
            <span>+</span>
            <p>Add media</p>
          </>
        )}
      </div>
      <div className="card-controls">
        <button className="control-btn" onClick={handleAttachment}>📎</button>
        <button className="control-btn" onClick={handleImage}>🖼️</button>
        <button className="control-btn" onClick={handleDrawing}>🎨</button>
      </div>
    </div>
  );
}

export default BaseCardSubMultimedia;