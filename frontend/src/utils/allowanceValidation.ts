import { ValidationResult, ValidationError, ValidationWarning } from '../types/allowance';

// Enhanced Stacks address validation with detailed feedback
export const validateStacksAddress = (address: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  if (!address) {
    errors.push({
      field: 'address',
      code: 'REQUIRED',
      message: 'Address is required',
      severity: 'error'
    });
    suggestions.push('Enter a valid Stacks address starting with SP (mainnet) or ST (testnet)');
    return { isValid: false, errors, warnings, suggestions };
  }

  // Trim whitespace and convert to uppercase for validation
  const cleanAddress = address.trim();
  
  // Check for common formatting issues
  if (cleanAddress !== address) {
    warnings.push({
      field: 'address',
      message: 'Address contains leading/trailing whitespace',
      type: 'usability'
    });
  }

  // Check prefix
  if (!cleanAddress.startsWith('SP') && !cleanAddress.startsWith('ST') && 
      !cleanAddress.startsWith('SM') && !cleanAddress.startsWith('SN')) {
    errors.push({
      field: 'address',
      code: 'INVALID_PREFIX',
      message: 'Address must start with SP (mainnet), ST (testnet), SM, or SN',
      severity: 'error'
    });
    suggestions.push('Mainnet addresses start with SP, testnet addresses start with ST');
  }

  // Check length
  if (cleanAddress.length !== 41) {
    errors.push({
      field: 'address',
      code: 'INVALID_LENGTH',
      message: `Address must be exactly 41 characters long (current: ${cleanAddress.length})`,
      severity: 'error'
    });
    if (cleanAddress.length < 41) {
      suggestions.push('Address appears to be incomplete');
    } else {
      suggestions.push('Address is too long, check for extra characters');
    }
  }

  // Check for valid base58 characters (excluding 0, O, I, l)
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  if (cleanAddress.length >= 3 && !base58Regex.test(cleanAddress.slice(2))) {
    errors.push({
      field: 'address',
      code: 'INVALID_CHARACTERS',
      message: 'Address contains invalid characters (0, O, I, l are not allowed in base58)',
      severity: 'error'
    });
    suggestions.push('Check for commonly confused characters: 0→O, I→1, l→1');
  }

  // Security warnings for testnet vs mainnet
  if (cleanAddress.startsWith('ST') || cleanAddress.startsWith('SN')) {
    warnings.push({
      field: 'address',
      message: 'This appears to be a testnet address',
      type: 'security'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// Enhanced amount validation with token decimals and security checks
export const validateAmount = (
  amount: string, 
  tokenDecimals: number = 0,
  maxValue?: bigint
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  if (!amount) {
    errors.push({
      field: 'amount',
      code: 'REQUIRED',
      message: 'Amount is required',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, suggestions };
  }

  const trimmedAmount = amount.trim();
  
  // Check for whitespace issues
  if (trimmedAmount !== amount) {
    warnings.push({
      field: 'amount',
      message: 'Amount contains leading/trailing whitespace',
      type: 'usability'
    });
  }

  // Check for valid number format
  const numAmount = Number(trimmedAmount);
  
  if (isNaN(numAmount)) {
    errors.push({
      field: 'amount',
      code: 'INVALID_NUMBER',
      message: 'Amount must be a valid number',
      severity: 'error'
    });
    suggestions.push('Enter a numeric value (e.g., 100, 1000.5)');
    return { isValid: false, errors, warnings, suggestions };
  }

  // Check for negative values
  if (numAmount < 0) {
    errors.push({
      field: 'amount',
      code: 'NEGATIVE_VALUE',
      message: 'Amount cannot be negative',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, suggestions };
  }

  // Check for zero
  if (numAmount === 0) {
    errors.push({
      field: 'amount',
      code: 'ZERO_VALUE',
      message: 'Amount must be greater than zero',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, suggestions };
  }

  // Check decimal places against token decimals
  const decimalPlaces = (trimmedAmount.split('.')[1] || '').length;
  if (decimalPlaces > tokenDecimals) {
    errors.push({
      field: 'amount',
      code: 'INVALID_DECIMALS',
      message: `Amount cannot have more than ${tokenDecimals} decimal places`,
      severity: 'error'
    });
    suggestions.push(`This token supports up to ${tokenDecimals} decimal places`);
  }

  // Convert to bigint for large number handling
  try {
    const scaledAmount = BigInt(Math.floor(numAmount * Math.pow(10, tokenDecimals)));
    
    // Check against maximum value if provided
    if (maxValue && scaledAmount > maxValue) {
      errors.push({
        field: 'amount',
        code: 'EXCEEDS_MAXIMUM',
        message: `Amount exceeds maximum allowed value`,
        severity: 'error'
      });
      suggestions.push(`Maximum allowed amount is ${maxValue.toString()}`);
    }

    // Security warning for very large amounts
    const largeAmountThreshold = BigInt('1000000000000000000'); // 1 billion with 9 decimals
    if (scaledAmount > largeAmountThreshold) {
      warnings.push({
        field: 'amount',
        message: 'This is a very large allowance amount',
        type: 'security'
      });
      suggestions.push('Consider if such a large allowance is necessary for security');
    }

  } catch (error) {
    errors.push({
      field: 'amount',
      code: 'CONVERSION_ERROR',
      message: 'Amount is too large to process',
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// Contract address validation with SIP-010 compliance checking
export const validateContractAddress = (contractAddress: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  if (!contractAddress) {
    errors.push({
      field: 'contractAddress',
      code: 'REQUIRED',
      message: 'Contract address is required',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, suggestions };
  }

  // Validate the address part
  const addressValidation = validateStacksAddress(contractAddress);
  if (!addressValidation.isValid) {
    errors.push(...addressValidation.errors.map(e => ({ ...e, field: 'contractAddress' })));
    suggestions.push(...addressValidation.suggestions);
  }

  // Add contract-specific warnings
  warnings.push({
    field: 'contractAddress',
    message: 'Verify this contract implements SIP-010 token standard',
    type: 'security'
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [...warnings, ...addressValidation.warnings],
    suggestions
  };
};

// Input sanitization to prevent injection attacks
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .slice(0, 1000); // Limit length to prevent DoS
};

// Comprehensive form validation
export const validateAllowanceForm = (
  spender: string,
  amount: string,
  contractAddress?: string,
  tokenDecimals: number = 0,
  maxAmount?: bigint
): ValidationResult => {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  const allSuggestions: string[] = [];

  // Validate spender address
  const spenderValidation = validateStacksAddress(sanitizeInput(spender));
  allErrors.push(...spenderValidation.errors);
  allWarnings.push(...spenderValidation.warnings);
  allSuggestions.push(...spenderValidation.suggestions);

  // Validate amount
  const amountValidation = validateAmount(sanitizeInput(amount), tokenDecimals, maxAmount);
  allErrors.push(...amountValidation.errors);
  allWarnings.push(...amountValidation.warnings);
  allSuggestions.push(...amountValidation.suggestions);

  // Validate contract address if provided
  if (contractAddress) {
    const contractValidation = validateContractAddress(sanitizeInput(contractAddress));
    allErrors.push(...contractValidation.errors);
    allWarnings.push(...contractValidation.warnings);
    allSuggestions.push(...contractValidation.suggestions);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions
  };
};

// Legacy compatibility functions
export const validateStacksAddressLegacy = (address: string): boolean => {
  const result = validateStacksAddress(address);
  return result.isValid;
};

export const validateAmountLegacy = (amount: string): { isValid: boolean; error?: string } => {
  const result = validateAmount(amount);
  return {
    isValid: result.isValid,
    error: result.errors[0]?.message
  };
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