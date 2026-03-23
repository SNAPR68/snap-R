import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, authHeaders, defaultThresholds } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: defaultThresholds,
};

export default function () {
  // Simulate photo upload with a small binary payload
  const payload = {
    file: http.file(new ArrayBuffer(1024), 'test-photo.jpg', 'image/jpeg'),
  };

  const res = http.post(`${BASE_URL}/api/upload`, payload, {
    headers: { Authorization: authHeaders().Authorization },
    timeout: '30s',
  });

  check(res, {
    'upload status is 200 or 413': (r) => r.status === 200 || r.status === 413,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  sleep(1);
}
