# Security Scanning

## OWASP ZAP Baseline Scan

Automated security scanning using OWASP ZAP.

### CI (Automatic)

Runs on every PR to `main` and weekly on Monday 3am via GitHub Actions.

### Local Run

```bash
# Start the app
npm run build && npm start

# Run ZAP scan (requires Docker)
docker run -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:3000 -c security/zap-config.yaml

# Reports output to security/reports/
```

## Mutation Testing (Stryker)

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner

# Run mutation tests
npx stryker run

# Reports output to reports/mutation/
```

## Security Checklist

- [x] OWASP ZAP baseline scan configured
- [x] Stryker mutation testing configured
- [x] CSP headers in next.config.mjs
- [x] Rate limiting (IP-based middleware + per-user async)
- [x] Zod input validation on all API routes
- [x] HMAC-SHA256 webhook signatures
- [x] Bot pattern blocking in middleware
- [x] CSRF via Supabase auth state
