/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/supabase/**',
    '!lib/monitoring/**',
    '!lib/env.ts',
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 60,
  },
  timeoutMS: 60000,
  concurrency: 4,
  tempDirName: '.stryker-tmp',
  ignorePatterns: [
    'node_modules',
    '.next',
    'apps',
    'remotion',
    'supabase',
    'public',
    'e2e',
    'load-tests',
    'security',
  ],
};
