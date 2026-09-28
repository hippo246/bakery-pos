// Session management and security utilities

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const createSession = (userId, role = 'cashier') => {
  const session = {
    id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    userId,
    role,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
  };
  
  localStorage.setItem('current_session', JSON.stringify(session));
  return session;
};

export const getSession = () => {
  try {
    const sessionData = localStorage.getItem('current_session');
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('current_session');
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
};

export const updateSessionActivity = () => {
  const session = getSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    localStorage.setItem('current_session', JSON.stringify(session));
  }
};

export const endSession = () => {
  localStorage.removeItem('current_session');
};

export const validateSession = () => {
  const session = getSession();
  if (!session) {
    return { valid: false, reason: 'No active session' };
  }
  
  if (new Date(session.expiresAt) < new Date()) {
    endSession();
    return { valid: false, reason: 'Session expired' };
  }
  
  return { valid: true, session };
};

export const setupSessionManagement = (onSessionExpired) => {
  let activityTimer;
  let sessionTimer;

  const resetActivityTimer = () => {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
      // Check idle timeout
      const session = getSession();
      if (session) {
        const idleTime = new Date() - new Date(session.lastActivity);
        if (idleTime > IDLE_TIMEOUT) {
          endSession();
          if (onSessionExpired) onSessionExpired();
        }
      }
    }, IDLE_TIMEOUT);
  };

  const resetSessionTimer = () => {
    clearTimeout(sessionTimer);
    const session = getSession();
    if (session) {
      sessionTimer = setTimeout(() => {
        endSession();
        if (onSessionExpired) onSessionExpired();
      }, SESSION_TIMEOUT);
    }
  };

  // Monitor user activity
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      updateSessionActivity();
      resetActivityTimer();
    });
  });

  resetActivityTimer();
  resetSessionTimer();

  return () => {
    activityEvents.forEach(event => {
      document.removeEventListener(event, () => {
        updateSessionActivity();
        resetActivityTimer();
      });
    });
    clearTimeout(activityTimer);
    clearTimeout(sessionTimer);
  };
};
