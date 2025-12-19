'use client';

interface TrackEventOptions {
  eventType: 'page_view' | 'click' | 'enhancement' | 'signup' | 'error' | 'action';
  eventName: string;
  eventData?: Record<string, any>;
  userId?: string;
}

const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('snapr_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('snapr_session_id', sessionId);
  }
  return sessionId;
};

const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { deviceType: 'unknown', browser: 'unknown', userAgent: '' };
  
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
  }
  
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  return { deviceType, browser, userAgent: ua };
};

export const trackEvent = async (options: TrackEventOptions) => {
  try {
    const { deviceType, browser, userAgent } = getDeviceInfo();
    
    const payload = {
      session_id: getSessionId(),
      event_type: options.eventType,
      event_name: options.eventName,
      event_data: options.eventData || {},
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: userAgent,
      device_type: deviceType,
      browser,
      user_id: options.userId || null,
    };

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

export const trackPageView = (pageName: string, data?: Record<string, any>) => {
  trackEvent({ eventType: 'page_view', eventName: pageName, eventData: data });
};

export const trackClick = (elementName: string, data?: Record<string, any>) => {
  trackEvent({ eventType: 'click', eventName: elementName, eventData: data });
};

export const trackEnhancement = (toolType: string, data?: Record<string, any>) => {
  trackEvent({ eventType: 'enhancement', eventName: toolType, eventData: data });
};

export const trackSignup = (method: string, data?: Record<string, any>) => {
  trackEvent({ eventType: 'signup', eventName: method, eventData: data });
};

export const trackAction = (actionName: string, data?: Record<string, any>) => {
  trackEvent({ eventType: 'action', eventName: actionName, eventData: data });
};

