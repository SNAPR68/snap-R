import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, apiKeyHeaders, defaultThresholds } from './config.js';

export const options = {
  vus: 10,
  duration: '3m',
  thresholds: defaultThresholds,
};

export default function () {
  // GET listings
  const listRes = http.get(`${BASE_URL}/api/v1/listings`, {
    headers: apiKeyHeaders(),
  });
  check(listRes, {
    'v1 listings responds': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    'v1 response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // GET single listing (use a placeholder ID)
  const detailRes = http.get(`${BASE_URL}/api/v1/listings/test-id`, {
    headers: apiKeyHeaders(),
  });
  check(detailRes, {
    'v1 detail responds': (r) => r.status === 200 || r.status === 404 || r.status === 401,
  });

  sleep(1);
}
