import { useState, useCallback } from 'react';
import { TransactionService } from '../services/transactionService';
import { Transaction, TransactionState, TransactionFilter } from '../types/transaction';

export const useTransactions = (transactionService: TransactionService | null) => {
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 0,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const loadTransactions = useCallback(async (
    address: string,
    reset: boolean = false,
    filter?: TransactionFilter
  ) => {
    if (!transactionService) {
      throw new Error('Transaction service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : state.page;
      const offset = currentPage * 20;
      
      const { transactions, total } = await transactionService.getTransactions(
        address, 
        20, 
        offset, 
        filter
      );

      setState(prev => ({
        ...prev,
        transactions: reset ? transactions : [...prev.transactions, ...transactions],
        hasMore: offset + transactions.length < total,
        page: currentPage + 1,
        loading: false
      }));
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load transactions';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  }, [transactionService, state.page, setLoading, setError]);

  const refreshTransactions = useCallback(async (address: string, filter?: TransactionFilter) => {
    setState(prev => ({ ...prev, page: 0, hasMore: true }));
    await loadTransactions(address, true, filter);
  }, [loadTransactions]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    ...state,
    loadTransactions,
    refreshTransactions,
    clearError,
  };
};