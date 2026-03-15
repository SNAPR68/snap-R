/**
 * SnapR Embeddable Widget Loader
 * Usage:
 *   <script src="https://snap-r.com/widget/snapr-embed.js"></script>
 *   <div data-snapr-widget="before-after" data-listing-id="UUID"></div>
 *
 * Widget types: before-after, gallery, property
 * Optional: data-theme="dark" (default) | "light"
 */
(function () {
  'use strict';

  var BASE_URL = 'https://snap-r.com';
  var WIDGET_TYPES = ['before-after', 'gallery', 'property'];

  function init() {
    var elements = document.querySelectorAll('[data-snapr-widget]');
    for (var i = 0; i < elements.length; i++) {
      setupWidget(elements[i]);
    }
  }

  function setupWidget(el) {
    var type = el.getAttribute('data-snapr-widget');
    var listingId = el.getAttribute('data-listing-id');

    if (WIDGET_TYPES.indexOf(type) === -1) {
      console.warn('[SnapR] Invalid widget type: ' + type);
      return;
    }
    if (!listingId) {
      console.warn('[SnapR] Missing data-listing-id attribute');
      return;
    }

    // Don't re-initialize
    if (el.getAttribute('data-snapr-initialized') === 'true') return;
    el.setAttribute('data-snapr-initialized', 'true');

    var iframe = document.createElement('iframe');
    iframe.src = BASE_URL + '/embed/' + type + '/' + listingId;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.minHeight = '200px';
    iframe.style.borderRadius = '12px';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'SnapR ' + type + ' widget');
    iframe.setAttribute('allowtransparency', 'true');

    el.innerHTML = '';
    el.appendChild(iframe);

    // Listen for auto-resize messages from the embed
    window.addEventListener('message', function (event) {
      if (
        event.data &&
        event.data.type === 'snapr-resize' &&
        event.data.listingId === listingId
      ) {
        iframe.style.height = event.data.height + 'px';
      }
    });

    // Track impression
    trackEvent(type, listingId, 'impression');
  }

  function trackEvent(widgetType, listingId, eventName) {
    try {
      var payload = JSON.stringify({
        widget_type: widgetType,
        listing_id: listingId,
        event: eventName,
        referrer: window.location.href.substring(0, 500),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(BASE_URL + '/api/embed/analytics', payload);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', BASE_URL + '/api/embed/analytics', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(payload);
      }
    } catch {
      // silently fail
    }
  }

  // Initialize on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for dynamic usage
  window.SnapRWidget = { init: init, track: trackEvent };
})();
