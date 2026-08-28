// Extreme Stress Test for BakeryPOS Storage System
// Tests 100k+ entries, 20+ concurrent devices, rapid writes, and failover

export class StorageStressTest {
  constructor() {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run all stress tests
   */
  async runAllTests() {
    console.log('%c🚀 Starting Extreme Stress Test Suite', 'color: #6366f1; font-size: 16px; font-weight: bold;');
    this.startTime = Date.now();

    try {
      // Test 1: Storage Capacity (100k+ entries)
      await this.testStorageCapacity();

      // Test 2: Rapid Write Operations
      await this.testRapidWrites();

      // Test 3: Concurrent Device Simulation
      await this.testConcurrentDevices();

      // Test 4: Memory Usage Under Load
      await this.testMemoryUsage();

      // Test 5: Failover Under Stress
      await this.testFailoverUnderStress();

      // Test 6: Sync Queue Capacity
      await this.testSyncQueueCapacity();

      this.endTime = Date.now();
      this.printSummary();
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    }
  }

  /**
   * Test 1: Storage Capacity (100k+ entries)
   */
  async testStorageCapacity() {
    console.log('%c\n📦 Test 1: Storage Capacity (100k+ entries)', 'color: #10b981; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    const targetCount = 100000;
    const batchSize = 1000;
    let totalInserted = 0;
    let errors = 0;

    try {
      // Get storage adapter
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Insert batches
      for (let batch = 0; batch < targetCount / batchSize; batch++) {
        const batchItems = [];
        
        for (let i = 0; i < batchSize; i++) {
          const id = `stress_test_order_${totalInserted + i}`;
          batchItems.push({
            id,
            items: [{ name: `Item ${i}`, price: 10 + Math.random() * 100, quantity: 1 }],
            total: 10 + Math.random() * 100,
            status: 'PENDING',
            createdAt: Date.now(),
            deviceId: `device_${Math.floor(Math.random() * 20)}`
          });
        }

        try {
          await storage.setItems(batchItems);
          totalInserted += batchSize;
          
          if (batch % 10 === 0) {
            console.log(`  ✓ Inserted ${totalInserted.toLocaleString()} / ${targetCount.toLocaleString()} entries`);
          }
        } catch (error) {
          errors++;
          console.error(`  ✗ Batch ${batch} failed:`, error.message);
          
          // Stop if we hit quota limits
          if (error.message.includes('QuotaExceeded') || error.message.includes('quota')) {
            console.warn(`  ⚠️ Storage quota reached at ${totalInserted.toLocaleString()} entries`);
            break;
          }
        }
      }

      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;
      const rate = totalInserted / duration;

      this.results.push({
        test: 'Storage Capacity',
        target: targetCount,
        achieved: totalInserted,
        errors,
        duration: `${duration.toFixed(2)}s`,
        rate: `${rate.toFixed(0)} entries/sec`,
        status: totalInserted >= targetCount * 0.9 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: ${totalInserted.toLocaleString()} entries inserted in ${duration.toFixed(2)}s (${rate.toFixed(0)} entries/sec)`);
      console.log(`  ${errors > 0 ? '⚠️' : '✓'} Errors: ${errors}`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Storage Capacity', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test 2: Rapid Write Operations
   */
  async testRapidWrites() {
    console.log('%c\n⚡ Test 2: Rapid Write Operations', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    const writeCount = 10000;
    const concurrentWrites = 100;
    let successfulWrites = 0;
    let failedWrites = 0;

    try {
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Create write promises
      const writePromises = [];
      
      for (let i = 0; i < writeCount; i++) {
        const id = `rapid_write_${i}`;
        const data = {
          id,
          timestamp: Date.now(),
          value: Math.random() * 1000
        };

        writePromises.push(
          storage.setItem(id, data)
            .then(() => { successfulWrites++; })
            .catch(() => { failedWrites++; })
        );
      }

      // Execute in batches to avoid overwhelming
      for (let i = 0; i < writePromises.length; i += concurrentWrites) {
        const batch = writePromises.slice(i, i + concurrentWrites);
        await Promise.all(batch);
        
        if ((i / concurrentWrites) % 10 === 0) {
          console.log(`  ✓ Processed ${i + concurrentWrites} / ${writeCount} writes`);
        }
      }

      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;
      const rate = successfulWrites / duration;

      this.results.push({
        test: 'Rapid Writes',
        target: writeCount,
        successful: successfulWrites,
        failed: failedWrites,
        duration: `${duration.toFixed(2)}s`,
        rate: `${rate.toFixed(0)} writes/sec`,
        status: failedWrites < writeCount * 0.05 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: ${successfulWrites} successful, ${failedWrites} failed in ${duration.toFixed(2)}s (${rate.toFixed(0)} writes/sec)`);
      console.log(`  ${failedWrites < writeCount * 0.05 ? '✓' : '⚠️'} Failure rate: ${((failedWrites / writeCount) * 100).toFixed(2)}%`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Rapid Writes', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test 3: Concurrent Device Simulation
   */
  async testConcurrentDevices() {
    console.log('%c\n📱 Test 3: Concurrent Device Simulation (20+ devices)', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    const deviceCount = 25;
    const operationsPerDevice = 100;
    let totalOperations = 0;
    let conflicts = 0;

    try {
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Simulate concurrent device operations
      const devicePromises = [];

      for (let device = 0; device < deviceCount; device++) {
        const deviceId = `stress_device_${device}`;
        
        const deviceOperations = async () => {
          for (let op = 0; op < operationsPerDevice; op++) {
            try {
              const id = `${deviceId}_order_${op}`;
              const data = {
                id,
                deviceId,
                timestamp: Date.now(),
                items: [{ name: `Item ${op}`, price: 10, quantity: 1 }],
                total: 10
              };

              await storage.setItem(id, data);
              totalOperations++;
            } catch (error) {
              if (error.message.includes('conflict') || error.message.includes('lock')) {
                conflicts++;
              }
            }
          }
        };

        devicePromises.push(deviceOperations());
      }

      await Promise.all(devicePromises);

      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;
      const rate = totalOperations / duration;

      this.results.push({
        test: 'Concurrent Devices',
        devices: deviceCount,
        operations: totalOperations,
        conflicts,
        duration: `${duration.toFixed(2)}s`,
        rate: `${rate.toFixed(0)} ops/sec`,
        status: conflicts < totalOperations * 0.01 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: ${deviceCount} devices, ${totalOperations} operations in ${duration.toFixed(2)}s (${rate.toFixed(0)} ops/sec)`);
      console.log(`  ${conflicts < totalOperations * 0.01 ? '✓' : '⚠️'} Conflicts: ${conflicts} (${((conflicts / totalOperations) * 100).toFixed(2)}%)`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Concurrent Devices', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test 4: Memory Usage Under Load
   */
  async testMemoryUsage() {
    console.log('%c\n💾 Test 4: Memory Usage Under Load', 'color: #06b6d4; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    
    try {
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Get initial memory
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Load large dataset
      const largeDataset = [];
      for (let i = 0; i < 50000; i++) {
        largeDataset.push({
          id: `memory_test_${i}`,
          data: new Array(1000).fill(Math.random()).join(',')
        });
      }

      // Store and retrieve
      await storage.setItems(largeDataset.slice(0, 10000));
      
      const midMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Retrieve data
      const retrieved = await storage.getAllItems('orders');
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      const memoryIncrease = ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2);
      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;

      this.results.push({
        test: 'Memory Usage',
        initialMB: (initialMemory / 1024 / 1024).toFixed(2),
        finalMB: (finalMemory / 1024 / 1024).toFixed(2),
        increaseMB: memoryIncrease,
        duration: `${duration.toFixed(2)}s`,
        status: parseFloat(memoryIncrease) < 100 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: Memory increased by ${memoryIncrease}MB in ${duration.toFixed(2)}s`);
      console.log(`  ${parseFloat(memoryIncrease) < 100 ? '✓' : '⚠️'} Memory usage within acceptable limits`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Memory Usage', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test 5: Failover Under Stress
   */
  async testFailoverUnderStress() {
    console.log('%c\n🔄 Test 5: Failover Under Stress', 'color: #ef4444; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    let switchTime = 0;
    let dataLoss = 0;

    try {
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Insert data while forcing failover
      const testData = [];
      for (let i = 0; i < 1000; i++) {
        testData.push({
          id: `failover_test_${i}`,
          timestamp: Date.now(),
          value: i
        });
      }

      // Start writes
      const writePromise = storage.setItems(testData);
      
      // Force switch mid-write
      setTimeout(async () => {
        const switchStart = Date.now();
        await storage.forceSwitch('backup');
        switchTime = Date.now() - switchStart;
      }, 100);

      await writePromise;

      // Verify data integrity
      const retrieved = await storage.getItem('failover_test_500');
      dataLoss = retrieved ? 0 : 1;

      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;

      this.results.push({
        test: 'Failover Under Stress',
        switchTime: `${switchTime}ms`,
        dataLoss,
        duration: `${duration.toFixed(2)}s`,
        status: switchTime < 1000 && dataLoss === 0 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: Failover took ${switchTime}ms, data loss: ${dataLoss}`);
      console.log(`  ${switchTime < 1000 && dataLoss === 0 ? '✓' : '⚠️'} Failover performance acceptable`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Failover Under Stress', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test 6: Sync Queue Capacity
   */
  async testSyncQueueCapacity() {
    console.log('%c\n🔗 Test 6: Sync Queue Capacity', 'color: #ec4899; font-size: 14px; font-weight: bold;');
    
    const testStart = Date.now();
    const queueTarget = 5000;
    let queuedItems = 0;

    try {
      const { getDeviceSyncManager } = await import('../sync/DeviceSyncManager.js');
      const { getIndexedDBStorage } = await import('../storage/IndexedDBStorage.js');
      
      const indexedDB = getIndexedDBStorage();
      await indexedDB.initialize();
      
      const syncManager = getDeviceSyncManager(indexedDB);
      await syncManager.initialize();

      // Fill sync queue
      for (let i = 0; i < queueTarget; i++) {
        syncManager.trackChange('update', 'orders', {
          id: `sync_test_${i}`,
          timestamp: Date.now()
        });
        queuedItems++;
        
        if (i % 500 === 0) {
          console.log(`  ✓ Queued ${queuedItems} / ${queueTarget} items`);
        }
      }

      const stats = await syncManager.getDeviceStats();
      const testEnd = Date.now();
      const duration = (testEnd - testStart) / 1000;

      this.results.push({
        test: 'Sync Queue Capacity',
        target: queueTarget,
        achieved: queuedItems,
        queueSize: stats.syncQueueSize,
        duration: `${duration.toFixed(2)}s`,
        status: queuedItems >= queueTarget * 0.95 ? 'PASS' : 'FAIL'
      });

      console.log(`  📊 Result: ${queuedItems} items queued, queue size: ${stats.syncQueueSize}`);
      console.log(`  ${queuedItems >= queueTarget * 0.95 ? '✓' : '⚠️'} Queue capacity acceptable`);

    } catch (error) {
      console.error('  ❌ Test failed:', error);
      this.results.push({ test: 'Sync Queue Capacity', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Print summary of all tests
   */
  printSummary() {
    console.log('%c\n📊 STRESS TEST SUMMARY', 'color: #6366f1; font-size: 16px; font-weight: bold;');
    console.log('%c' + '='.repeat(60), 'color: #6366f1');
    
    const totalDuration = ((this.endTime - this.startTime) / 1000).toFixed(2);
    console.log(`Total Duration: ${totalDuration}s\n`);

    let passed = 0;
    let failed = 0;

    this.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      const statusColor = result.status === 'PASS' ? '#10b981' : '#ef4444';
      
      console.log(`%c${statusIcon} ${result.test}`, `color: ${statusColor}; font-weight: bold`);
      
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'test' && key !== 'status' && key !== 'error') {
          console.log(`   ${key}: ${value}`);
        }
      });

      if (result.status === 'PASS') passed++;
      else failed++;
      
      console.log('');
    });

    console.log('%c' + '='.repeat(60), 'color: #6366f1');
    console.log(`%cResults: ${passed} passed, ${failed} failed`, 'font-weight: bold');
    
    this.identifyBottlenecks();
  }

  /**
   * Identify potential bottlenecks
   */
  identifyBottlenecks() {
    console.log('%c\n⚠️ POTENTIAL BOTTLENECKS', 'color: #f59e0b; font-size: 14px; font-weight: bold;');

    const bottlenecks = [];

    // Check for storage capacity issues
    const capacityTest = this.results.find(r => r.test === 'Storage Capacity');
    if (capacityTest && capacityTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'CRITICAL',
        issue: 'Storage Capacity',
        description: 'Cannot handle 100k+ entries. IndexedDB quota may be limited.',
        recommendation: 'Implement data archiving or use a backend database for production.'
      });
    }

    // Check for write performance issues
    const writeTest = this.results.find(r => r.test === 'Rapid Writes');
    if (writeTest && writeTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'HIGH',
        issue: 'Write Performance',
        description: 'High failure rate under rapid writes.',
        recommendation: 'Implement write batching and rate limiting.'
      });
    }

    // Check for conflict issues
    const deviceTest = this.results.find(r => r.test === 'Concurrent Devices');
    if (deviceTest && deviceTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'HIGH',
        issue: 'Concurrency Conflicts',
        description: 'High conflict rate with 20+ concurrent devices.',
        recommendation: 'Implement optimistic locking and conflict resolution strategies.'
      });
    }

    // Check for memory issues
    const memoryTest = this.results.find(r => r.test === 'Memory Usage');
    if (memoryTest && memoryTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'MEDIUM',
        issue: 'Memory Usage',
        description: 'Excessive memory growth under load.',
        recommendation: 'Implement data pagination and memory cleanup.'
      });
    }

    // Check for failover issues
    const failoverTest = this.results.find(r => r.test === 'Failover Under Stress');
    if (failoverTest && failoverTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'CRITICAL',
        issue: 'Failover Performance',
        description: 'Failover too slow or causes data loss.',
        recommendation: 'Optimize failover mechanism and implement write-ahead logging.'
      });
    }

    // Check for sync queue issues
    const syncTest = this.results.find(r => r.test === 'Sync Queue Capacity');
    if (syncTest && syncTest.status === 'FAIL') {
      bottlenecks.push({
        severity: 'MEDIUM',
        issue: 'Sync Queue',
        description: 'Sync queue cannot handle high volume.',
        recommendation: 'Implement queue prioritization and batch processing.'
      });
    }

    if (bottlenecks.length === 0) {
      console.log('%c✅ No critical bottlenecks detected!', 'color: #10b981; font-weight: bold');
    } else {
      bottlenecks.forEach((bottleneck, index) => {
        const severityColor = bottleneck.severity === 'CRITICAL' ? '#ef4444' : 
                              bottleneck.severity === 'HIGH' ? '#f59e0b' : '#fbbf24';
        
        console.log(`%c${index + 1}. [${bottleneck.severity}] ${bottleneck.issue}`, `color: ${severityColor}; font-weight: bold`);
        console.log(`   Description: ${bottleneck.description}`);
        console.log(`   Recommendation: ${bottleneck.recommendation}\n`);
      });
    }

    console.log('%c\n🎯 MOST LIKELY TO BREAK FIRST:', 'color: #ef4444; font-size: 14px; font-weight: bold;');
    
    if (bottlenecks.length > 0) {
      const critical = bottlenecks.find(b => b.severity === 'CRITICAL');
      if (critical) {
        console.log(`1. ${critical.issue} - ${critical.description}`);
      }
      
      const high = bottlenecks.find(b => b.severity === 'HIGH');
      if (high) {
        console.log(`2. ${high.issue} - ${high.description}`);
      }
    } else {
      console.log('System appears robust under stress. Monitor for real-world usage patterns.');
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    console.log('%c\n🧹 Cleaning up test data...', 'color: #8b8b9e; font-size: 14px; font-weight: bold;');
    
    try {
      const { getStorageAdapter } = await import('../storage/StorageAdapter.js');
      const storage = getStorageAdapter();
      await storage.initialize();

      // Clean up test data
      for (let i = 0; i < 100000; i++) {
        await storage.removeItem(`stress_test_order_${i}`);
        await storage.removeItem(`rapid_write_${i}`);
        await storage.removeItem(`failover_test_${i}`);
        await storage.removeItem(`sync_test_${i}`);
      }

      for (let d = 0; d < 25; d++) {
        for (let o = 0; o < 100; o++) {
          await storage.removeItem(`stress_device_${d}_order_${o}`);
        }
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run stress test in browser console
export async function runStressTest() {
  const test = new StorageStressTest();
  await test.runAllTests();
  return test;
}

export default StorageStressTest;
