/**
 * Contract deployment utility functions
 */

/**
 * Validates a Clarity contract name
 * Contract names must be lowercase, alphanumeric with hyphens/underscores
 */
export function validateContractName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Contract name cannot be empty" };
  }

  const trimmed = name.trim();
  
  // Must start with a letter
  if (!/^[a-z]/.test(trimmed)) {
    return { valid: false, error: "Contract name must start with a lowercase letter" };
  }

  // Only lowercase letters, numbers, hyphens, and underscores
  if (!/^[a-z0-9_-]+$/.test(trimmed)) {
    return { 
      valid: false, 
      error: "Contract name can only contain lowercase letters, numbers, hyphens, and underscores" 
    };
  }

  // Max length check (Clarity limit)
  if (trimmed.length > 40) {
    return { valid: false, error: "Contract name must be 40 characters or less" };
  }

  return { valid: true };
}

/**
 * Validates contract source code
 */
export function validateContractSource(source: string): { valid: boolean; error?: string } {
  if (!source || source.trim().length === 0) {
    return { valid: false, error: "Contract source code cannot be empty" };
  }

  // Basic Clarity syntax checks
  const trimmed = source.trim();
  
  // Should contain at least one define statement
  if (!trimmed.includes("define")) {
    return { valid: false, error: "Contract must contain at least one 'define' statement" };
  }

  return { valid: true };
}

/**
 * Formats fee from micro-STX to STX for display
 */
export function formatFee(feeMicroStx: number): string {
  return (feeMicroStx / 1_000_000).toFixed(6);
}

/**
 * Parses STX amount to micro-STX
 */
export function parseFeeToMicroStx(feeStx: string): number | null {
  const parsed = Number.parseFloat(feeStx);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed * 1_000_000);
}

/**
 * Gets recommended fee based on network
 */
export function getRecommendedFee(network: "mainnet" | "testnet"): number {
  return network === "mainnet" ? 150000 : 100000;
}

/**
 * Estimates contract deployment cost in STX
 */
export function estimateDeploymentCost(feeMicroStx: number): string {
  return formatFee(feeMicroStx);
}

