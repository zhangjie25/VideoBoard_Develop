import { useReactFlow } from '@xyflow/react';

export function useNodeUtils({ id }) {
  const { setNodes } = useReactFlow();

  /**
   * Updates a node with new data, preserving existing data
   * @param {Object} newData - The data to update on the node
   */
  const updateNodeData = (newData) => {
    setNodes(nodes => nodes.map(node => 
      node.id === id ? { 
        ...node, 
        data: { ...node.data, ...newData } 
      } : node
    ));
  };

  /**
   * Updates multiple nodes with new data
   * @param {Object} updates - Object mapping node ids to their new data
   */
  const updateMultipleNodes = (updates) => {
    setNodes(nodes => nodes.map(node => 
      updates[node.id] ? { 
        ...node, 
        data: { ...node.data, ...updates[node.id] } 
      } : node
    ));
  };

  /**
   * Removes a node completely
   */
  const removeNode = () => {
    setNodes(nodes => nodes.filter(node => node.id !== id));
  };

  return {
    updateNodeData,
    updateMultipleNodes,
    removeNode
  };
} 