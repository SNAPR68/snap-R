import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds } from './config.js';

export const options = {
  stages: [
    { duration: '1m', target: 30 },
    { duration: '3m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: defaultThresholds,
};

export default function () {
  const payload = JSON.stringify({
    photoId: `photo-${__VU}-${__ITER}`,
    tool: 'auto-enhance',
    preset: 'default',
  });

  const res = http.post(`${BASE_URL}/api/enhance`, payload, {
    headers: authHeaders(),
    timeout: '15s',
  });

  check(res, {
    'enhance returns 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time < 15s': (r) => r.timings.duration < 15000,
  });

  sleep(2);
}
