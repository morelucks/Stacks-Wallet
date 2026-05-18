/**
 * Enhanced SIP-009 Improvements Test Suite
 * Tests for gas optimisation, dynamic metadata evolution, advanced trading,
 * security audit features, and analytics for the enhanced SIP-009 NFT
 * contract on Stacks Network.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const alice = accounts.get('wallet_1')!;
const bob = accounts.get('wallet_2')!;

describe("Enhanced SIP-009 Improvements", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  describe("Gas Optimization Features", () => {
    it("should use optimized batch minting", () => {
      const batchMintResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "optimized-batch-mint",
        [
          Cl.list([Cl.principal(alice), Cl.principal(bob)]),
          Cl.list([Cl.stringAscii("Optimized NFT 1"), Cl.stringAscii("Optimized NFT 2")]),
          Cl.list([Cl.stringAscii("Gas optimized NFT 1"), Cl.stringAscii("Gas optimized NFT 2")]),
          Cl.list([Cl.stringAscii("opt1.png"), Cl.stringAscii("opt2.png")])
        ],
        deployer
      );
      
      expect(batchMintResult.result).toBeOk(Cl.uint(2));
    });

    it("should track cache statistics", () => {
      const cacheStats = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-cache-stats",
        [],
        deployer
      );
      
      expect(cacheStats.result).toHaveTupleKey("enabled");
      expect(cacheStats.result).toHaveTupleKey("hit-count");
      expect(cacheStats.result).toHaveTupleKey("miss-count");
    });
  });

  describe("Dynamic Metadata Evolution", () => {
    it("should create evolution rules", () => {
      const ruleResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "create-evolution-rule",
        [
          Cl.stringAscii("rarity-upgrade"),
          Cl.stringAscii("block-height > 1000"),
          Cl.stringAscii("upgrade to legendary"),
          Cl.uint(1100)
        ],
        deployer
      );
      
      expect(ruleResult.result).toBeOk(Cl.uint(1));
    });

    it("should serialize metadata to JSON", () => {
      // First mint an NFT
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Test NFT"),
          Cl.stringAscii("Test description"),
          Cl.stringAscii("test.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );

      const serializeResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "serialize-token-metadata",
        [Cl.uint(1)],
        deployer
      );
      
      expect(serializeResult.result).toBeOk();
    });
  });

  describe("Advanced Trading Engine", () => {
    beforeEach(() => {
      // Mint NFT for trading tests
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Trading NFT"),
          Cl.stringAscii("NFT for trading tests"),
          Cl.stringAscii("trading.png"),
          Cl.list([]),
          Cl.stringAscii("rare")
        ],
        deployer
      );
    });

    it("should create Dutch auction", () => {
      const auctionResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "create-dutch-auction",
        [
          Cl.uint(1),
          Cl.uint(2000000), // 2 STX start price
          Cl.uint(1000000), // 1 STX end price
          Cl.uint(1000), // 1000 blocks duration
          Cl.stringAscii("STX")
        ],
        alice
      );
      
      expect(auctionResult.result).toBeOk(Cl.uint(1));
    });

    it("should calculate Dutch auction price", () => {
      // Create auction first
      simnet.callPublicFn(
        "enhanced-sip-009",
        "create-dutch-auction",
        [
          Cl.uint(1),
          Cl.uint(2000000),
          Cl.uint(1000000),
          Cl.uint(1000),
          Cl.stringAscii("STX")
        ],
        alice
      );

      const priceResult = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-dutch-auction-price",
        [Cl.uint(1)],
        deployer
      );
      
      expect(priceResult.result).toBe(Cl.uint(2000000)); // Should be start price initially
    });

    it("should enable fractional ownership", () => {
      const fractionalResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "enable-fractional-ownership",
        [
          Cl.uint(1),
          Cl.uint(100), // 100 shares
          Cl.uint(10000) // 0.01 STX per share
        ],
        alice
      );
      
      expect(fractionalResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Security Audit Features", () => {
    it("should track suspicious activities", () => {
      // Perform multiple transfers to trigger tracking
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "enhanced-sip-009",
          "mint-with-metadata",
          [
            Cl.principal(alice),
            Cl.stringAscii(`Security Test ${i}`),
            Cl.stringAscii("Security test NFT"),
            Cl.stringAscii("security.png"),
            Cl.list([]),
            Cl.stringAscii("common")
          ],
          deployer
        );
      }

      const activityInfo = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-suspicious-activity-info",
        [Cl.principal(alice)],
        deployer
      );
      
      // Should have some activity tracked
      expect(activityInfo.result).toBeSome();
    });

    it("should get security status", () => {
      const securityStatus = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-security-status",
        [],
        deployer
      );
      
      expect(securityStatus.result).toHaveTupleKey("monitoring-enabled");
      expect(securityStatus.result).toHaveTupleKey("emergency-pause");
    });
  });

  describe("Analytics Engine", () => {
    it("should get current metrics summary", () => {
      const metricsResult = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-current-metrics-summary",
        [],
        deployer
      );
      
      expect(metricsResult.result).toHaveTupleKey("period");
      expect(metricsResult.result).toHaveTupleKey("analytics-enabled");
    });

    it("should export data", () => {
      const exportResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "request-data-export",
        [
          Cl.stringAscii("trading-metrics"),
          Cl.stringAscii("csv"),
          Cl.stringAscii("")
        ],
        alice
      );
      
      expect(exportResult.result).toBeOk();
    });
  });

  describe("System Health and Performance", () => {
    it("should perform system health check", () => {
      const healthCheck = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "system-health-check",
        [],
        deployer
      );
      
      expect(healthCheck.result).toHaveTupleKey("contract-status");
      expect(healthCheck.result).toHaveTupleKey("cache-health");
      expect(healthCheck.result).toHaveTupleKey("security-health");
      expect(healthCheck.result).toHaveTupleKey("analytics-health");
    });

    it("should get enhanced contract stats", () => {
      const enhancedStats = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-enhanced-contract-stats",
        [],
        deployer
      );
      
      expect(enhancedStats.result).toHaveTupleKey("basic-stats");
      expect(enhancedStats.result).toHaveTupleKey("security-stats");
      expect(enhancedStats.result).toHaveTupleKey("analytics-stats");
    });
  });
});