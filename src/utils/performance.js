// Performance metrics and analytics utilities

export const trackPerformance = (eventName, duration, metadata = {}) => {
  const perfLog = JSON.parse(localStorage.getItem('performance_log') || '[]');
  perfLog.push({
    eventName,
    duration,
    timestamp: new Date().toISOString(),
    metadata
  });
  
  // Keep only last 1000 entries
  if (perfLog.length > 1000) {
    perfLog.splice(0, perfLog.length - 1000);
  }
  
  localStorage.setItem('performance_log', JSON.stringify(perfLog));
};

export const getPerformanceMetrics = () => {
  const perfLog = JSON.parse(localStorage.getItem('performance_log') || '[]');
  
  // Calculate metrics
  const avgOrderTime = perfLog
    .filter(log => log.eventName === 'order_completion')
    .reduce((sum, log) => sum + log.duration, 0) / perfLog.filter(log => log.eventName === 'order_completion').length || 1;
  
  const avgPaymentTime = perfLog
    .filter(log => log.eventName === 'payment_processing')
    .reduce((sum, log) => sum + log.duration, 0) / perfLog.filter(log => log.eventName === 'payment_processing').length || 1;
  
  return {
    avgOrderTime: Math.round(avgOrderTime),
    avgPaymentTime: Math.round(avgPaymentTime),
    totalEvents: perfLog.length
  };
};

export const startPerformanceTracking = (eventName) => {
  return {
    startTime: performance.now(),
    eventName
  };
};

export const endPerformanceTracking = (tracking) => {
  const duration = performance.now() - tracking.startTime;
  trackPerformance(tracking.eventName, duration);
  return duration;
};
