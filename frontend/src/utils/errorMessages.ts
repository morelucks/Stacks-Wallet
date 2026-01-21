/**
 * Enhanced error message utilities
 * Provides user-friendly error messages for common contract errors
 */

export interface ErrorDetails {
  code?: string | number;
  message: string;
  suggestion?: string;
}

/**
 * Maps error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, { message: string; suggestion: string }> = {
  "NOT_CONNECTED": {
    message: "Wallet not connected",
    suggestion: "Please connect your wallet to continue.",
  },
  "CONNECTION_ERROR": {
    message: "Failed to connect wallet",
    suggestion: "Please try connecting again or check your wallet extension.",
  },
  "DEPLOYMENT_ERROR": {
    message: "Contract deployment failed",
    suggestion: "Check your contract code for errors and ensure you have sufficient STX balance.",
  },
  "CONTRACT_CALL_ERROR": {
    message: "Contract function call failed",
    suggestion: "Verify the function parameters and ensure you have the required permissions.",
  },
  "INSUFFICIENT_BALANCE": {
    message: "Insufficient balance",
    suggestion: "You don't have enough tokens or STX to complete this transaction.",
  },
  "UNAUTHORIZED": {
    message: "Unauthorized",
    suggestion: "You don't have permission to perform this action. Check if you're the contract owner.",
  },
  "MINTING_PAUSED": {
    message: "Minting is paused",
    suggestion: "Minting has been paused by the contract owner. Contact them to unpause.",
  },
  "MAX_SUPPLY_EXCEEDED": {
    message: "Maximum supply exceeded",
    suggestion: "The requested amount would exceed the token's maximum supply.",
  },
};

/**
 * Extracts error code from error message or object
 */
function extractErrorCode(error: unknown): string | null {
  if (typeof error === "string") {
    // Try to find error code in string
    const match = error.match(/(?:err|error)[\s_-]?u?(\d+)/i);
    if (match) return match[1];
  }

  if (error && typeof error === "object") {
    const err = error as any;
    if (err.code) return String(err.code);
    if (err.errorCode) return String(err.errorCode);
    if (err.type) return String(err.type);
  }

  return null;
}

/**
 * Gets user-friendly error message
 */
export function getErrorMessage(error: unknown): ErrorDetails {
  const errorCode = extractErrorCode(error);
  const errorString = error instanceof Error ? error.message : String(error);

  // Check if we have a mapped error
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return {
      code: errorCode,
      ...ERROR_MESSAGES[errorCode],
    };
  }

  // Check for common error patterns in message
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorString.toLowerCase().includes(key.toLowerCase())) {
      return {
        code: key,
        ...value,
      };
    }
  }

  // Check for Clarity error codes (err u100, etc.)
  const clarityErrorMatch = errorString.match(/err[\s_-]?u?(\d+)/i);
  if (clarityErrorMatch) {
    const code = clarityErrorMatch[1];
    return {
      code,
      message: `Contract error (code: ${code})`,
      suggestion: "The contract rejected the transaction. Check the error code and contract documentation.",
    };
  }

  // Default error message
  return {
    message: errorString || "An unknown error occurred",
    suggestion: "Please try again or contact support if the problem persists.",
  };
}

/**
 * Formats error for display
 */
export function formatError(error: unknown): string {
  const details = getErrorMessage(error);
  return details.suggestion
    ? `${details.message}. ${details.suggestion}`
    : details.message;
}

