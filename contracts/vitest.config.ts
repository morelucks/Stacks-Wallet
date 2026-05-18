/**
 * Vitest configuration for Stacks Network contract tests.
 *
 * Uses vitest-environment-clarinet to initialise the Clarinet SDK and expose
 * the global `simnet` object in every test file.
 *
 * CLI usage:
 *   npm test                          # run all tests once
 *   npm run test:report               # run with coverage and cost reports
 *   vitest run -- --manifest ./Clarinet.toml   # custom manifest path
 *   vitest run -- --coverage --costs           # collect coverage and costs
 */

import { defineConfig } from 'vitest/config';
import {
  vitestSetupFilePath,
  getClarinetVitestsArgv,
} from '@stacks/clarinet-sdk/vitest';

export default defineConfig({
  test: {
    // Use the Clarinet simnet environment for Stacks Network contract testing
    environment: 'clarinet',

    // Run tests in forked processes for isolation
    pool: 'forks',

    // Clarinet resets the simnet between tests; vitest isolation is not needed
    isolate: false,

    // Sequential execution required by the Clarinet simnet
    maxWorkers: 1,

    setupFiles: [
      // Initialises simnet and registers custom Clarity matchers (toBeUint, etc.)
      vitestSetupFilePath,
    ],

    environmentOptions: {
      clarinet: {
        ...getClarinetVitestsArgv(),
      },
    },
  },
});
