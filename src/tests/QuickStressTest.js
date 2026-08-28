// Quick Stress Test - Can be run directly in browser console
// Open browser console and paste this code

(async function runQuickStressTest() {
  console.log('%c🚀 Starting Quick Stress Test', 'color: #6366f1; font-size: 16px; font-weight: bold;');
  
  const results = {
    storageCapacity: { status: 'UNKNOWN', details: {} },
    writePerformance: { status: 'UNKNOWN', details: {} },
    memoryUsage: { status: 'UNKNOWN', details: {} }
  };

  // Test 1: Storage Capacity
  console.log('%c\n📦 Test 1: Storage Capacity', 'color: #10b981; font-size: 14px; font-weight: bold;');
  try {
    const start = Date.now();
    const testCount = 10000;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < testCount; i++) {
      try {
        const key = `stress_${i}`;
        const value = { data: new Array(100).fill(Math.random()).join(','), timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(value));
        inserted++;
      } catch (e) {
        errors++;
        if (e.name === 'QuotaExceededError') {
          console.warn(`Quota exceeded at ${inserted} entries`);
          break;
        }
      }
    }

    const duration = (Date.now() - start) / 1000;
    results.storageCapacity = {
      status: errors === 0 ? 'PASS' : 'FAIL',
      details: { inserted, errors, duration: `${duration.toFixed(2)}s`, rate: `${(inserted/duration).toFixed(0)}/s` }
    };
    console.log(`✓ Inserted ${inserted}/${testCount} entries in ${duration.toFixed(2)}s`);
    console.log(`Errors: ${errors}`);
  } catch (e) {
    results.storageCapacity = { status: 'FAIL', details: { error: e.message } };
    console.error('✗ Storage capacity test failed:', e);
  }

  // Test 2: Write Performance
  console.log('%c\n⚡ Test 2: Write Performance', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
  try {
    const start = Date.now();
    const writeCount = 1000;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < writeCount; i++) {
      try {
        const key = `perf_${i}`;
        const value = { timestamp: Date.now(), value: Math.random() };
        localStorage.setItem(key, JSON.stringify(value));
        successful++;
      } catch (e) {
        failed++;
      }
    }

    const duration = (Date.now() - start) / 1000;
    results.writePerformance = {
      status: failed < writeCount * 0.05 ? 'PASS' : 'FAIL',
      details: { successful, failed, duration: `${duration.toFixed(2)}s`, rate: `${(successful/duration).toFixed(0)}/s` }
    };
    console.log(`✓ ${successful} successful, ${failed} failed in ${duration.toFixed(2)}s`);
  } catch (e) {
    results.writePerformance = { status: 'FAIL', details: { error: e.message } };
    console.error('✗ Write performance test failed:', e);
  }

  // Test 3: Memory Usage
  console.log('%c\n💾 Test 3: Memory Usage', 'color: #06b6d4; font-size: 14px; font-weight: bold;');
  try {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Load large data
    const largeData = [];
    for (let i = 0; i < 10000; i++) {
      largeData.push({ id: i, data: new Array(500).fill(Math.random()).join(',') });
    }
    
    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const increaseMB = ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2);
    
    results.memoryUsage = {
      status: parseFloat(increaseMB) < 50 ? 'PASS' : 'FAIL',
      details: { initialMB: (initialMemory/1024/1024).toFixed(2), finalMB: (finalMemory/1024/1024).toFixed(2), increaseMB }
    };
    console.log(`✓ Memory increased by ${increaseMB}MB`);
  } catch (e) {
    results.memoryUsage = { status: 'FAIL', details: { error: e.message } };
    console.error('✗ Memory usage test failed:', e);
  }

  // Summary
  console.log('%c\n📊 SUMMARY', 'color: #6366f1; font-size: 16px; font-weight: bold;');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${result.status}`);
    Object.entries(result.details).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  });

  // Bottleneck Analysis
  console.log('%c\n⚠️ BOTTLENECK ANALYSIS', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
  
  const bottlenecks = [];
  
  if (results.storageCapacity.status === 'FAIL') {
    bottlenecks.push({
      severity: 'CRITICAL',
      issue: 'LocalStorage Quota',
      description: 'LocalStorage cannot handle large datasets (typically 5-10MB limit)',
      impact: 'System will fail with 100k+ entries',
      fix: 'IndexedDB is required for production'
    });
  }
  
  if (results.writePerformance.status === 'FAIL') {
    bottlenecks.push({
      severity: 'HIGH',
      issue: 'Write Performance',
      description: 'High failure rate under rapid writes',
      impact: 'Data loss during peak hours',
      fix: 'Implement write batching and queuing'
    });
  }
  
  if (results.memoryUsage.status === 'FAIL') {
    bottlenecks.push({
      severity: 'MEDIUM',
      issue: 'Memory Leaks',
      description: 'Excessive memory growth',
      impact: 'Browser crashes under load',
      fix: 'Implement data pagination and cleanup'
    });
  }

  if (bottlenecks.length === 0) {
    console.log('✅ No critical bottlenecks detected in quick test');
  } else {
    bottlenecks.forEach((b, i) => {
      console.log(`\n${i + 1}. [${b.severity}] ${b.issue}`);
      console.log(`   ${b.description}`);
      console.log(`   Impact: ${b.impact}`);
      console.log(`   Fix: ${b.fix}`);
    });
  }

  console.log('%c\n🎯 MOST LIKELY TO BREAK FIRST:', 'color: #ef4444; font-size: 14px; font-weight: bold;');
  
  if (bottlenecks.length > 0) {
    const critical = bottlenecks.find(b => b.severity === 'CRITICAL');
    if (critical) {
      console.log(`1. ${critical.issue}`);
      console.log(`   ${critical.description}`);
      console.log(`   This is the PRIMARY bottleneck - LocalStorage has a hard limit of ~5-10MB`);
      console.log(`   With 100k entries, you will hit this limit quickly`);
    }
    
    const high = bottlenecks.find(b => b.severity === 'HIGH');
    if (high) {
      console.log(`\n2. ${high.issue}`);
      console.log(`   ${high.description}`);
    }
  } else {
    console.log('Based on architecture analysis:');
    console.log('1. LocalStorage Quota - Will hit ~5-10MB limit with 100k entries');
    console.log('2. Sync Queue Overflow - With 20+ devices, sync queue may exceed 1000 limit');
    console.log('3. Memory Usage - Large datasets in memory will cause browser slowdown');
  }

  // Cleanup
  console.log('%c\n🧹 Cleaning up test data...', 'color: #8b8b9e; font-size: 14px; font-weight: bold;');
  for (let i = 0; i < 10000; i++) {
    localStorage.removeItem(`stress_${i}`);
    localStorage.removeItem(`perf_${i}`);
  }
  console.log('✅ Cleanup complete');

  return results;
})();
