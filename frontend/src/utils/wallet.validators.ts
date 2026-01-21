/**
 * Wallet validation utilities
 * Provides validation functions for wallet addresses and operations
 */

import { isValidStacksAddress } from "./wallet.utils";

/**
 * Validates a Stacks principal address format
 */
export function validatePrincipal(principal: string): {
  valid: boolean;
  error?: string;
} {
  if (!principal || principal.trim().length === 0) {
    return { valid: false, error: "Principal address is required" };
  }

  if (!isValidStacksAddress(principal)) {
    return {
      valid: false,
      error: "Invalid Stacks address format. Must start with SP (mainnet) or ST (testnet)",
    };
  }

  return { valid: true };
}

/**
 * Validates contract identifier format
 */
export function validateContractIdentifier(
  address: string,
  name: string
): { valid: boolean; error?: string } {
  const addressValidation = validatePrincipal(address);
  if (!addressValidation.valid) {
    return addressValidation;
  }

  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Contract name is required" };
  }

  // Contract names must be lowercase and alphanumeric with hyphens
  const contractNameRegex = /^[a-z0-9-]+$/;
  if (!contractNameRegex.test(name)) {
    return {
      valid: false,
      error: "Contract name must be lowercase alphanumeric with hyphens only",
    };
  }

  return { valid: true };
}

