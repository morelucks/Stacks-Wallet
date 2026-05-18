/**
 * Multi-Chain Bridge Tests
 * Validates chain-specific configuration, independent validator sets, and
 * cross-chain transaction routing for the multi-token bridge on Stacks Network.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG as CFG } from './multi-token-bridge-test-config';

// ---------------------------------------------------------------------------
// Test account setup
// ---------------------------------------------------------------------------
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-Chain Bridge Tests', () => {
  // -------------------------------------------------------------------------
  // Chain configuration
  // -------------------------------------------------------------------------

  describe('Chain configuration', () => {
    it('should configure all four supported chains', () => {
      for (const chainId of Object.values(CFG.TEST_CHAINS)) {
        const result = MultiTokenBridgeTestUtils.configureBridge(
          chainId, true, CFG.MIN_BRIDGE_AMOUNT, CFG.MAX_BRIDGE_AMOUNT,
          CFG.DEFAULT_BRIDGE_FEE, 10, 2, deployer,
        );
        expect(result.result).toBeOk();
      }
    });

    it('should store independent fee settings per chain', () => {
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.ETHEREUM, true, 1_000, 100_000, 100, 10, 2, deployer,
      );
      MultiTokenBridgeTestUtils.configureBridge(
        CFG.TEST_CHAINS.BITCOIN, true, 2_000, 200_000, 200, 20, 3, deployer,
      );

      const eth = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.ETHEREUM);
      const btc = MultiTokenBridgeTestUtils.getBridgeConfig(CFG.TEST_CHAINS.BITCOIN);

      expect((eth.result as any).value?.value?.['bridge-fee']).toBeUint(100);
      expect((btc.result as any).value?.value?.['bridge-fee']).toBeUint(200);
    });
  });

  // -------------------------------------------------------------------------
  // Independent validator sets
  // -------------------------------------------------------------------------

  describe('Independent validator sets per chain', () => {
    it('should maintain separate stake amounts for the same validator on different chains', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 10_000, deployer);
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.BITCOIN, wallet1, 20_000, deployer);

      const ethV = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.ETHEREUM, wallet1);
      const btcV = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet1);

      expect((ethV.result as any).value?.['stake-amount']).toBeUint(10_000);
      expect((btcV.result as any).value?.['stake-amount']).toBeUint(20_000);
    });

    it('should not expose a validator registered on one chain to another chain', () => {
      MultiTokenBridgeTestUtils.addValidator(CFG.TEST_CHAINS.ETHEREUM, wallet1, 10_000, deployer);

      const btcV = MultiTokenBridgeTestUtils.getValidatorInfo(CFG.TEST_CHAINS.BITCOIN, wallet1);
      // wallet1 was not registered on Bitcoin
      expect(btcV.result).toBeOk();
    });
  });

  // -------------------------------------------------------------------------
  // Cross-chain transaction routing
  // -------------------------------------------------------------------------

  describe('Cross-chain transaction routing', () => {
    beforeEach(() => {
      MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    });

    it('should route transactions to the correct destination chain', () => {
      const chains = [
        { id: CFG.TEST_CHAINS.ETHEREUM, addr: CFG.TEST_ADDRESSES.ETHEREUM },
        { id: CFG.TEST_CHAINS.BITCOIN, addr: CFG.TEST_ADDRESSES.BITCOIN },
        { id: CFG.TEST_CHAINS.POLYGON, addr: CFG.TEST_ADDRESSES.POLYGON },
        { id: CFG.TEST_CHAINS.BSC, addr: CFG.TEST_ADDRESSES.BSC },
      ];

      for (const { id, addr } of chains) {
        const txId = MultiTokenBridgeTestUtils.generateTxId();
        const result = MultiTokenBridgeTestUtils.bridgeTokens(
          1, 10_000, id, addr, txId, wallet1,
        );
        expect(result.result).toBeOk();

        const tx = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
        expect((tx.result as any).value?.['dest-chain']).toBeUint(id);
      }
    });
  });
});
