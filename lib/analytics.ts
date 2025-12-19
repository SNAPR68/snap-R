// Hotjar/Contentsquare Custom Events

declare global {
  interface Window {
    hj?: (method: string, ...args: any[]) => void;
    _uxa?: any[];
  }
}

export const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
  // Hotjar event
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('event', eventName);
  }
  
  // Contentsquare event
  if (typeof window !== 'undefined' && window._uxa) {
    window._uxa.push(['trackDynamicVariable', { key: eventName, value: eventData || true }]);
  }
  
  // Console log in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Event]', eventName, eventData);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('identify', userId, traits || {});
  }
};

export const trackPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.hj) {
    window.hj('stateChange', pageName);
  }
};

// Pre-defined events for SnapR
export const SnapREvents = {
  // Homepage
  HOMEPAGE_CTA_CLICK: 'homepage_cta_click',
  HOMEPAGE_PRICING_CLICK: 'homepage_pricing_click',
  HOMEPAGE_SCROLL_TO_FEATURES: 'homepage_scroll_features',
  HOMEPAGE_SCROLL_TO_PRICING: 'homepage_scroll_pricing',
  
  // Auth
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_STARTED: 'login_started',
  LOGIN_COMPLETED: 'login_completed',
  LOGIN_FAILED: 'login_failed',
  
  // Listing
  LISTING_CREATED: 'listing_created',
  PHOTO_UPLOADED: 'photo_uploaded',
  PHOTO_UPLOAD_FAILED: 'photo_upload_failed',
  
  // Enhancement
  ENHANCEMENT_STARTED: 'enhancement_started',
  ENHANCEMENT_COMPLETED: 'enhancement_completed',
  ENHANCEMENT_TOOL_USED: 'enhancement_tool_used',
  SKY_REPLACEMENT_USED: 'sky_replacement_used',
  TWILIGHT_USED: 'twilight_used',
  STAGING_USED: 'staging_used',
  HDR_USED: 'hdr_used',
  DECLUTTER_USED: 'declutter_used',
  LAWN_REPAIR_USED: 'lawn_repair_used',
  
  // Content Studio
  CONTENT_STUDIO_OPENED: 'content_studio_opened',
  TEMPLATE_SELECTED: 'template_selected',
  POST_CREATED: 'post_created',
  VIDEO_CREATED: 'video_created',
  EMAIL_CREATED: 'email_created',
  PROPERTY_SITE_CREATED: 'property_site_created',
  
  // Downloads & Publishing
  PHOTO_DOWNLOADED: 'photo_downloaded',
  BULK_DOWNLOAD: 'bulk_download',
  SOCIAL_PUBLISH_STARTED: 'social_publish_started',
  SOCIAL_PUBLISH_COMPLETED: 'social_publish_completed',
  
  // Client Approval
  SHARE_LINK_CREATED: 'share_link_created',
  CLIENT_APPROVED_PHOTO: 'client_approved_photo',
  CLIENT_REJECTED_PHOTO: 'client_rejected_photo',
  
  // Premium Add-ons
  FLOOR_PLAN_CREATED: 'floor_plan_created',
  VIRTUAL_TOUR_CREATED: 'virtual_tour_created',
  RENOVATION_CREATED: 'renovation_created',
  VOICEOVER_CREATED: 'voiceover_created',
  CMA_REPORT_CREATED: 'cma_report_created',
  
  // Billing
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  PRICING_SLIDER_USED: 'pricing_slider_used',
  PLAN_SELECTED: 'plan_selected',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
};

