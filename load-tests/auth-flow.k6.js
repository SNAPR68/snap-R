import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds } from './config.js';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: defaultThresholds,
};

export default function () {
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage loads': (r) => r.status === 200 });
  });

  sleep(1);

  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard`, {
      headers: authHeaders(),
    });
    check(res, {
      'dashboard loads or redirects': (r) => r.status === 200 || r.status === 302 || r.status === 307,
    });
  });

  sleep(1);

  group('Listings API', () => {
    const res = http.get(`${BASE_URL}/api/listings`, {
      headers: authHeaders(),
    });
    check(res, {
      'listings API responds': (r) => r.status === 200 || r.status === 401,
    });
  });

  sleep(1);
}
