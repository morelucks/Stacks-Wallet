import { TransactionError } from '../types/allowance';

// Error classification and analysis
export interface ErrorAnalysis {
  category: 'network' | 'contract' | 'validation' | 'user' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedActions: string[];
  technicalDetails?: string;
  userFriendlyMessage: string;
  retryable: boolean;
  retryDelay?: number;
}

// Network error patterns
const NETWORK_ERROR_PATTERNS = [
  { pattern: /network|fetch|connection/i, type: 'CONNECTION_ERROR' },
  { pattern: /timeout/i, type: 'TIMEOUT_ERROR' },
  { pattern: /cors|cross-origin/i, type: 'CORS_ERROR' },
  { pattern: /502|503|504/i, type: 'SERVER_ERROR' },
  { pattern: /rate limit|too many requests/i, type: 'RATE_LIMIT_ERROR' }
];

// Contract error patterns
const CONTRACT_ERROR_PATTERNS = [
  { pattern: /insufficient funds|balance/i, type: 'INSUFFICIENT_FUNDS' },
  { pattern: /gas|fee/i, type: 'GAS_ERROR' },
  { pattern: /nonce/i, type: 'NONCE_ERROR' },
  { pattern: /contract not found/i, type: 'CONTRACT_NOT_FOUND' },
  { pattern: /function not found/i, type: 'FUNCTION_NOT_FOUND' },
  { pattern: /unauthorized|permission/i, type: 'PERMISSION_ERROR' },
  { pattern: /allowance|approve/i, type: 'ALLOWANCE_ERROR' }
];

// Analyze error and provide detailed information
export const analyzeError = (error: any): ErrorAnalysis => {
  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  
  // Check for network errors
  for (const pattern of NETWORK_ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      return analyzeNetworkError(pattern.type, errorMessage, error);
    }
  }
  
  // Check for contract errors
  for (const pattern of CONTRACT_ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      return analyzeContractError(pattern.type, errorMessage, error);
    }
  }
  
  // Default analysis for unknown errors
  return {
    category: 'system',
    severity: 'medium',
    recoverable: true,
    suggestedActions: [
      'Try the operation again',
      'Check your network connection',
      'Contact support if the problem persists'
    ],
    userFriendlyMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    retryDelay: 5000,
    technicalDetails: errorMessage
  };
};

const analyzeNetworkError = (type: string, message: string, error: any): ErrorAnalysis => {
  switch (type) {
    case 'CONNECTION_ERROR':
      return {
        category: 'network',
        severity: 'high',
        recoverable: true,
        suggestedActions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Switch to a different network if available'
        ],
        userFriendlyMessage: 'Unable to connect to the network. Please check your internet connection.',
        retryable: true,
        retryDelay: 10000,
        technicalDetails: message
      };
      
    case 'TIMEOUT_ERROR':
      return {
        category: 'network',
        severity: 'medium',
        recoverable: true,
        suggestedActions: [
          'The request is taking longer than expected',
          'Wait a moment and try again',
          'Check if the network is experiencing high traffic'
        ],
        userFriendlyMessage: 'The request timed out. The network may be busy.',
        retryable: true,
        retryDelay: 15000,
        technicalDetails: message
      };
      
    case 'RATE_LIMIT_ERROR':
      return {
        category: 'network',
        severity: 'medium',
        recoverable: true,
        suggestedActions: [
          'You are making requests too quickly',
          'Wait a few minutes before trying again',
          'Reduce the frequency of your requests'
        ],
        userFriendlyMessage: 'Too many requests. Please wait before trying again.',
        retryable: true,
        retryDelay: 60000,
        technicalDetails: message
      };
      
    case 'SERVER_ERROR':
      return {
        category: 'network',
        severity: 'high',
        recoverable: true,
        suggestedActions: [
          'The server is temporarily unavailable',
          'Try again in a few minutes',
          'Check the network status page'
        ],
        userFriendlyMessage: 'The server is temporarily unavailable. Please try again later.',
        retryable: true,
        retryDelay: 30000,
        technicalDetails: message
      };
      
    default:
      return {
        category: 'network',
        severity: 'medium',
        recoverable: true,
        suggestedActions: ['Check your network connection and try again'],
        userFriendlyMessage: 'Network error occurred. Please try again.',
        retryable: true,
        retryDelay: 5000,
        technicalDetails: message
      };
  }
};

const analyzeContractError = (type: string, message: string, error: any): ErrorAnalysis => {
  switch (type) {
    case 'INSUFFICIENT_FUNDS':
      return {
        category: 'user',
        severity: 'high',
        recoverable: false,
        suggestedActions: [
          'Check your token balance',
          'Ensure you have enough tokens for this transaction',
          'Consider reducing the allowance amount'
        ],
        userFriendlyMessage: 'Insufficient funds. You don\'t have enough tokens for this transaction.',
        retryable: false,
        technicalDetails: message
      };
      
    case 'GAS_ERROR':
      return {
        category: 'user',
        severity: 'medium',
        recoverable: true,
        suggestedActions: [
          'Check your STX balance for transaction fees',
          'Try again when network congestion is lower',
          'Increase the gas limit if possible'
        ],
        userFriendlyMessage: 'Transaction fee issue. Check your STX balance or try again later.',
        retryable: true,
        retryDelay: 30000,
        technicalDetails: message
      };
      
    case 'CONTRACT_NOT_FOUND':
      return {
        category: 'validation',
        severity: 'high',
        recoverable: false,
        suggestedActions: [
          'Verify the contract address is correct',
          'Check if you\'re on the right network (mainnet/testnet)',
          'Ensure the contract has been deployed'
        ],
        userFriendlyMessage: 'Contract not found. Please verify the contract address.',
        retryable: false,
        technicalDetails: message
      };
      
    case 'PERMISSION_ERROR':
      return {
        category: 'user',
        severity: 'high',
        recoverable: false,
        suggestedActions: [
          'Ensure you\'re the owner of the tokens',
          'Check if the allowance has already been set',
          'Verify you have permission to perform this action'
        ],
        userFriendlyMessage: 'Permission denied. You may not have the required permissions.',
        retryable: false,
        technicalDetails: message
      };
      
    case 'ALLOWANCE_ERROR':
      return {
        category: 'contract',
        severity: 'medium',
        recoverable: true,
        suggestedActions: [
          'Check if the allowance amount is valid',
          'Verify the spender address is correct',
          'Try setting a different allowance amount'
        ],
        userFriendlyMessage: 'Allowance operation failed. Please check the details and try again.',
        retryable: true,
        retryDelay: 5000,
        technicalDetails: message
      };
      
    default:
      return {
        category: 'contract',
        severity: 'medium',
        recoverable: true,
        suggestedActions: [
          'Check the transaction parameters',
          'Verify the contract is functioning correctly',
          'Try the operation again'
        ],
        userFriendlyMessage: 'Contract interaction failed. Please try again.',
        retryable: true,
        retryDelay: 10000,
        technicalDetails: message
      };
  }
};

