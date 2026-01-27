/**
 * Enhanced ERC-712 Integration Example
 * 
 * This example demonstrates how to integrate with the enhanced ERC-712 contract
 * showcasing all the new features and capabilities.
 */

import { 
  makeContractCall,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  bufferCV,
  listCV,
  tupleCV,
  boolCV,
  noneCV,
  someCV
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = 'enhanced-erc-712';

/**
 * Enhanced Signature Verification Example
 */
export async function verifyEnhancedSignature(
  messageHash: string,
  signature: string,
  signer: string,
  algorithm: string = 'secp256k1',
  expiry?: number
) {
  const options = expiry ? 
    someCV(tupleCV({ 
      expiry: someCV(uintCV(expiry)), 
      context: noneCV() 
    })) : 
    noneCV();

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'verify-signature-advanced',
    functionArgs: [
      bufferCV(Buffer.from(messageHash.replace('0x', ''), 'hex')),
      bufferCV(Buffer.from(signature.replace('0x', ''), 'hex')),
      standardPrincipalCV(signer),
      stringAsciiCV(algorithm),
      options
    ],
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Batch Signature Verification Example
 */
export async function verifySignaturesBatch(signatures: Array<{
  hash: string;
  signature: string;
  signer: string;
}>) {
  const signatureList = signatures.map(sig => 
    tupleCV({
      hash: bufferCV(Buffer.from(sig.hash.replace('0x', ''), 'hex')),
      signature: bufferCV(Buffer.from(sig.signature.replace('0x', ''), 'hex')),
      signer: standardPrincipalCV(sig.signer)
    })
  );

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'verify-signatures-batch',
    functionArgs: [listCV(signatureList)],
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Hierarchical Delegation Example
 */
export async function createHierarchicalDelegation(
  delegator: string,
  delegatee: string,
  level: number,
  permissions: string[],
  expiry: number,
  signature: string,
  senderKey: string
) {
  const permissionList = permissions.map(p => stringAsciiCV(p));

  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'delegate-hierarchical',
    functionArgs: [
      standardPrincipalCV(delegator),
      standardPrincipalCV(delegatee),
      uintCV(level),
      listCV(permissionList),
      uintCV(expiry),
      bufferCV(Buffer.from(signature.replace('0x', ''), 'hex'))
    ],
    senderKey,
    network,
    fee: 10000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Conditional Permit Example
 */
export async function createConditionalPermit(
  owner: string,
  spender: string,
  value: number,
  conditions: Array<{ type: string; value: string }>,
  expiry: number,
  transferable: boolean,
  signature: string,
  senderKey: string
) {
  const conditionList = conditions.map(c => 
    tupleCV({
      type: stringAsciiCV(c.type),
      value: bufferCV(Buffer.from(c.value.replace('0x', ''), 'hex'))
    })
  );

  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'create-conditional-permit',
    functionArgs: [
      standardPrincipalCV(owner),
      standardPrincipalCV(spender),
      uintCV(value),
      listCV(conditionList),
      uintCV(expiry),
      boolCV(transferable),
      bufferCV(Buffer.from(signature.replace('0x', ''), 'hex'))
    ],
    senderKey,
    network,
    fee: 15000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Role Management Example
 */
export async function grantRole(
  user: string,
  role: string,
  senderKey: string
) {
  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'grant-role',
    functionArgs: [
      standardPrincipalCV(user),
      stringAsciiCV(role)
    ],
    senderKey,
    network,
    fee: 5000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Batch Nonce Retrieval Example
 */
export async function getBatchNonces(users: string[]) {
  const userList = users.map(u => standardPrincipalCV(u));

  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-nonces-batch',
    functionArgs: [listCV(userList)],
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Contract Health Monitoring Example
 */
export async function getContractHealth() {
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-contract-health',
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Usage Analytics Example
 */
export async function getUsageAnalytics() {
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-usage-analytics',
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Feature Flag Management Example
 */
export async function toggleFeature(
  featureName: string,
  enabled: boolean,
  senderKey: string
) {
  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'toggle-feature',
    functionArgs: [
      stringAsciiCV(featureName),
      boolCV(enabled)
    ],
    senderKey,
    network,
    fee: 3000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Emergency Mode Example
 */
export async function triggerEmergencyMode(
  reason: string,
  senderKey: string
) {
  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'trigger-emergency-mode',
    functionArgs: [stringAsciiCV(reason)],
    senderKey,
    network,
    fee: 5000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Signature Blacklisting Example
 */
export async function blacklistSignature(
  signature: string,
  reason: string,
  senderKey: string
) {
  const transaction = await makeContractCall({
    contractAddress,
    contractName,
    functionName: 'blacklist-signature',
    functionArgs: [
      bufferCV(Buffer.from(signature.replace('0x', ''), 'hex')),
      stringAsciiCV(reason)
    ],
    senderKey,
    network,
    fee: 5000
  });

  return await broadcastTransaction(transaction, network);
}

/**
 * Performance Metrics Example
 */
export async function getPerformanceMetrics() {
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-performance-metrics',
    network,
    senderAddress: contractAddress
  });

  return cvToJSON(result);
}

/**
 * Complete Integration Example
 */
export class EnhancedERC712Client {
  private contractAddress: string;
  private contractName: string;
  private network: any;

  constructor(contractAddress: string, contractName: string, network: any) {
    this.contractAddress = contractAddress;
    this.contractName = contractName;
    this.network = network;
  }

  // Signature operations
  async verifySignature(messageHash: string, signature: string, signer: string, algorithm?: string) {
    return verifyEnhancedSignature(messageHash, signature, signer, algorithm);
  }

  async verifyBatchSignatures(signatures: Array<{hash: string; signature: string; signer: string}>) {
    return verifySignaturesBatch(signatures);
  }

  // Delegation operations
  async createDelegation(delegator: string, delegatee: string, level: number, permissions: string[], expiry: number, signature: string, senderKey: string) {
    return createHierarchicalDelegation(delegator, delegatee, level, permissions, expiry, signature, senderKey);
  }

  // Permit operations
  async createPermit(owner: string, spender: string, value: number, conditions: Array<{type: string; value: string}>, expiry: number, transferable: boolean, signature: string, senderKey: string) {
    return createConditionalPermit(owner, spender, value, conditions, expiry, transferable, signature, senderKey);
  }

  // Administrative operations
  async grantUserRole(user: string, role: string, senderKey: string) {
    return grantRole(user, role, senderKey);
  }

  async toggleContractFeature(featureName: string, enabled: boolean, senderKey: string) {
    return toggleFeature(featureName, enabled, senderKey);
  }

  // Monitoring operations
  async getHealth() {
    return getContractHealth();
  }

  async getAnalytics() {
    return getUsageAnalytics();
  }

  async getMetrics() {
    return getPerformanceMetrics();
  }

  // Batch operations
  async getNonces(users: string[]) {
    return getBatchNonces(users);
  }

  // Security operations
  async blacklist(signature: string, reason: string, senderKey: string) {
    return blacklistSignature(signature, reason, senderKey);
  }

  async emergency(reason: string, senderKey: string) {
    return triggerEmergencyMode(reason, senderKey);
  }
}

/**
 * Usage Example
 */
export async function exampleUsage() {
  const client = new EnhancedERC712Client(contractAddress, contractName, network);

  try {
    // Check contract health
    console.log('Contract Health:', await client.getHealth());

    // Get usage analytics
    console.log('Usage Analytics:', await client.getAnalytics());

    // Verify a signature
    const verificationResult = await client.verifySignature(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0x' + '01'.repeat(65),
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    console.log('Signature Verification:', verificationResult);

    // Get batch nonces
    const nonces = await client.getNonces([
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    ]);
    console.log('Batch Nonces:', nonces);

  } catch (error) {
    console.error('Integration Error:', error);
  }
}

export default EnhancedERC712Client;