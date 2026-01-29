import { StacksNetwork } from '@stacks/network';
import { Transaction, TransactionFilter } from '../types/transaction';

export class TransactionService {
  constructor(private network: StacksNetwork) {}

  async getTransactions(
    address: string, 
    limit: number = 20, 
    offset: number = 0,
    filter?: TransactionFilter
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const baseUrl = this.network.client.baseUrl;
      const url = new URL(`${baseUrl}/extended/v1/address/${address}/transactions`);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());

      if (filter?.type) {
        url.searchParams.set('type', filter.type);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const transactions: Transaction[] = data.results.map((tx: any) => ({
        txid: tx.tx_id,
        sender: tx.sender_address,
        recipient: tx.token_transfer?.recipient_address || '',
        amount: BigInt(tx.token_transfer?.amount || 0),
        fee: BigInt(tx.fee_rate || 0),
        blockHeight: tx.block_height || 0,
        timestamp: new Date(tx.burn_block_time_iso).getTime(),
        status: tx.tx_status === 'success' ? 'confirmed' : 
                tx.tx_status === 'pending' ? 'pending' : 'failed',
        type: this.mapTransactionType(tx.tx_type),
        contractAddress: tx.contract_call?.contract_id?.split('.')[0],
        functionName: tx.contract_call?.function_name,
        memo: tx.token_transfer?.memo
      }));

      return {
        transactions: this.applyFilters(transactions, filter),
        total: data.total
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  private mapTransactionType(txType: string): Transaction['type'] {
    switch (txType) {
      case 'token_transfer': return 'transfer';
      case 'contract_call': return 'contract-call';
      case 'coinbase': return 'mint';
      default: return 'transfer';
    }
  }

  private applyFilters(transactions: Transaction[], filter?: TransactionFilter): Transaction[] {
    if (!filter) return transactions;

    return transactions.filter(tx => {
      if (filter.status && tx.status !== filter.status) return false;
      if (filter.dateFrom && tx.timestamp < filter.dateFrom.getTime()) return false;
      if (filter.dateTo && tx.timestamp > filter.dateTo.getTime()) return false;
      if (filter.minAmount && tx.amount < filter.minAmount) return false;
      if (filter.maxAmount && tx.amount > filter.maxAmount) return false;
      return true;
    });
  }
}