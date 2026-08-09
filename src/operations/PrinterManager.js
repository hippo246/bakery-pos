// Printer Auto-Recovery
// Detect printer disconnection, auto-retry print jobs, fallback to thermal printer, print queue management

export class PrinterManager {
  constructor(options = {}) {
    this.options = {
      retryInterval: options.retryInterval || 3000, // 3 seconds
      maxRetries: options.maxRetries || 3,
      queueSize: options.queueSize || 50,
      autoRetryEnabled: options.autoRetryEnabled !== false,
      fallbackEnabled: options.fallbackEnabled !== false,
      ...options
    };
    
    this.printers = new Map();
    this.printQueue = [];
    this.retryCount = new Map();
    this.eventHandlers = new Map();
    this.isProcessingQueue = false;
    this.loadPrinterState();
  }

  /**
   * Load printer state from localStorage
   */
  loadPrinterState() {
    try {
      const stored = localStorage.getItem('cafeos_printer_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.printers = new Map(state.printers || []);
        this.printQueue = state.printQueue || [];
        this.retryCount = new Map(state.retryCount || []);
      }
    } catch (error) {
      console.error('[PrinterManager] Failed to load printer state:', error);
    }
  }

  /**
   * Save printer state to localStorage
   */
  savePrinterState() {
    try {
      const state = {
        printers: Array.from(this.printers),
        printQueue: this.printQueue,
        retryCount: Array.from(this.retryCount)
      };
      
      localStorage.setItem('cafeos_printer_state', JSON.stringify(state));
    } catch (error) {
      console.error('[PrinterManager] Failed to save printer state:', error);
    }
  }

  /**
   * Register printer
   */
  registerPrinter(printerId, config) {
    const printer = {
      id: printerId,
      name: config.name || printerId,
      type: config.type || 'thermal', // 'thermal', 'inkjet', 'laser'
      connection: config.connection || 'usb', // 'usb', 'bluetooth', 'network'
      isPrimary: config.isPrimary || false,
      isFallback: config.isFallback || false,
      status: 'unknown',
      lastSeen: null,
      config
    };
    
    this.printers.set(printerId, printer);
    this.savePrinterState();
    
    console.log(`[PrinterManager] Registered printer: ${printerId}`);
    
    // Check printer status
    this.checkPrinterStatus(printerId);
  }

  /**
   * Unregister printer
   */
  unregisterPrinter(printerId) {
    this.printers.delete(printerId);
    this.savePrinterState();
    
    console.log(`[PrinterManager] Unregistered printer: ${printerId}`);
  }

  /**
   * Check printer status
   */
  async checkPrinterStatus(printerId) {
    const printer = this.printers.get(printerId);
    
    if (!printer) {
      return null;
    }
    
    try {
      // In a real implementation, this would check the actual printer status
      // For now, we'll simulate it
      const isAvailable = await this.checkPrinterConnection(printer);
      
      printer.status = isAvailable ? 'online' : 'offline';
      printer.lastSeen = isAvailable ? Date.now() : printer.lastSeen;
      
      this.savePrinterState();
      
      this.emit('printerStatusChanged', {
        printerId,
        status: printer.status
      });
      
      return printer.status;
    } catch (error) {
      console.error(`[PrinterManager] Failed to check printer ${printerId}:`, error);
      
      printer.status = 'error';
      this.savePrinterState();
      
      return 'error';
    }
  }

  /**
   * Check printer connection
   */
  async checkPrinterConnection(printer) {
    // This would use WebUSB, Web Bluetooth, or network APIs
    // For now, simulate connection check
    return true;
  }

