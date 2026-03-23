// Shared k6 load test configuration
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
export const CRON_SECRET = __ENV.CRON_SECRET || '';
export const API_KEY = __ENV.API_KEY || '';

export const defaultThresholds = {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed: ['rate<0.01'],
};

export function authHeaders() {
  return {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export function cronHeaders() {
  return {
    Authorization: `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json',
  };
}

export function apiKeyHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}
