/**
 * App Context
 * Global state management using React Context API
 * Provides shared state and actions across the application
 * 
 * Now uses repository layer for data persistence instead of direct localStorage
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getRepositoryFactoryInstance, isPersistenceInitialized } from '../persistence/PersistenceConfig.js';
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

  // Load data from repositories on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if persistence is initialized
      if (!isPersistenceInitialized()) {
        // In PRODUCTION mode, missing persistence is a critical error
        if (isProductionMode()) {
          setError('PRODUCTION ERROR: Persistence layer not initialized. Backend configuration required.');
          console.error('[AppContext] PRODUCTION: Persistence not initialized - cannot proceed without backend');
          setIsLoading(false);
          return;
        }
        
        // In DEMO/SETUP mode, localStorage fallback is acceptable
        console.warn('[AppContext] Persistence not initialized, using localStorage for DEMO/SETUP mode');
        loadFromLocalStorage();
        return;
      }

      const factory = getRepositoryFactoryInstance();
      
      // Inject PaymentRepository into PaymentStorage singleton
      const paymentRepository = factory.createPaymentRepository();
      getPaymentStorage(paymentRepository);
      
      // Load data from repositories
      const [ordersResult, customersResult, staffResult, tablesResult, inventoryResult, menuResult, reservationsResult, expensesResult, deliveryOrdersResult, productionBatchesResult, suppliersResult, purchaseOrdersResult, kdsCardsResult, notificationsResult, documentsResult, auditLogsResult] = await Promise.all([
        factory.createOrderRepository().findAll(),
        factory.createCustomerRepository().findAll(),
        factory.createStaffRepository().findAll(),
        factory.createTableRepository().findAll(),
        factory.createInventoryRepository().findAll(),
        factory.createMenuRepository().findAll(),
        factory.createReservationRepository().findAll(),
        factory.createExpenseRepository().findAll(),
        factory.createDeliveryRepository().findAll(),
        factory.createProductionRepository().findAll(),
        factory.createSupplierRepository().findAll(),
        factory.createPurchaseOrderRepository().findAll(),
        factory.createKDSRepository().findAll(),
        factory.createNotificationRepository().findAll(),
        factory.createDocumentRepository().findAll(),
        factory.createAuditLogRepository().findAll()
      ]);

      if (ordersResult.success) setOrders(ordersResult.data);
      if (customersResult.success) setCustomers(customersResult.data);
      if (staffResult.success) setStaff(staffResult.data);
      if (tablesResult.success) setTables(tablesResult.data);
      if (inventoryResult.success) setInventory(inventoryResult.data);
      if (menuResult.success) setMenu(menuResult.data);
      if (reservationsResult.success) setReservations(reservationsResult.data);
      if (expensesResult.success) setExpenses(expensesResult.data);
      if (deliveryOrdersResult.success) setDeliveryOrders(deliveryOrdersResult.data);
      if (productionBatchesResult.success) setProductionBatches(productionBatchesResult.data);
      if (suppliersResult.success) setSuppliers(suppliersResult.data);
      if (purchaseOrdersResult.success) setPurchaseOrders(purchaseOrdersResult.data);
      if (kdsCardsResult.success) setKdsCards(kdsCardsResult.data);
      if (notificationsResult.success) setNotifications(notificationsResult.data);
      if (documentsResult.success) setDocuments(documentsResult.data);
      if (auditLogsResult.success) setAuditLogs(auditLogsResult.data);

    } catch (err) {
      // In PRODUCTION mode, repository failure is a critical error - NO silent fallback
      if (isProductionMode()) {
        setError('PRODUCTION ERROR: Backend persistence failed. Data not saved to localStorage.');
        console.error('[AppContext] PRODUCTION: Repository failure - refusing silent localStorage fallback:', err);
        setIsLoading(false);
        return;
      }
      
      // In DEMO/SETUP mode, localStorage fallback is acceptable
      setError('Failed to load data from repository, using localStorage fallback');
      console.error('[AppContext] Failed to load data from repository, falling back to localStorage:', err);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const loadedOrders = JSON.parse(localStorage.getItem('cafeos_orders') || '[]');
      const loadedCustomers = JSON.parse(localStorage.getItem('cafeos_customers') || '[]');
      const loadedStaff = JSON.parse(localStorage.getItem('cafeos_staff') || '[]');
      const loadedTables = JSON.parse(localStorage.getItem('cafeos_tables') || '[]');
      const loadedInventory = JSON.parse(localStorage.getItem('cafeos_inventory') || '[]');
      const loadedMenu = JSON.parse(localStorage.getItem('cafeos_menu') || '[]');
      const loadedReservations = JSON.parse(localStorage.getItem('cafeos_reservations') || '[]');
      const loadedExpenses = JSON.parse(localStorage.getItem('cafeos_expenses') || '[]');
      const loadedDeliveryOrders = JSON.parse(localStorage.getItem('cafeos_delivery_orders') || '[]');
      const loadedProductionBatches = JSON.parse(localStorage.getItem('cafeos_production_batches') || '[]');
      const loadedSuppliers = JSON.parse(localStorage.getItem('cafeos_suppliers') || '[]');
      const loadedPurchaseOrders = JSON.parse(localStorage.getItem('cafeos_purchase_orders') || '[]');
      const loadedKdsCards = JSON.parse(localStorage.getItem('cafeos_kds_cards') || '[]');
      const loadedNotifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      const loadedDocuments = JSON.parse(localStorage.getItem('cafeos_documents') || '[]');
      const loadedAuditLogs = JSON.parse(localStorage.getItem('cafeos_audit_logs') || '[]');

      setOrders(loadedOrders);
      setCustomers(loadedCustomers);
      setStaff(loadedStaff);
      setTables(loadedTables);
      setInventory(loadedInventory);
      setMenu(loadedMenu);
      setReservations(loadedReservations);
      setExpenses(loadedExpenses);
      setDeliveryOrders(loadedDeliveryOrders);
      setProductionBatches(loadedProductionBatches);
      setSuppliers(loadedSuppliers);
      setPurchaseOrders(loadedPurchaseOrders);
      setKdsCards(loadedKdsCards);
      setNotifications(loadedNotifications);
      setDocuments(loadedDocuments);
      setAuditLogs(loadedAuditLogs);
    } catch (err) {
      setError('Failed to load data from localStorage');
      console.error('[AppContext] Failed to load data from localStorage:', err);
    }
  }, []);

  const saveOrders = useCallback(async (newOrders) => {
    setOrders(newOrders);
    
    // In PRODUCTION mode, must use repository - NO localStorage fallback
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save orders - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save orders to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createOrderRepository();
        // For bulk updates, we'd need a bulk upsert operation
        // For now, this is a TODO for production bulk operations
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save orders to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      // DEMO/SETUP mode: localStorage is acceptable
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
    }
  }, []);

  const saveCustomers = useCallback(async (newCustomers) => {
    setCustomers(newCustomers);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save customers - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save customers to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createCustomerRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save customers to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
    }
  }, []);

  const saveStaff = useCallback(async (newStaff) => {
    setStaff(newStaff);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save staff - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save staff to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createStaffRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save staff to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_staff', JSON.stringify(newStaff));
    }
  }, []);

  const saveTables = useCallback(async (newTables) => {
    setTables(newTables);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save tables - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save tables to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createTableRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save tables to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_tables', JSON.stringify(newTables));
    }
  }, []);

  const saveInventory = useCallback(async (newInventory) => {
    setInventory(newInventory);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save inventory - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save inventory to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createInventoryRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save inventory to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_inventory', JSON.stringify(newInventory));
    }
  }, []);

  const saveMenu = useCallback(async (newMenu) => {
    setMenu(newMenu);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save menu - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save menu to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createMenuRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save menu to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_menu', JSON.stringify(newMenu));
    }
  }, []);

  const saveReservations = useCallback(async (newReservations) => {
    setReservations(newReservations);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save reservations - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save reservations to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createReservationRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save reservations to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_reservations', JSON.stringify(newReservations));
    }
  }, []);

  const saveExpenses = useCallback(async (newExpenses) => {
    setExpenses(newExpenses);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save expenses - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save expenses to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createExpenseRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save expenses to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_expenses', JSON.stringify(newExpenses));
    }
  }, []);

  const saveDeliveryOrders = useCallback(async (newDeliveryOrders) => {
    setDeliveryOrders(newDeliveryOrders);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save delivery orders - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save delivery orders to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createDeliveryRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save delivery orders to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_delivery_orders', JSON.stringify(newDeliveryOrders));
    }
  }, []);

  const saveProductionBatches = useCallback(async (newProductionBatches) => {
    setProductionBatches(newProductionBatches);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save production batches - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save production batches to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createProductionRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save production batches to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_production_batches', JSON.stringify(newProductionBatches));
    }
  }, []);

  const saveSuppliers = useCallback(async (newSuppliers) => {
    setSuppliers(newSuppliers);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save suppliers - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save suppliers to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createSupplierRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save suppliers to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_suppliers', JSON.stringify(newSuppliers));
    }
  }, []);

  const savePurchaseOrders = useCallback(async (newPurchaseOrders) => {
    setPurchaseOrders(newPurchaseOrders);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save purchase orders - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save purchase orders to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createPurchaseOrderRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save purchase orders to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_purchase_orders', JSON.stringify(newPurchaseOrders));
    }
  }, []);

  const saveKdsCards = useCallback(async (newKdsCards) => {
    setKdsCards(newKdsCards);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save KDS cards - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save KDS cards to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createKDSRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save KDS cards to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_kds_cards', JSON.stringify(newKdsCards));
    }
  }, []);

  const saveNotifications = useCallback(async (newNotifications) => {
    setNotifications(newNotifications);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save notifications - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save notifications to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createNotificationRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save notifications to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_notifications', JSON.stringify(newNotifications));
    }
  }, []);

  const saveDocuments = useCallback(async (newDocuments) => {
    setDocuments(newDocuments);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save documents - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save documents to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createDocumentRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save documents to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_documents', JSON.stringify(newDocuments));
    }
  }, []);

  const saveAuditLogs = useCallback(async (newAuditLogs) => {
    setAuditLogs(newAuditLogs);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot save audit logs - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to save audit logs to localStorage');
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createAuditLogRepository();
        console.warn('[AppContext] Bulk save not yet implemented for production repositories');
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to save audit logs to backend');
        console.error('[AppContext] PRODUCTION: Repository save failed:', err);
        return;
      }
    } else {
      localStorage.setItem('cafeos_audit_logs', JSON.stringify(newAuditLogs));
    }
  }, []);

  const addOrder = useCallback(async (order) => {
    // Update UI state immediately
    setOrders(prev => [...prev, order]);
    
    // In PRODUCTION mode, must use repository - NO localStorage fallback
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot add order - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to add order to localStorage');
        // Revert UI state since save failed
        setOrders(prev => prev.filter(o => o.id !== order.id));
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createOrderRepository();
        await repo.create(order);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to add order to backend');
        console.error('[AppContext] PRODUCTION: Repository create failed:', err);
        // Revert UI state since save failed
        setOrders(prev => prev.filter(o => o.id !== order.id));
        return;
      }
    } else {
      // DEMO/SETUP mode: localStorage is acceptable
      localStorage.setItem('cafeos_orders', JSON.stringify([...orders, order]));
    }
  }, [orders]);

  const updateOrder = useCallback(async (orderId, updates) => {
    const oldOrders = [...orders];
    
    // Update UI state immediately
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ));
    
    // In PRODUCTION mode, must use repository - NO localStorage fallback
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot update order - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to update order in localStorage');
        setOrders(oldOrders);
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createOrderRepository();
        await repo.update(orderId, updates);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to update order in backend');
        console.error('[AppContext] PRODUCTION: Repository update failed:', err);
        setOrders(oldOrders);
        return;
      }
    } else {
      // DEMO/SETUP mode: localStorage is acceptable
      const newOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      );
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
    }
  }, [orders]);

  const deleteOrder = useCallback(async (orderId) => {
    const oldOrders = [...orders];
    
    // Update UI state immediately
    setOrders(prev => prev.filter(order => order.id !== orderId));
    
    // In PRODUCTION mode, must use repository - NO localStorage fallback
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot delete order - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to delete order in localStorage');
        setOrders(oldOrders);
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createOrderRepository();
        await repo.delete(orderId);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to delete order in backend');
        console.error('[AppContext] PRODUCTION: Repository delete failed:', err);
        setOrders(oldOrders);
        return;
      }
    } else {
      // DEMO/SETUP mode: localStorage is acceptable
      const newOrders = orders.filter(order => order.id !== orderId);
      localStorage.setItem('cafeos_orders', JSON.stringify(newOrders));
    }
  }, [orders]);

  const addCustomer = useCallback(async (customer) => {
    setCustomers(prev => [...prev, customer]);
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot add customer - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to add customer to localStorage');
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createCustomerRepository();
        await repo.create(customer);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to add customer to backend');
        console.error('[AppContext] PRODUCTION: Repository create failed:', err);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        return;
      }
    } else {
      localStorage.setItem('cafeos_customers', JSON.stringify([...customers, customer]));
    }
  }, [customers]);

  const updateCustomer = useCallback(async (customerId, updates) => {
    const oldCustomers = [...customers];
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId ? { ...customer, ...updates } : customer
    ));
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot update customer - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to update customer in localStorage');
        setCustomers(oldCustomers);
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createCustomerRepository();
        await repo.update(customerId, updates);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to update customer in backend');
        console.error('[AppContext] PRODUCTION: Repository update failed:', err);
        setCustomers(oldCustomers);
        return;
      }
    } else {
      const newCustomers = customers.map(customer => 
        customer.id === customerId ? { ...customer, ...updates } : customer
      );
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
    }
  }, [customers]);

  const deleteCustomer = useCallback(async (customerId) => {
    const oldCustomers = [...customers];
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    
    if (isProductionMode()) {
      if (!isPersistenceInitialized()) {
        setError('PRODUCTION ERROR: Cannot delete customer - persistence not initialized');
        console.error('[AppContext] PRODUCTION: Refusing to delete customer in localStorage');
        setCustomers(oldCustomers);
        return;
      }
      
      try {
        const factory = getRepositoryFactoryInstance();
        const repo = factory.createCustomerRepository();
        await repo.delete(customerId);
      } catch (err) {
        setError('PRODUCTION ERROR: Failed to delete customer in backend');
        console.error('[AppContext] PRODUCTION: Repository delete failed:', err);
        setCustomers(oldCustomers);
        return;
      }
    } else {
      const newCustomers = customers.filter(customer => customer.id !== customerId);
      localStorage.setItem('cafeos_customers', JSON.stringify(newCustomers));
    }
  }, [customers]);

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

    // Actions
    loadAllData,
    saveOrders,
    saveCustomers,
    saveStaff,
    saveTables,
    saveInventory,
    saveMenu,
    saveReservations,
    saveExpenses,
    saveDeliveryOrders,
    saveProductionBatches,
    saveSuppliers,
    savePurchaseOrders,
    saveKdsCards,
    saveNotifications,
    saveDocuments,
    saveAuditLogs,
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
