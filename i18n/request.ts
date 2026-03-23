import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // For now, default to English. When locale routing is added,
  // this will read from the request/cookie/header.
  const locale = 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
