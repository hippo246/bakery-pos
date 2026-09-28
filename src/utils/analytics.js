// Analytics tracking utilities

export const trackEvent = (eventName, properties = {}) => {
  const analyticsLog = JSON.parse(localStorage.getItem('analytics_log') || '[]');
  
  analyticsLog.push({
    eventName,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: localStorage.getItem('current_session')?.id || 'unknown',
    userId: localStorage.getItem('current_session')?.userId || 'guest'
  });
  
  // Keep only last 2000 events
  if (analyticsLog.length > 2000) {
    analyticsLog.splice(0, analyticsLog.length - 2000);
  }
  
  localStorage.setItem('analytics_log', JSON.stringify(analyticsLog));
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', { page: pageName });
};

export const trackButtonClick = (buttonName, context = {}) => {
  trackEvent('button_click', { button: buttonName, ...context });
};

export const trackError = (errorName, errorDetails) => {
  trackEvent('error', { error: errorName, details: errorDetails });
};

export const getAnalyticsSummary = () => {
  const analyticsLog = JSON.parse(localStorage.getItem('analytics_log') || '[]');
  
  const eventCounts = {};
  analyticsLog.forEach(log => {
    eventCounts[log.eventName] = (eventCounts[log.eventName] || 0) + 1;
  });
  
  const pageViews = analyticsLog.filter(log => log.eventName === 'page_view');
  const buttonClicks = analyticsLog.filter(log => log.eventName === 'button_click');
  const errors = analyticsLog.filter(log => log.eventName === 'error');
  
  return {
    totalEvents: analyticsLog.length,
    eventCounts,
    pageViews: pageViews.length,
    buttonClicks: buttonClicks.length,
    errors: errors.length,
    uniqueUsers: [...new Set(analyticsLog.map(log => log.userId))].length
  };
};
