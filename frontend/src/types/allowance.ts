// Enhanced Allowance interface with metadata support
export interface Allowance {
  id: string;
  owner: string;
  spender: string;
  amount: bigint;
  contractAddress: string;
  contractName: string;
  createdAt: Date;
  updatedAt: Date;
  transactionHash: string;
  status: 'active' | 'expired' | 'revoked';
  expirationDate?: Date;
  metadata?: AllowanceMetadata;
}

export interface AllowanceMetadata {
  purpose?: string;
  tags: string[];
  notes?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Enhanced form data interface
export interface AllowanceFormData {
  spender: string;
  amount: string;
  purpose?: string;
  tags?: string[];
  notes?: string;
  expirationDate?: Date;
}

// Transaction state management
export interface TransactionState {
  id: string;
  type: TransactionType;
  status: 'pending' | 'confirmed' | 'failed';
  progress: number;
  estimatedCompletion?: Date;
  error?: TransactionError;
  retryCount: number;
}

export type TransactionType = 'approve' | 'revoke' | 'bulk_revoke' | 'bulk_approve';

export interface TransactionError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

// Filter and search interfaces
export interface AllowanceFilters {
  search: string;
  contractAddress?: string;
  spenderAddress?: string;
  amountRange?: { min: bigint; max: bigint };
  dateRange?: { start: Date; end: Date };
  status?: 'active' | 'expired' | 'revoked';
  riskLevel?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface FilterState {
  activeFilters: AllowanceFilters;
  savedFilters: SavedFilter[];
  searchHistory: string[];
  sortOrder: SortConfiguration;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: AllowanceFilters;
  createdAt: Date;
}

export interface SortConfiguration {
  field: keyof Allowance;
  direction: 'asc' | 'desc';
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  type: 'security' | 'performance' | 'usability';
}

// Bulk operations
export interface BulkOperation {
  id: string;
  type: 'revoke' | 'approve' | 'modify';
  allowanceIds: string[];
  progress: OperationProgress;
  results: OperationResult[];
  startedAt: Date;
  completedAt?: Date;
}

export interface OperationProgress {
  total: number;
  completed: number;
  failed: number;
  currentItem?: string;
}

export interface OperationResult {
  allowanceId: string;
  success: boolean;
  transactionHash?: string;
  error?: string;
}

// Export/Import interfaces
export interface ExportOptions {
  format: 'csv' | 'json';
  includeRevoked: boolean;
  dateRange?: { start: Date; end: Date };
  fields: ExportField[];
}

export type ExportField = 'spender' | 'amount' | 'contract' | 'createdAt' | 'status' | 'metadata';

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

// Notification system
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// Loading states
export interface LoadingState {
  allowances: boolean;
  transaction: boolean;
  validation: boolean;
  export: boolean;
  import: boolean;
}

export interface ErrorState {
  allowances?: string;
  transaction?: string;
  validation?: string;
  export?: string;
  import?: string;
  network?: string;
}

// Enhanced allowance state
export interface AllowanceState {
  allowances: Allowance[];
  filteredAllowances: Allowance[];
  selectedAllowances: string[];
  filters: AllowanceFilters;
  loading: LoadingState;
  errors: ErrorState;
  notifications: Notification[];
  transactions: TransactionState[];
  bulkOperations: BulkOperation[];
}