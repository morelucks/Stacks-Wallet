export interface Transaction {
  txid: string;
  sender: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
  blockHeight: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'mint' | 'approve' | 'contract-call';
  contractAddress?: string;
  functionName?: string;
  memo?: string;
}

export interface TransactionFilter {
  type?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: bigint;
  maxAmount?: bigint;
}

export interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}