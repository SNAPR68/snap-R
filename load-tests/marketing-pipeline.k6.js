import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds } from './config.js';

export const options = {
  vus: 5,
  duration: '5m',
  thresholds: {
    ...defaultThresholds,
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
  },
};

export default function () {
  // Trigger preparation
  const prepRes = http.post(
    `${BASE_URL}/api/listing/prepare`,
    JSON.stringify({ listingId: `load-test-${__VU}` }),
    { headers: authHeaders(), timeout: '30s' }
  );

  check(prepRes, {
    'prepare responds': (r) => r.status === 200 || r.status === 400 || r.status === 401,
  });

  // Poll marketing status
  for (let i = 0; i < 5; i++) {
    sleep(10);
    const statusRes = http.get(
      `${BASE_URL}/api/marketing/status?listingId=load-test-${__VU}`,
      { headers: authHeaders() }
    );
    check(statusRes, {
      'status responds': (r) => r.status === 200 || r.status === 404 || r.status === 401,
    });
  }

  sleep(5);
}
