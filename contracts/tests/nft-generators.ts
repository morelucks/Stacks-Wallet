/**
 * Property test generators for NFT contract testing
 */

/**
 * Generate valid token IDs (1 to maxTokens)
 */
export function generateValidTokenId(maxTokens: number = 100): number {
  return Math.floor(Math.random() * maxTokens) + 1;
}

/**
 * Generate invalid token IDs (0 or > maxTokens)
 */
export function generateInvalidTokenId(maxTokens: number = 100): number {
  const choice = Math.random();
  if (choice < 0.5) {
    return 0; // Invalid: zero
  } else {
    return maxTokens + Math.floor(Math.random() * 1000) + 1; // Invalid: too high
  }
}

/**
 * Generate random principal addresses
 */
export function generatePrincipal(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'ST';
  for (let i = 0; i < 34; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a list of unique principals
 */
export function generateUniquePrincipals(count: number): string[] {
  const principals = new Set<string>();
  while (principals.size < count) {
    principals.add(generatePrincipal());
  }
  return Array.from(principals);
}

/**
 * Generate a sequence of mint operations
 */
export interface MintOperation {
  recipient: string;
  expectedTokenId: number;
}

export function generateMintSequence(count: number, principals: string[]): MintOperation[] {
  const operations: MintOperation[] = [];
  for (let i = 1; i <= count; i++) {
    const recipient = principals[Math.floor(Math.random() * principals.length)];
    operations.push({
      recipient,
      expectedTokenId: i
    });
  }
  return operations;
}

/**
 * Generate a sequence of transfer operations
 */
export interface TransferOperation {
  tokenId: number;
  from: string;
  to: string;
}

export function generateTransferSequence(
  tokenOwners: Map<number, string>,
  principals: string[],
  count: number
): TransferOperation[] {
  const operations: TransferOperation[] = [];
  const currentOwners = new Map(tokenOwners);
  
  for (let i = 0; i < count; i++) {
    const tokenIds = Array.from(currentOwners.keys());
    if (tokenIds.length === 0) break;
    
    const tokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
    const from = currentOwners.get(tokenId)!;
    const to = principals[Math.floor(Math.random() * principals.length)];
    
    operations.push({ tokenId, from, to });
    currentOwners.set(tokenId, to);
  }
  
  return operations;
}

/**
 * Generate edge case values
 */
export function generateEdgeCaseTokenIds(): number[] {
  return [0, 1, 999999999, Number.MAX_SAFE_INTEGER];
}

/**
 * Generate random operation sequences
 */
export type Operation = 
  | { type: 'mint'; recipient: string }
  | { type: 'transfer'; tokenId: number; from: string; to: string };

export function generateOperationSequence(
  principals: string[],
  operationCount: number
): Operation[] {
  const operations: Operation[] = [];
  const tokenOwners = new Map<number, string>();
  let nextTokenId = 1;
  
  for (let i = 0; i < operationCount; i++) {
    const shouldMint = Math.random() < 0.6 || tokenOwners.size === 0;
    
    if (shouldMint) {
      const recipient = principals[Math.floor(Math.random() * principals.length)];
      operations.push({ type: 'mint', recipient });
      tokenOwners.set(nextTokenId, recipient);
      nextTokenId++;
    } else {
      const tokenIds = Array.from(tokenOwners.keys());
      const tokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
      const from = tokenOwners.get(tokenId)!;
      const to = principals[Math.floor(Math.random() * principals.length)];
      
      operations.push({ type: 'transfer', tokenId, from, to });
      tokenOwners.set(tokenId, to);
    }
  }
  
  return operations;
}

/**
 * Property test configuration
 */
export const PROPERTY_TEST_CONFIG = {
  iterations: 100,
  maxTokens: 50,
  maxPrincipals: 10,
  maxOperations: 20
} as const;
/**
 * Additional generators for edge cases
 */

/**
 * Generate boundary value token IDs
 */
export function generateBoundaryTokenIds(): number[] {
  return [
    0,                    // Invalid: zero
    1,                    // Valid: minimum
    Number.MAX_SAFE_INTEGER, // Edge: maximum safe integer
    -1,                   // Invalid: negative (will be converted to large uint)
    999999999            // Large valid number
  ];
}

/**
 * Generate test scenarios for ownership chains
 */
export interface OwnershipChain {
  tokenId: number;
  owners: string[];
}

export function generateOwnershipChains(
  tokenCount: number,
  principals: string[],
  chainLength: number
): OwnershipChain[] {
  const chains: OwnershipChain[] = [];
  
  for (let i = 1; i <= tokenCount; i++) {
    const owners: string[] = [];
    
    // Initial owner
    owners.push(principals[Math.floor(Math.random() * principals.length)]);
    
    // Chain of transfers
    for (let j = 1; j < chainLength; j++) {
      let nextOwner;
      do {
        nextOwner = principals[Math.floor(Math.random() * principals.length)];
      } while (nextOwner === owners[owners.length - 1]); // Avoid self-transfer
      
      owners.push(nextOwner);
    }
    
    chains.push({ tokenId: i, owners });
  }
  
  return chains;
}