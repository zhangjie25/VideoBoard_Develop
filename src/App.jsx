import React, { useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './index.css';

import Sidebar from './Sidebar';
import { DnDProvider, useDnD } from './DnDContext';
import BaseCardTemplate from './components/BaseCard/BaseCard';
import AnchorCardTemplate from './components/AnchorCard/AnchorCard';
import BkCardTemplate from './components/BkCard/BkCard';

const initialNodes = [
];




let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [type, setType, dndState] = useDnD();
  const { isDraggingTab, tabSourceNodeId } = dndState || {};

  const mynodeTypes = useMemo(() => ({
    AnchorCard: AnchorCardTemplate,
    BaseCard: BaseCardTemplate,
    BkCard: BkCardTemplate,
  }), []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const onDragOver = useCallback((event) => {
    // Determine if this is an internal tab drag or a sidebar drag
    const isInternalTabDrag = event.dataTransfer.types.includes('application/reactflow/internal-tab-drag');
    const isSidebarDrag = event.dataTransfer.types.includes('application/reactflow/sidebar-drag');
    
    // For internal tab drags, let the BaseCard component handle it
    if (isInternalTabDrag) {
      return;
    }
    
    // For drags from the sidebar to create a new node
    if (isSidebarDrag || type) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }, [type]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      // Determine the type of drag operation
      const isInternalTabDrag = event.dataTransfer.types.includes('application/reactflow/internal-tab-drag');
      const isSidebarDrag = event.dataTransfer.types.includes('application/reactflow/sidebar-drag');
      
      // If it's a tab being dragged out of a node, let the BaseCard component handle it
      if (isInternalTabDrag) {
        return;
      }

      // This should be a drag from the sidebar to create a new node
      if (!isSidebarDrag && !type) {
        return;
      }

      // Get the position where the drop happened
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          label: `${type}`,
          isExpanded: false,
        },
        ...(type === 'AnchorCard' && {
          dragHandle: '.anchor-card-header.drag-handle'
        }),
        ...(type === 'BaseCard' && { 
          dragHandle: '.card-header.xxx' 
        }),
      };

      setNodes((nds) => nds.concat(newNode));
      
      // Reset the node type after creating a node
      setType(null);
    },
    [screenToFlowPosition, type, setType],
  );

  return (
    <div className="dndflow">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={mynodeTypes}
          style={{ backgroundColor: "#F7F9FB" }}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <Sidebar />
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <DnDProvider>
      <DnDFlow />
    </DnDProvider>
  </ReactFlowProvider>
);
