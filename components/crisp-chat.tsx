'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispChat() {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = '0f743cf0-e2db-4bb9-a8a6-79db85df7d06';

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const crispElements = document.querySelectorAll('[class^="crisp"]');
      crispElements.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
