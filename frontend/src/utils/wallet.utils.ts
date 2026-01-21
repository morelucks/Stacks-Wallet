/**
 * Wallet utility functions
 */

import type { WalletError } from "../types/wallet";
import { WALLET_CONSTANTS } from "./wallet.constants";

/**
 * Formats a Stacks address for display (truncates middle)
 */
export function formatAddress(
  address: string,
  startChars = WALLET_CONSTANTS.ADDRESS_START_CHARS,
  endChars = WALLET_CONSTANTS.ADDRESS_END_CHARS
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validates a Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses start with SP (mainnet) or ST (testnet)
  const stacksAddressRegex = /^[SP][A-HJ-NP-Z0-9]{38,39}$/;
  return stacksAddressRegex.test(address);
}

/**
 * Creates a standardized wallet error object
 */
export function createWalletError(
  code: string,
  message: string,
  details?: unknown
): WalletError {
  return { code, message, details };
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

/**
 * Checks if error is a user rejection
 */
export function isUserRejection(error: unknown): boolean {
  if (error && typeof error === "object") {
    const errorStr = JSON.stringify(error).toLowerCase();
    return (
      errorStr.includes("reject") ||
      errorStr.includes("denied") ||
      errorStr.includes("cancel")
    );
  }
  return false;
}

