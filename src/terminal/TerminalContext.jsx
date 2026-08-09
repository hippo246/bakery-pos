// Terminal Context
// React Context for terminal identification and access throughout the app

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTerminalManager } from './TerminalManager.js';
import { getRealtimeSyncClient } from '../realtime/RealtimeSyncClient.js';

const TerminalContext = createContext(null);

export const TerminalProvider = ({ children }) => {
  const [currentTerminal, setCurrentTerminal] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [allTerminals, setAllTerminals] = useState([]);
  
  const terminalManager = getTerminalManager();
  const syncClient = getRealtimeSyncClient();
  
  // Initialize terminal
  useEffect(() => {
    const initTerminal = () => {
      // Try to get current terminal from manager
      const terminal = terminalManager.getCurrentTerminal();
      
      if (terminal) {
        setCurrentTerminal(terminal);
        setAllTerminals(terminalManager.getAllTerminals());
        
        // Connect to sync server
        syncClient.connect(terminal.id).then(() => {
          setIsConnected(true);
        }).catch(error => {
          console.error('Failed to connect to sync server:', error);
        });
        
        // Subscribe to orders and tables
        syncClient.subscribe('orders');
        syncClient.subscribe('tables');
        syncClient.subscribe('inventory');
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
    
    // Listen for sync connection changes
    syncClient.on('connected', () => setIsConnected(true));
    syncClient.on('disconnected', () => setIsConnected(false));
    
    return () => {
      terminalManager.off('currentTerminalChanged', handleTerminalChanged);
      syncClient.disconnect();
    };
  }, [terminalManager, syncClient]);
  
  // Set current terminal
  const selectTerminal = async (terminalId) => {
    try {
      const terminal = terminalManager.setCurrentTerminal(terminalId);
      setCurrentTerminal(terminal);
      
      // Reconnect to sync server with new terminal
      if (syncClient.isConnected) {
        syncClient.disconnect();
      }
      
      await syncClient.connect(terminalId);
      setIsConnected(true);
      
      // Subscribe to resources
      syncClient.subscribe('orders');
      syncClient.subscribe('tables');
      syncClient.subscribe('inventory');
      
      return terminal;
    } catch (error) {
      console.error('Failed to select terminal:', error);
      throw error;
    }
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
    isConnected,
    allTerminals,
    selectTerminal,
    createTerminal,
    updateTerminal,
    getTerminal,
    getOnlineTerminals,
    terminalManager,
    syncClient
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
