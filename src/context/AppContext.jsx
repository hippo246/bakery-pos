/**
 * App Context
 * Global state management using React Context API
 * Provides shared state and actions across the application
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
      const loadedCustomers = JSON.parse(localStorage.getItem('cafeos_customers') || '[]');
      const loadedStaff = JSON.parse(localStorage.getItem('cafeos_staff') || '[]');
      const loadedTables = JSON.parse(localStorage.getItem('cafeos_tables') || '[]');
      const loadedInventory = JSON.parse(localStorage.getItem('cafeos_inventory') || '[]');
      const loadedMenu = JSON.parse(localStorage.getItem('cafeos_menu') || '[]');

      setOrders(loadedOrders);
      setCustomers(loadedCustomers);
      setStaff(loadedStaff);
      setTables(loadedTables);
      setInventory(loadedInventory);
      setMenu(loadedMenu);
    } catch (err) {
      setError('Failed to load data from localStorage');
      console.error('[AppContext] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveOrders = useCallback((newOrders) => {
    setOrders(newOrders);
    localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
  }, []);

  const saveCustomers = useCallback((newCustomers) => {
    setCustomers(newCustomers);
    localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
  }, []);

  const saveStaff = useCallback((newStaff) => {
    setStaff(newStaff);
    localStorage.setItem('cafeos_staff', JSON.stringify(newStaff));
  }, []);

  const saveTables = useCallback((newTables) => {
    setTables(newTables);
    localStorage.setItem('cafeos_tables', JSON.stringify(newTables));
  }, []);

  const saveInventory = useCallback((newInventory) => {
    setInventory(newInventory);
    localStorage.setItem('cafeos_inventory', JSON.stringify(newInventory));
  }, []);

  const saveMenu = useCallback((newMenu) => {
    setMenu(newMenu);
    localStorage.setItem('cafeos_menu', JSON.stringify(newMenu));
  }, []);

  const addOrder = useCallback((order) => {
    setOrders(prev => {
      const newOrders = [...prev, order];
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
      return newOrders;
    });
  }, []);

  const updateOrder = useCallback((orderId, updates) => {
    setOrders(prev => {
      const newOrders = prev.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      );
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
      return newOrders;
    });
  }, []);

  const deleteOrder = useCallback((orderId) => {
    setOrders(prev => {
      const newOrders = prev.filter(order => order.id !== orderId);
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
      return newOrders;
    });
  }, []);

  const addCustomer = useCallback((customer) => {
    setCustomers(prev => {
      const newCustomers = [...prev, customer];
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
      return newCustomers;
    });
  }, []);

  const updateCustomer = useCallback((customerId, updates) => {
    setCustomers(prev => {
      const newCustomers = prev.map(customer => 
        customer.id === customerId ? { ...customer, ...updates } : customer
      );
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
      return newCustomers;
    });
  }, []);

  const deleteCustomer = useCallback((customerId) => {
    setCustomers(prev => {
      const newCustomers = prev.filter(customer => customer.id !== customerId);
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
      return newCustomers;
    });
  }, []);

  const value = {
    // State
    orders,
    customers,
    staff,
    tables,
    inventory,
    menu,
    isLoading,
    error,

    // Actions
    loadAllData,
    saveOrders,
    saveCustomers,
    saveStaff,
    saveTables,
    saveInventory,
    saveMenu,
    addOrder,
    updateOrder,
    deleteOrder,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
