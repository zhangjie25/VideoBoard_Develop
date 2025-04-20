/**
 * Custom hook for generating unique IDs
 */
export function useIdGenerator() {
  /**
   * Generates a unique ID with optional prefix
   * @param {string} prefix - Optional prefix for the ID
   * @returns {string} A unique ID
   */
  const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}`;
  };

  /**
   * Generates a unique tab ID
   * @returns {string} A unique tab ID
   */
  const generateTabId = () => {
    return generateUniqueId('tab');
  };

  /**
   * Generates a unique node ID
   * @returns {string} A unique node ID
   */
  const generateNodeId = () => {
    return generateUniqueId('node');
  };

  return {
    generateUniqueId,
    generateTabId,
    generateNodeId
  };
} 