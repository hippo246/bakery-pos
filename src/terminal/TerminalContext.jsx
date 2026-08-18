// Terminal Context
// React Context for terminal identification and access throughout the app

import { createContext, useContext, useState, useEffect } from 'react';
import { getTerminalManager } from './TerminalManager.js';

const TerminalContext = createContext(null);

export const TerminalProvider = ({ children }) => {
  const [currentTerminal, setCurrentTerminal] = useState(null);
  const [allTerminals, setAllTerminals] = useState([]);
  
  const terminalManager = getTerminalManager();
  
  // Initialize terminal
  useEffect(() => {
    const initTerminal = () => {
      // Try to get current terminal from manager
      const terminal = terminalManager.getCurrentTerminal();
      
      if (terminal) {
        setCurrentTerminal(terminal);
        setAllTerminals(terminalManager.getAllTerminals());
      } else {
        // No terminal set, prompt user to select or create one
        console.log('No terminal set. Need to select or create a terminal.');
      }
    };
    
    initTerminal();
    
    // Listen for terminal changes
    const handleTerminalChanged = ({ terminal }) => {
      setCurrentTerminal(terminal);
      setAllTerminals(terminalManager.getAllTerminals());
    };
    
    terminalManager.on('currentTerminalChanged', handleTerminalChanged);
    terminalManager.on('terminalRegistered', () => {
      setAllTerminals(terminalManager.getAllTerminals());
    });
    terminalManager.on('terminalUpdated', () => {
      setAllTerminals(terminalManager.getAllTerminals());
    });
    
    return () => {
      terminalManager.off('currentTerminalChanged', handleTerminalChanged);
    };
  }, [terminalManager]);
  
  // Set current terminal
  const selectTerminal = (terminalId) => {
    const terminal = terminalManager.setCurrentTerminal(terminalId);
    setCurrentTerminal(terminal);
    return terminal;
  };
  
  // Create new terminal
  const createTerminal = (config) => {
    const terminal = terminalManager.registerTerminal(config);
    setAllTerminals(terminalManager.getAllTerminals());
    return terminal;
  };
  
  // Update terminal
  const updateTerminal = (terminalId, updates) => {
    const terminal = terminalManager.updateTerminal(terminalId, updates);
    setAllTerminals(terminalManager.getAllTerminals());
    
    if (currentTerminal?.id === terminalId) {
      setCurrentTerminal(terminal);
    }
    
    return terminal;
  };
  
  // Get terminal by ID
  const getTerminal = (terminalId) => {
    return terminalManager.getTerminal(terminalId);
  };
  
  // Get online terminals
  const getOnlineTerminals = () => {
    return allTerminals.filter(t => terminalManager.isTerminalOnline(t.id));
  };
  
  const value = {
    currentTerminal,
    allTerminals,
    selectTerminal,
    createTerminal,
    updateTerminal,
    getTerminal,
    getOnlineTerminals,
    terminalManager
  };
  
  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  
  return context;
};

export default TerminalContext;
