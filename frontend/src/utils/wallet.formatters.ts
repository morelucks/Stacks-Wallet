/**
 * Wallet formatting utilities
 * Provides formatting functions for wallet data display
 */

import { formatAddress } from "./wallet.utils";

/**
 * Formats STX balance for display
 */
export function formatStxBalance(balance: string | bigint | number): string {
  const balanceNum = typeof balance === "bigint" 
    ? Number(balance) 
    : typeof balance === "string" 
    ? parseFloat(balance) 
    : balance;

  if (isNaN(balanceNum) || balanceNum === 0) {
    return "0 STX";
  }

  if (balanceNum < 0.000001) {
    return "< 0.000001 STX";
  }

  if (balanceNum < 1) {
    return `${balanceNum.toFixed(6)} STX`;
  }

  return `${balanceNum.toLocaleString(undefined, { 
    maximumFractionDigits: 6,
    minimumFractionDigits: 0 
  })} STX`;
}

/**
 * Formats address with network prefix indicator
 */
export function formatAddressWithNetwork(
  address: string,
  network: "mainnet" | "testnet" = "testnet"
): string {
  const formatted = formatAddress(address);
  const prefix = network === "mainnet" ? "SP" : "ST";
  return `${prefix}:${formatted}`;
}

/**
 * Formats transaction amount for display
 */
export function formatTransactionAmount(amount: string | bigint): string {
  const amountNum = typeof amount === "bigint" 
    ? Number(amount) / 1000000 
    : parseFloat(amount) / 1000000;

  return formatStxBalance(amountNum);
}

