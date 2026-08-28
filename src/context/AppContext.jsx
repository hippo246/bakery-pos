/**
 * App Context
 * Global state management using React Context API
 * Provides shared state and actions across the application
 * 
 * Now uses high-capacity IndexedDB storage for 100k+ entries and multi-device sync
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getStorageAdapter } from '../storage/StorageAdapter.js';
import { isProductionMode, isDemoMode, isSetupMode } from '../utils/runtimeMode.js';
import { getPaymentStorage } from '../payment/PaymentGateway.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [productionBatches, setProductionBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [kdsCards, setKdsCards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storageAdapter, setStorageAdapter] = useState(null);

  // Initialize storage adapter with failover
  useEffect(() => {
    const initStorage = async () => {
      try {
        const adapter = getStorageAdapter({
          useIndexedDB: true,
          enableSync: true,
          enableFailover: true
        });
        await adapter.initialize();
        setStorageAdapter(adapter);
        
        // Subscribe to failover events
        adapter.subscribe('storageSwitched', (data) => {
          console.log('[AppContext] Storage switched:', data);
          setError(`Storage switched to ${data.to} due to issues`);
          setTimeout(() => setError(null), 5000);
        });
        
        adapter.subscribe('healthCheck', (health) => {
          if (!health.healthy) {
            console.warn('[AppContext] Storage health check failed:', health.error);
          }
        });
        
        console.log('[AppContext] Storage adapter initialized with failover');
      } catch (error) {
        console.error('[AppContext] Storage adapter initialization failed:', error);
        setError('Failed to initialize storage system');
      }
    };
    initStorage();
  }, []);

  // Load data from storage on mount
  useEffect(() => {
    if (storageAdapter) {
      loadAllData();
    }
  }, [storageAdapter]);

  const loadAllData = useCallback(async () => {
    if (!storageAdapter) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Load data using the new storage adapter
      const [
        ordersData,
        customersData,
        tablesData,
        inventoryData,
        menuData,
        reservationsData
      ] = await Promise.all([
        storageAdapter.getAllItems('orders'),
        storageAdapter.getAllItems('customers'),
        storageAdapter.getAllItems('tables'),
        storageAdapter.getAllItems('inventory'),
        storageAdapter.getAllItems('menuItems'),
        storageAdapter.getAllItems('reservations')
      ]);

      setOrders(ordersData || []);
      setCustomers(customersData || []);
      setTables(tablesData || []);
      setInventory(inventoryData || []);
      setMenu(menuData || []);
      setReservations(reservationsData || []);
      
      // Load other data from LocalStorage for now (gradual migration)
      const staffData = localStorage.getItem('cafeos_staff');
      const expensesData = localStorage.getItem('cafeos_expenses');
      const deliveryData = localStorage.getItem('cafeos_delivery_orders');
      const productionData = localStorage.getItem('cafeos_production_batches');
      const suppliersData = localStorage.getItem('cafeos_suppliers');
      const purchaseData = localStorage.getItem('cafeos_purchase_orders');
      const kdsData = localStorage.getItem('cafeos_kds_cards');
      const notificationsData = localStorage.getItem('cafeos_notifications');
      const documentsData = localStorage.getItem('cafeos_documents');
      const auditData = localStorage.getItem('cafeos_audit_logs');

      if (staffData) setStaff(JSON.parse(staffData));
      if (expensesData) setExpenses(JSON.parse(expensesData));
      if (deliveryData) setDeliveryOrders(JSON.parse(deliveryData));
      if (productionData) setProductionBatches(JSON.parse(productionData));
      if (suppliersData) setSuppliers(JSON.parse(suppliersData));
      if (purchaseData) setPurchaseOrders(JSON.parse(purchaseData));
      if (kdsData) setKdsCards(JSON.parse(kdsData));
      if (notificationsData) setNotifications(JSON.parse(notificationsData));
      if (documentsData) setDocuments(JSON.parse(documentsData));
      if (auditData) setAuditLogs(JSON.parse(auditData));

      console.log('[AppContext] Data loaded successfully');
    } catch (error) {
      console.error('[AppContext] Failed to load data:', error);
      setError('Failed to load application data');
    } finally {
      setIsLoading(false);
    }
  }, [storageAdapter]);

  // Save data functions using the new storage adapter
  const saveOrders = useCallback(async (newOrders) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newOrders);
    setOrders(newOrders);
  }, [storageAdapter]);

  const saveCustomers = useCallback(async (newCustomers) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newCustomers);
    setCustomers(newCustomers);
  }, [storageAdapter]);

  const saveTables = useCallback(async (newTables) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newTables);
    setTables(newTables);
  }, [storageAdapter]);

  const saveInventory = useCallback(async (newInventory) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newInventory);
    setInventory(newInventory);
  }, [storageAdapter]);

  const saveMenu = useCallback(async (newMenu) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newMenu);
    setMenu(newMenu);
  }, [storageAdapter]);

  const saveReservations = useCallback(async (newReservations) => {
    if (!storageAdapter) return;
    await storageAdapter.setItems(newReservations);
    setReservations(newReservations);
  }, [storageAdapter]);

  // Legacy save functions for other data (still using LocalStorage during migration)
  const saveStaff = useCallback((newStaff) => {
    setStaff(newStaff);
    localStorage.setItem('cafeos_staff', JSON.stringify(newStaff));
  }, []);

  const saveExpenses = useCallback((newExpenses) => {
    setExpenses(newExpenses);
    localStorage.setItem('cafeos_expenses', JSON.stringify(newExpenses));
  }, []);

  const saveDeliveryOrders = useCallback((newDeliveryOrders) => {
    setDeliveryOrders(newDeliveryOrders);
    localStorage.setItem('cafeos_delivery_orders', JSON.stringify(newDeliveryOrders));
  }, []);

  const saveProductionBatches = useCallback((newProductionBatches) => {
    setProductionBatches(newProductionBatches);
    localStorage.setItem('cafeos_production_batches', JSON.stringify(newProductionBatches));
  }, []);

  const saveSuppliers = useCallback((newSuppliers) => {
    setSuppliers(newSuppliers);
    localStorage.setItem('cafeos_suppliers', JSON.stringify(newSuppliers));
  }, []);

  const savePurchaseOrders = useCallback((newPurchaseOrders) => {
    setPurchaseOrders(newPurchaseOrders);
    localStorage.setItem('cafeos_purchase_orders', JSON.stringify(newPurchaseOrders));
  }, []);

  const saveKdsCards = useCallback((newKdsCards) => {
    setKdsCards(newKdsCards);
    localStorage.setItem('cafeos_kds_cards', JSON.stringify(newKdsCards));
  }, []);

  const saveNotifications = useCallback((newNotifications) => {
    setNotifications(newNotifications);
    localStorage.setItem('cafeos_notifications', JSON.stringify(newNotifications));
  }, []);

  const saveDocuments = useCallback((newDocuments) => {
    setDocuments(newDocuments);
    localStorage.setItem('cafeos_documents', JSON.stringify(newDocuments));
  }, []);

  const saveAuditLogs = useCallback((newAuditLogs) => {
    setAuditLogs(newAuditLogs);
    localStorage.setItem('cafeos_audit_logs', JSON.stringify(newAuditLogs));
  }, []);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    if (!storageAdapter) return null;
    return await storageAdapter.getStats();
  }, [storageAdapter]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!storageAdapter) return null;
    return await storageAdapter.forceSync();
  }, [storageAdapter]);

  // Get connected devices
  const getConnectedDevices = useCallback(async () => {
    if (!storageAdapter) return [];
    return await storageAdapter.getConnectedDevices();
  }, [storageAdapter]);

  // Get current storage
  const getCurrentStorage = useCallback(() => {
    if (!storageAdapter) return 'unknown';
    return storageAdapter.getCurrentStorage();
  }, [storageAdapter]);

  // Force storage switch
  const forceStorageSwitch = useCallback(async (storage) => {
    if (!storageAdapter) return null;
    return await storageAdapter.forceSwitch(storage);
  }, [storageAdapter]);

  // Enable/disable auto-switch
  const setAutoSwitch = useCallback((enabled) => {
    if (!storageAdapter) return;
    storageAdapter.setAutoSwitch(enabled);
  }, [storageAdapter]);

  const value = {
    // State
    orders,
    customers,
    staff,
    tables,
    inventory,
    menu,
    reservations,
    expenses,
    deliveryOrders,
    productionBatches,
    suppliers,
    purchaseOrders,
    kdsCards,
    notifications,
    documents,
    auditLogs,
    isLoading,
    error,
    storageAdapter,

    // Save functions (using new IndexedDB storage)
    saveOrders,
    saveCustomers,
    saveTables,
    saveInventory,
    saveMenu,
    saveReservations,

    // Legacy save functions (LocalStorage during migration)
    saveStaff,
    saveExpenses,
    saveDeliveryOrders,
    saveProductionBatches,
    saveSuppliers,
    savePurchaseOrders,
    saveKdsCards,
    saveNotifications,
    saveDocuments,
    saveAuditLogs,

    // Storage and sync functions
    getStorageStats,
    forceSync,
    getConnectedDevices,
    loadAllData,
    getCurrentStorage,
    forceStorageSwitch,
    setAutoSwitch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