// Extract error message from various error formats
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.reason) {
    return error.reason;
  }
  
  if (error?.data?.message) {
    return error.data.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  return 'Unknown error occurred';
};

// Extract error code from various error formats
const getErrorCode = (error: any): string | undefined => {
  if (error?.code) {
    return error.code.toString();
  }
  
  if (error?.status) {
    return error.status.toString();
  }
  
  if (error?.data?.code) {
    return error.data.code.toString();
  }
  
  return undefined;
};

// Create TransactionError from analysis
export const createTransactionError = (error: any): TransactionError => {
  const analysis = analyzeError(error);
  
  return {
    code: getErrorCode(error) || 'UNKNOWN_ERROR',
    message: analysis.userFriendlyMessage,
    details: analysis.technicalDetails,
    recoverable: analysis.recoverable,
    suggestedAction: analysis.suggestedActions[0] || 'Try again later'
  };
};

// Error recovery strategies
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  
  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }
  
  shouldRetry(errorId: string, error: any): boolean {
    const analysis = analyzeError(error);
    const attempts = this.retryAttempts.get(errorId) || 0;
    
    return analysis.retryable && attempts < this.maxRetries;
  }
  
  getRetryDelay(errorId: string, error: any): number {
    const analysis = analyzeError(error);
    const attempts = this.retryAttempts.get(errorId) || 0;
    
    // Exponential backoff with jitter
    const baseDelay = analysis.retryDelay || 5000;
    const exponentialDelay = baseDelay * Math.pow(2, attempts);
    const jitter = Math.random() * 1000;
    
    return exponentialDelay + jitter;
  }
  
  recordRetryAttempt(errorId: string): void {
    const attempts = this.retryAttempts.get(errorId) || 0;
    this.retryAttempts.set(errorId, attempts + 1);
  }
  
  clearRetryHistory(errorId: string): void {
    this.retryAttempts.delete(errorId);
  }
  
  getRetryCount(errorId: string): number {
    return this.retryAttempts.get(errorId) || 0;
  }
}

// Privacy-protected error logging
export class PrivacyProtectedLogger {
  private sensitivePatterns = [
    /private.?key/i,
    /seed.?phrase/i,
    /mnemonic/i,
    /password/i,
    /secret/i,
    /token/i,
    /ST[0-9A-Z]{39}/g, // Stacks addresses
    /SP[0-9A-Z]{39}/g  // Stacks addresses
  ];
  
  sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
  
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }
  
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'privateKey', 'private_key', 'secretKey', 'secret_key',
      'password', 'token', 'seed', 'mnemonic', 'phrase'
    ];
    
    return sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    );
  }
  
  logError(error: any, context?: string): void {
    const sanitizedError = this.sanitizeForLogging(error);
    const analysis = analyzeError(error);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      error: sanitizedError,
      analysis: {
        category: analysis.category,
        severity: analysis.severity,
        recoverable: analysis.recoverable
      }
    };
    
    // In a real application, this would send to a logging service
    console.error('Error logged:', logEntry);
  }
}

// Troubleshooting guide generator
export const generateTroubleshootingGuide = (error: any): string[] => {
  const analysis = analyzeError(error);
  
  const baseGuide = [
    '1. Check your internet connection',
    '2. Refresh the page and try again',
    '3. Clear your browser cache and cookies'
  ];
  
  const categorySpecificGuide: Record<string, string[]> = {
    network: [
      '4. Try switching to a different network',
      '5. Check if the Stacks network is experiencing issues',
      '6. Wait a few minutes and retry'
    ],
    contract: [
      '4. Verify the contract address is correct',
      '5. Check if you\'re on the right network (mainnet/testnet)',
      '6. Ensure you have sufficient STX for transaction fees'
    ],
    user: [
      '4. Check your wallet balance',
      '5. Verify you have the necessary permissions',
      '6. Review the transaction parameters'
    ],
    validation: [
      '4. Double-check all input values',
      '5. Ensure addresses are in the correct format',
      '6. Verify amounts are within valid ranges'
    ]
  };
  
  const specificGuide = categorySpecificGuide[analysis.category] || [];
  
  return [
    ...baseGuide,
    ...specificGuide,
    '7. Contact support if the problem persists'
  ];
};

// Global error recovery manager instance
export const errorRecoveryManager = new ErrorRecoveryManager();
export const privacyProtectedLogger = new PrivacyProtectedLogger();