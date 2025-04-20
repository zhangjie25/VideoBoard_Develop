import { createContext, useContext, useState } from 'react';

const DnDContext = createContext({
  type: null,
  setType: () => {},
  isDraggingTab: false,
  setIsDraggingTab: () => {},
  tabSourceNodeId: null,
  setTabSourceNodeId: () => {},
});

export const DnDProvider = ({ children }) => {
  const [type, setType] = useState(null);
  const [isDraggingTab, setIsDraggingTab] = useState(false);
  const [tabSourceNodeId, setTabSourceNodeId] = useState(null);

  return (
    <DnDContext.Provider value={{
      type,
      setType,
      isDraggingTab,
      setIsDraggingTab,
      tabSourceNodeId,
      setTabSourceNodeId,
    }}>
      {children}
    </DnDContext.Provider>
  );
}

export default DnDContext;

export const useDnD = () => {
  const context = useContext(DnDContext);
  
  // For backward compatibility with existing code
  if (Array.isArray(context)) {
    return context;
  }
  
  return [
    context.type, 
    context.setType,
    {
      isDraggingTab: context.isDraggingTab,
      setIsDraggingTab: context.setIsDraggingTab,
      tabSourceNodeId: context.tabSourceNodeId,
      setTabSourceNodeId: context.setTabSourceNodeId,
    }
  ];
}