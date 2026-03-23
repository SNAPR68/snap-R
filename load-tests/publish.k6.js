import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, cronHeaders, defaultThresholds } from './config.js';

export const options = {
  vus: 5,
  duration: '2m',
  thresholds: defaultThresholds,
};

export default function () {
  const res = http.post(`${BASE_URL}/api/cron/publish-scheduled`, null, {
    headers: cronHeaders(),
    timeout: '30s',
  });

  check(res, {
    'cron returns 200 or 401': (r) => r.status === 200 || r.status === 401,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  sleep(5);
}
