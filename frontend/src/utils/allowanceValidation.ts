export const validateStacksAddress = (address: string): boolean => {
  // Basic Stacks address validation
  if (!address) return false;
  
  // Mainnet addresses start with SP, testnet with ST
  if (!address.startsWith('SP') && !address.startsWith('ST')) {
    return false;
  }
  
  // Should be 41 characters long
  if (address.length !== 41) {
    return false;
  }
  
  // Should only contain valid base58 characters
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  return base58Regex.test(address.slice(2)); // Skip the SP/ST prefix
};

export const validateAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount) {
    return { isValid: false, error: 'Amount is required' };
  }
  
  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }
  
  if (numAmount === 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }
  
  if (!Number.isInteger(numAmount)) {
    return { isValid: false, error: 'Amount must be a whole number' };
  }
  
  // Check for reasonable upper limit (prevent overflow)
  if (numAmount > Number.MAX_SAFE_INTEGER) {
    return { isValid: false, error: 'Amount is too large' };
  }
  
  return { isValid: true };
};

export const formatAllowanceError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.reason) {
    return error.reason;
  }
  
  return 'An unexpected error occurred';
};