  /**
   * Print to printer
   */
  async print(printerId, printData, options = {}) {
    const printer = this.printers.get(printerId);
    
    if (!printer) {
      throw new Error(`Printer not found: ${printerId}`);
    }
    
    const printJob = {
      id: this.generatePrintJobId(),
      printerId,
      data: printData,
      options,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };
    
    try {
      // Check printer status
      const printerStatus = await this.checkPrinterStatus(printerId);
      
      if (printerStatus !== 'online') {
        throw new Error(`Printer is ${printerStatus}`);
      }
      
      // Attempt print
      const result = await this.executePrint(printer, printData);
      
      printJob.status = 'completed';
      printJob.completedAt = Date.now();
      
      this.emit('printCompleted', { printJob, result });
      
      return { success: true, printJob };
    } catch (error) {
      printJob.status = 'failed';
      printJob.error = error.message;
      
      console.error(`[PrinterManager] Print failed:`, error);
      
      // Queue for retry if enabled
      if (this.options.autoRetryEnabled && printJob.retryCount < this.options.maxRetries) {
        this.queuePrintJob(printJob);
      }
      
      // Try fallback printer if enabled
      if (this.options.fallbackEnabled) {
        const fallbackResult = await this.tryFallbackPrinter(printJob);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
      
      this.emit('printFailed', { printJob, error });
      
      return { success: false, error: error.message, printJob };
    }
  }

  /**
   * Execute print operation
   */
  async executePrint(printer, printData) {
    // This would use the actual printer API
    // For now, simulate print
    console.log(`[PrinterManager] Printing to ${printer.id}:`, printData);
    
    // Simulate print delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  /**
   * Queue print job for retry
   */
  queuePrintJob(printJob) {
    printJob.retryCount++;
    printJob.status = 'queued';
    
    this.printQueue.push(printJob);
    
    // Limit queue size
    if (this.printQueue.length > this.options.queueSize) {
      this.printQueue.shift();
    }
    
    this.savePrinterState();
    
    console.log(`[PrinterManager] Queued print job: ${printJob.id} (retry ${printJob.retryCount})`);
    
    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process print queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.printQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.printQueue.length > 0) {
      const printJob = this.printQueue.shift();
      
      try {
        console.log(`[PrinterManager] Processing queued print job: ${printJob.id}`);
        
        const result = await this.print(printJob.printerId, printJob.data, printJob.options);
        
        if (result.success) {
          this.emit('queueJobCompleted', { printJobId: printJob.id });
        } else {
          // Re-queue if still under max retries
          if (printJob.retryCount < this.options.maxRetries) {
            this.printQueue.unshift(printJob);
            await this.delay(this.options.retryInterval);
          } else {
            this.emit('queueJobFailed', { printJobId: printJob.id });
          }
        }
      } catch (error) {
        console.error(`[PrinterManager] Failed to process queued job: ${printJob.id}`, error);
        
        // Re-queue if still under max retries
        if (printJob.retryCount < this.options.maxRetries) {
          this.printQueue.unshift(printJob);
          await this.delay(this.options.retryInterval);
        } else {
          this.emit('queueJobFailed', { printJobId: printJob.id });
        }
      }
    }
    
    this.isProcessingQueue = false;
    this.savePrinterState();
  }

  /**
   * Try fallback printer
   */
  async tryFallbackPrinter(originalJob) {
    const fallbackPrinter = this.getFallbackPrinter();
    
    if (!fallbackPrinter) {
      return { success: false, error: 'No fallback printer available' };
    }
    
    console.log(`[PrinterManager] Trying fallback printer: ${fallbackPrinter.id}`);
    
    try {
      const result = await this.print(fallbackPrinter.id, originalJob.data, originalJob.options);
      
      if (result.success) {
        this.emit('fallbackUsed', {
          originalPrinter: originalJob.printerId,
          fallbackPrinter: fallbackPrinter.id
        });
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get fallback printer
   */
  getFallbackPrinter() {
    for (const [printerId, printer] of this.printers) {
      if (printer.isFallback && printer.status === 'online') {
        return printer;
      }
    }
    
    // If no dedicated fallback, try any other online printer
    for (const [printerId, printer] of this.printers) {
      if (!printer.isPrimary && printer.status === 'online') {
        return printer;
      }
    }
    
    return null;
  }

  /**
   * Get primary printer
   */
  getPrimaryPrinter() {
    for (const [printerId, printer] of this.printers) {
      if (printer.isPrimary) {
        return printer;
      }
    }
    
    // If no primary, return first printer
    const firstPrinter = this.printers.values().next().value;
    return firstPrinter;
  }

  /**
   * Get all printers
   */
  getAllPrinters() {
    return Array.from(this.printers.values());
  }

  /**
   * Get online printers
   */
  getOnlinePrinters() {
    return this.getAllPrinters().filter(p => p.status === 'online');
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.printQueue.length,
      isProcessing: this.isProcessingQueue,
      jobs: this.printQueue
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    const clearedCount = this.printQueue.length;
    this.printQueue = [];
    this.savePrinterState();
    
    this.emit('queueCleared', { clearedCount });
    
    return clearedCount;
  }

  /**
   * Check all printers
   */
  async checkAllPrinters() {
    const results = {};
    
    for (const printerId of this.printers.keys()) {
      results[printerId] = await this.checkPrinterStatus(printerId);
    }
    
    return results;
  }

  /**
   * Generate unique print job ID
   */
  generatePrintJobId() {
    return `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update printer configuration
   */
  updatePrinterConfig(printerId, config) {
    const printer = this.printers.get(printerId);
    
    if (printer) {
      Object.assign(printer, config);
      this.savePrinterState();
      
      this.emit('printerConfigUpdated', { printerId, config });
    }
  }

  /**
   * Set printer as primary
   */
  setPrimaryPrinter(printerId) {
    this.printers.forEach((printer) => {
      printer.isPrimary = (printer.id === printerId);
    });
    
    this.savePrinterState();
    
    this.emit('primaryPrinterChanged', { printerId });
  }

  /**
   * Set printer as fallback
   */
  setFallbackPrinter(printerId) {
    this.printers.forEach((printer) => {
      printer.isFallback = (printer.id === printerId);
    });
    
    this.savePrinterState();
    
    this.emit('fallbackPrinterChanged', { printerId });
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[PrinterManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the printer manager
   */
  destroy() {
    this.clearQueue();
    this.printers.clear();
    this.retryCount.clear();
    this.eventHandlers.clear();
    console.log('[PrinterManager] Destroyed');
  }
}

// Singleton instance
let printerManagerInstance = null;

/**
 * Get the singleton printer manager instance
 */
export function getPrinterManager(options = {}) {
  if (!printerManagerInstance) {
    printerManagerInstance = new PrinterManager(options);
  }
  return printerManagerInstance;
}

export default PrinterManager;
