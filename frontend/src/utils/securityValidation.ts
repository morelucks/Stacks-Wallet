import { ValidationResult, ValidationError, ValidationWarning } from '../types/allowance';

// Security-focused input sanitization
export const sanitizeForSecurity = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove HTML/XML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove SQL injection patterns
    .replace(/['";\\]/g, '')
    // Remove potential command injection
    .replace(/[|&;$`<>]/g, '')
    // Limit length to prevent DoS
    .slice(0, 500);
};

// High-risk operation detection
export const detectHighRiskOperation = (
  amount: bigint,
  spenderAddress: string,
  contractAddress: string
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check for unlimited allowance (common attack vector)
  const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  if (amount >= maxUint256 / BigInt(2)) {
    warnings.push({
      field: 'amount',
      message: 'This allowance grants nearly unlimited spending power',
      type: 'security'
    });
    suggestions.push('Consider setting a specific amount instead of unlimited allowance');
  }

  // Check for very large amounts (potential mistake or attack)
  const largeAmountThreshold = BigInt('1000000000000000000000'); // 1000 tokens with 18 decimals
  if (amount > largeAmountThreshold) {
    warnings.push({
      field: 'amount',
      message: 'This is an unusually large allowance amount',
      type: 'security'
    });
    suggestions.push('Verify this amount is correct and necessary');
  }

  // Check for known risky contract patterns
  if (contractAddress.toLowerCase().includes('test') || 
      contractAddress.toLowerCase().includes('fake') ||
      contractAddress.toLowerCase().includes('scam')) {
    warnings.push({
      field: 'contractAddress',
      message: 'Contract address contains potentially suspicious terms',
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

// Contract existence and SIP-010 compliance verification
export const validateContractCompliance = async (
  contractAddress: string,
  contractName: string,
  networkUrl: string
): Promise<ValidationResult> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  try {
    // Check if contract exists
    const contractInfoUrl = `${networkUrl}/v2/contracts/interface/${contractAddress}/${contractName}`;
    const response = await fetch(contractInfoUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        errors.push({
          field: 'contractAddress',
          code: 'CONTRACT_NOT_FOUND',
          message: 'Contract not found on the network',
          severity: 'error'
        });
        suggestions.push('Verify the contract address and name are correct');
      } else {
        warnings.push({
          field: 'contractAddress',
          message: 'Unable to verify contract existence',
          type: 'security'
        });
      }
      return { isValid: errors.length === 0, errors, warnings, suggestions };
    }

    const contractInfo = await response.json();
    
    // Check for SIP-010 compliance by looking for required functions
    const requiredFunctions = ['transfer', 'get-balance', 'get-total-supply', 'get-name', 'get-symbol', 'get-decimals'];
    const availableFunctions = contractInfo.functions?.map((f: any) => f.name) || [];
    
    const missingFunctions = requiredFunctions.filter(fn => !availableFunctions.includes(fn));
    
    if (missingFunctions.length > 0) {
      warnings.push({
        field: 'contractAddress',
        message: `Contract may not be SIP-010 compliant (missing: ${missingFunctions.join(', ')})`,
        type: 'security'
      });
      suggestions.push('Verify this contract implements the SIP-010 token standard');
    }

    // Check for allowance-related functions
    const allowanceFunctions = ['approve', 'allowance', 'transfer-from'];
    const hasAllowanceFunctions = allowanceFunctions.some(fn => availableFunctions.includes(fn));
    
    if (!hasAllowanceFunctions) {
      errors.push({
        field: 'contractAddress',
        code: 'NO_ALLOWANCE_SUPPORT',
        message: 'Contract does not appear to support allowance functionality',
        severity: 'error'
      });
      suggestions.push('This contract may not support the allowance feature');
    }

  } catch (error) {
    warnings.push({
      field: 'contractAddress',
      message: 'Unable to verify contract compliance due to network error',
      type: 'security'
    });
    suggestions.push('Check your network connection and try again');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// Maximum allowance warning system
export const validateAllowanceAmount = (
  amount: bigint,
  userBalance?: bigint,
  tokenDecimals: number = 18
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Convert to human-readable format for comparisons
  const divisor = BigInt(10 ** tokenDecimals);
  const humanAmount = Number(amount) / Number(divisor);

  // Check against user balance if available
  if (userBalance !== undefined) {
    if (amount > userBalance) {
      warnings.push({
        field: 'amount',
        message: 'Allowance exceeds your current token balance',
        type: 'usability'
      });
      suggestions.push('You can still set this allowance, but it will be limited by your actual balance');
    }

    // Warn if allowance is more than 10x user balance
    if (amount > userBalance * BigInt(10)) {
      warnings.push({
        field: 'amount',
        message: 'Allowance is significantly higher than your balance',
        type: 'security'
      });
    }
  }

  // Security thresholds
  if (humanAmount > 1000000) { // 1 million tokens
    warnings.push({
      field: 'amount',
      message: 'This is a very large allowance (>1M tokens)',
      type: 'security'
    });
    suggestions.push('Consider if such a large allowance is necessary');
  }

  if (humanAmount > 1000000000) { // 1 billion tokens
    errors.push({
      field: 'amount',
      code: 'EXCESSIVE_ALLOWANCE',
      message: 'Allowance amount is excessively large and may be a security risk',
      severity: 'warning'
    });
    suggestions.push('This amount seems unusually high. Please verify it is correct.');
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
    suggestions
  };
};

// High-risk action confirmation requirements
export const requiresAdditionalConfirmation = (
  amount: bigint,
  spenderAddress: string,
  contractAddress: string,
  userBalance?: bigint
): { required: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  // Large amount relative to balance
  if (userBalance && amount > userBalance / BigInt(2)) {
    reasons.push('Allowance is more than 50% of your balance');
  }

  // Very large absolute amount
  const largeThreshold = BigInt('1000000000000000000000'); // 1000 tokens with 18 decimals
  if (amount > largeThreshold) {
    reasons.push('Allowance amount is very large');
  }

  // Unlimited or near-unlimited allowance
  const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
  if (amount >= maxUint256 / BigInt(10)) {
    reasons.push('Allowance grants nearly unlimited spending power');
  }

  // Unknown or suspicious spender
  if (!spenderAddress.startsWith('SP') && !spenderAddress.startsWith('ST')) {
    reasons.push('Spender address format is unusual');
  }

  return {
    required: reasons.length > 0,
    reasons
  };
};

// Security-focused error message generation
export const generateSecurityErrorMessage = (
  validationResult: ValidationResult,
  context: 'allowance' | 'contract' | 'amount'
): string => {
  const securityErrors = validationResult.errors.filter(e => 
    e.message.toLowerCase().includes('security') ||
    e.message.toLowerCase().includes('risk') ||
    e.message.toLowerCase().includes('suspicious')
  );

  if (securityErrors.length > 0) {
    return `Security concern: ${securityErrors[0].message}`;
  }

  const securityWarnings = validationResult.warnings.filter(w => w.type === 'security');
  if (securityWarnings.length > 0) {
    return `Security warning: ${securityWarnings[0].message}`;
  }

  if (validationResult.errors.length > 0) {
    return validationResult.errors[0].message;
  }

  return 'Validation passed';
};

// Rate limiting for validation requests
class ValidationRateLimit {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

export const validationRateLimit = new ValidationRateLimit();