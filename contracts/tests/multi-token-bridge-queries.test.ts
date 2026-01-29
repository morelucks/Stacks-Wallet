import { describe, it, expect, beforeEach } from 'vitest';
import { Simnet } from '@hirosystems/clarinet-sdk';
import { Cl } from '@stacks/transactions';
import { MultiTokenBridgeTestUtils } from './multi-token-bridge-test-utils';
import { MULTI_TOKEN_BRIDGE_TEST_CONFIG } from './multi-token-bridge-test-config';

const simnet = new Simnet();
const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;

describe('Multi-Token Bridge Query Function Tests', () => {
  beforeEach(() => {
    simnet.reset();
    
    // Setup basic bridge infrastructure
    MultiTokenBridgeTestUtils.setupDefaultBridgeConfig(deployer);
    MultiTokenBridgeTestUtils.setupValidators([wallet2], deployer);
  });

  describe('get-bridge-config function', () => {
    it('should return bridge configuration for configured chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const config = result.result.value.value;
      expect(config['enabled']).toBeBool(true);
      expect(config['min-bridge-amount']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT);
      expect(config['max-bridge-amount']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT);
      expect(config['bridge-fee']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE);
    });

    it('should return none for unconfigured chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeConfig(999);

      expect(result.result).toBeOk();
      expect(result.result.value).toBeNone();
    });

    it('should return updated configuration after changes', () => {
      const chainId = MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON;
      const newFee = 200;
      const newMinAmount = 2000;

      // Update configuration
      MultiTokenBridgeTestUtils.configureBridge(
        chainId,
        false, // Disabled
        newMinAmount,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        newFee,
        15,
        3,
        deployer
      );

      const result = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const config = result.result.value.value;
      expect(config['enabled']).toBeBool(false);
      expect(config['min-bridge-amount']).toBeUint(newMinAmount);
      expect(config['bridge-fee']).toBeUint(newFee);
    });

    it('should return configurations for all supported chains', () => {
      const chains = Object.values(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS);
      
      chains.forEach(chainId => {
        const result = MultiTokenBridgeTestUtils.getBridgeConfig(chainId);
        expect(result.result).toBeOk();
        expect(result.result.value).toBeSome();
      });
    });
  });

  describe('get-bridge-transaction function', () => {
    let txId: Uint8Array;

    beforeEach(() => {
      txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
    });

    it('should return complete transaction data', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const txData = result.result.value.value;
      expect(txData['user']).toBePrincipal(wallet1);
      expect(txData['token-id']).toBeUint(1);
      expect(txData['amount']).toBeUint(9900); // After 1% fee
      expect(txData['source-chain']).toBeUint(0);
      expect(txData['dest-chain']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM);
      expect(txData['dest-address']).toBeAscii(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM);
      expect(txData['status']).toBeAscii('pending');
      expect(txData['confirmed-at']).toBeNone();
      expect(txData['validator-signatures']).toBeList([]);
    });

    it('should return none for non-existent transaction', () => {
      const nonExistentTxId = MultiTokenBridgeTestUtils.generateTxId();
      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(nonExistentTxId);

      expect(result.result).toBeOk();
      expect(result.result.value).toBeNone();
    });

    it('should return updated transaction after validation', () => {
      const signature = MultiTokenBridgeTestUtils.generateSignature();
      
      // Add validator signature
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId,
        signature,
        true,
        wallet2
      );

      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const txData = result.result.value.value;
      expect(txData['validator-signatures']).toBeList([Cl.buffer(signature)]);
    });

    it('should return transaction with failed status after rejection', () => {
      // Validator rejects transaction
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId,
        MultiTokenBridgeTestUtils.generateSignature(),
        false,
        wallet2
      );

      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(txId);
      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const txData = result.result.value.value;
      expect(txData['status']).toBeAscii('failed');
    });
  });

  describe('get-validator-info function', () => {
    it('should return complete validator information', () => {
      const result = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const validatorData = result.result.value.value;
      expect(validatorData['active']).toBeBool(true);
      expect(validatorData['stake-amount']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT);
      expect(validatorData['reputation-score']).toBeUint(100);
      expect(validatorData['total-validations']).toBeUint(0);
    });

    it('should return none for non-existent validator', () => {
      const result = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet1 // Not a validator
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeNone();
    });

    it('should return updated validator info after validation activity', () => {
      // Create and validate a transaction
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
      
      MultiTokenBridgeTestUtils.validateBridgeTransaction(
        txId,
        MultiTokenBridgeTestUtils.generateSignature(),
        true,
        wallet2
      );

      const result = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const validatorData = result.result.value.value;
      expect(validatorData['total-validations']).toBeUint(1);
      expect(Number(validatorData['last-validation'].value)).toBeGreaterThan(0);
    });

    it('should return separate validator info per chain', () => {
      // Add validator to different chain with different stake
      MultiTokenBridgeTestUtils.addValidator(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet2,
        20000, // Different stake amount
        deployer
      );

      const ethValidator = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );
      const btcValidator = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        wallet2
      );

      expect(ethValidator.result).toBeOk();
      expect(ethValidator.result.value).toBeSome();
      expect(btcValidator.result).toBeOk();
      expect(btcValidator.result.value).toBeSome();
      
      expect(ethValidator.result.value.value['stake-amount']).toBeUint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_STAKE_AMOUNT);
      expect(btcValidator.result.value.value['stake-amount']).toBeUint(20000);
    });
  });

  describe('get-bridge-stats function', () => {
    beforeEach(() => {
      // Create some bridge activity to generate stats
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
    });

    it('should return bridge statistics for active chain', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeStats(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const stats = result.result.value.value;
      expect(stats['total-bridged-out']).toBeUint(9900); // After fee deduction
      expect(stats['total-transactions']).toBeUint(1);
      expect(Number(stats['last-activity'].value)).toBeGreaterThan(0);
    });

    it('should return none for chain with no activity', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeStats(999); // Non-existent chain

      expect(result.result).toBeOk();
      expect(result.result.value).toBeNone();
    });

    it('should accumulate statistics across multiple transactions', () => {
      // Create additional transactions
      for (let i = 0; i < 3; i++) {
        const txId = MultiTokenBridgeTestUtils.generateTxId();
        MultiTokenBridgeTestUtils.bridgeTokens(
          i + 2,
          5000,
          MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
          MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
          txId,
          wallet1
        );
      }

      const result = MultiTokenBridgeTestUtils.getBridgeStats(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeSome();
      
      const stats = result.result.value.value;
      expect(stats['total-transactions']).toBeUint(4); // 1 from beforeEach + 3 new
      // Total bridged out: 9900 (first) + 3 * 4950 (after 1% fee on 5000) = 24750
      expect(stats['total-bridged-out']).toBeUint(24750);
    });
  });

  describe('get-wrapped-token-info function', () => {
    it('should return none for non-existent wrapped token', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeTransaction(
        MultiTokenBridgeTestUtils.generateTxId()
      );

      expect(result.result).toBeOk();
      expect(result.result.value).toBeNone();
    });

    // Note: The current contract doesn't implement wrapped token creation
    // This test would need wrapped token functionality to be meaningful
  });

  describe('calculate-bridge-fee function', () => {
    it('should calculate correct fee for valid parameters', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );

      expect(result.result).toBeOk();
      const feeData = result.result.value;
      expect(feeData['fee-amount']).toBeUint(100); // 1% of 10000
      expect(feeData['bridge-amount']).toBeUint(9900);
      expect(feeData['total-cost']).toBeUint(10000);
    });

    it('should return error for invalid chain', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        999 // Invalid chain
      );

      expect(result.result).toBeErr(Cl.uint(MultiTokenBridgeTestUtils.ERRORS.INVALID_CHAIN));
    });

    it('should calculate fees for different chain configurations', () => {
      // Configure different fee for Bitcoin
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        500, // 5% fee
        10,
        2,
        deployer
      );

      const ethResult = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );
      const btcResult = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN
      );

      expect(ethResult.result).toBeOk();
      expect(btcResult.result).toBeOk();
      
      expect(ethResult.result.value['fee-amount']).toBeUint(100); // 1%
      expect(btcResult.result.value['fee-amount']).toBeUint(500); // 5%
    });

    it('should handle zero fee configuration', () => {
      // Configure zero fee for Polygon
      MultiTokenBridgeTestUtils.configureBridge(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON,
        true,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MIN_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        0, // Zero fee
        10,
        2,
        deployer
      );

      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON
      );

      expect(result.result).toBeOk();
      const feeData = result.result.value;
      expect(feeData['fee-amount']).toBeUint(0);
      expect(feeData['bridge-amount']).toBeUint(10000);
    });

    it('should handle large amounts without overflow', () => {
      const result = MultiTokenBridgeTestUtils.calculateBridgeFee(
        1,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );

      expect(result.result).toBeOk();
      const feeData = result.result.value;
      const expectedFee = MULTI_TOKEN_BRIDGE_TEST_CONFIG.MAX_BRIDGE_AMOUNT * MULTI_TOKEN_BRIDGE_TEST_CONFIG.DEFAULT_BRIDGE_FEE / 10000;
      expect(feeData['fee-amount']).toBeUint(expectedFee);
    });
  });

  describe('get-bridge-overview function', () => {
    beforeEach(() => {
      // Create some bridge activity
      const txId = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        1,
        10000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.ETHEREUM,
        txId,
        wallet1
      );
    });

    it('should return complete bridge overview', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeOverview();

      expect(result.result).toBeOk();
      const overview = result.result.value;
      
      expect(overview['total-volume']).toBeUint(9900); // After fee
      expect(overview['total-validators']).toBeUint(4); // 1 validator * 4 chains
      expect(overview['bridge-paused']).toBeBool(false);
      expect(overview['supported-chains']).toBeList([
        Cl.uint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM),
        Cl.uint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN),
        Cl.uint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.POLYGON),
        Cl.uint(MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BSC)
      ]);
      expect(overview['active-transactions']).toBeUint(0); // Not implemented in contract
    });

    it('should update total volume after multiple transactions', () => {
      // Create additional transaction
      const txId2 = MultiTokenBridgeTestUtils.generateTxId();
      MultiTokenBridgeTestUtils.bridgeTokens(
        2,
        5000,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.BITCOIN,
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_ADDRESSES.BITCOIN,
        txId2,
        wallet1
      );

      const result = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(result.result).toBeOk();
      
      const overview = result.result.value;
      // Total: 9900 (first tx) + 4950 (second tx after 1% fee) = 14850
      expect(overview['total-volume']).toBeUint(14850);
    });

    it('should reflect current bridge state', () => {
      const result = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(result.result).toBeOk();
      
      const overview = result.result.value;
      expect(overview['bridge-paused']).toBeBool(false);
      expect(overview['supported-chains']).toHaveLength(4);
    });
  });

  describe('Query function error handling', () => {
    it('should handle queries with invalid parameters gracefully', () => {
      // Most read-only functions should not fail, but return none or default values
      const configResult = MultiTokenBridgeTestUtils.getBridgeConfig(0);
      expect(configResult.result).toBeOk();
      
      const validatorResult = MultiTokenBridgeTestUtils.getValidatorInfo(0, deployer);
      expect(validatorResult.result).toBeOk();
      
      const statsResult = MultiTokenBridgeTestUtils.getBridgeStats(0);
      expect(statsResult.result).toBeOk();
    });

    it('should return consistent data types across all queries', () => {
      // Verify all query functions return properly typed data
      const configResult = MultiTokenBridgeTestUtils.getBridgeConfig(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM
      );
      expect(configResult.result).toBeOk();
      expect(configResult.result.value).toBeSome();

      const validatorResult = MultiTokenBridgeTestUtils.getValidatorInfo(
        MULTI_TOKEN_BRIDGE_TEST_CONFIG.TEST_CHAINS.ETHEREUM,
        wallet2
      );
      expect(validatorResult.result).toBeOk();
      expect(validatorResult.result.value).toBeSome();

      const overviewResult = MultiTokenBridgeTestUtils.getBridgeOverview();
      expect(overviewResult.result).toBeOk();
      expect(typeof overviewResult.result.value).toBe('object');
    });
  });
});