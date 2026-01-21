/**
 * AppKit Singleton Instance
 * Centralized AppKit instance to ensure single source of truth
 */

import { createAppKit } from "@reown/appkit/react";
import { stacksMainnet, stacksTestnet, WALLET_CONFIG } from "../config/wallet.config";

// Create singleton AppKit instance
export const appKit = createAppKit({
  adapters: ["stacks"],
  networks: [stacksMainnet, stacksTestnet],
  projectId: WALLET_CONFIG.PROJECT_ID,
  metadata: {
    name: WALLET_CONFIG.APP_NAME,
    description: WALLET_CONFIG.APP_DESCRIPTION,
    url: WALLET_CONFIG.APP_URL,
  },
  features: ["email", "socials"],
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#5546ff",
  },
});

