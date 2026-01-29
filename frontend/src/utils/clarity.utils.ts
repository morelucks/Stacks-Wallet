/**
 * Clarity value parsing and formatting utilities
 */

/**
 * Extracts the 'ok' value from a Clarity response
 */
export function extractOk(value: any): any {
  if (value?.type === "response" && value.success) {
    return value.value;
  }
  if (value?.type === "response") {
    throw new Error(`Contract error: ${JSON.stringify(value.value)}`);
  }
  return value;
}

/**
 * Formats a Clarity uint value to BigInt
 */
export function formatUint(cv: any): bigint {
  if (cv?.type === "uint" && cv.value !== undefined) return BigInt(cv.value);
  throw new Error("Unexpected uint value");
}

/**
 * Formats a Clarity string value
 */
export function formatString(cv: any): string {
  if ((cv?.type === "string-ascii" || cv?.type === "string-utf8") && cv.value !== undefined) {
    return String(cv.value);
  }
  throw new Error("Unexpected string value");
}
