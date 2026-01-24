import { useState, useCallback, useRef, useEffect } from 'react';
import { TransactionState, TransactionType, TransactionError } from '../types/allowance';

interface TransactionManagerOptions {
  maxConcurrentTransactions?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onTransactionUpdate?: (transaction: TransactionState) => void;
  onTransactionComplete?: (transaction: TransactionState) => void;
  onTransactionFailed?: (transaction: TransactionState) => void;
}

export const useTransactionManager = (options: TransactionManagerOptions = {}) => {
  const {
    maxConcurrentTransactions = 5,
    retryAttempts = 3,
    retryDelay = 1000,
    onTransactionUpdate,
    onTransactionComplete,
    onTransactionFailed
  } = options;

  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, []);

  const createTransaction = useCallback((
    type: TransactionType,
    id?: string
  ): TransactionState => {
    const transactionId = id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: transactionId,
      type,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      estimatedCompletion: new Date(Date.now() + 30000) // 30 seconds estimate
    };
  }, []);

  const updateTransaction = useCallback((
    transactionId: string,
    updates: Partial<TransactionState>
  ) => {
    setTransactions(prev => {
      const updated = prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, ...updates }
          : tx
      );
      
      const updatedTransaction = updated.find(tx => tx.id === transactionId);
      if (updatedTransaction && onTransactionUpdate) {
        onTransactionUpdate(updatedTransaction);
      }
      
      return updated;
    });
  }, [onTransactionUpdate]);

  const addTransaction = useCallback((transaction: TransactionState) => {
    setTransactions(prev => [...prev, transaction]);
    if (onTransactionUpdate) {
      onTransactionUpdate(transaction);
    }
  }, [onTransactionUpdate]);

  const removeTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    
    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(transactionId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(transactionId);
    }
  }, []);

  const retryTransaction = useCallback(async (
    transactionId: string,
    executeFunction: () => Promise<any>
  ) => {
    const transaction = transactions.find(tx => tx.id === transactionId);
    if (!transaction || transaction.retryCount >= retryAttempts) {
      return false;
    }

    const retryCount = transaction.retryCount + 1;
    const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff

    updateTransaction(transactionId, {
      retryCount,
      status: 'pending',
      progress: 0,
      estimatedCompletion: new Date(Date.now() + delay + 30000)
    });

    const timeout = setTimeout(async () => {
      try {
        await executeFunction();
        updateTransaction(transactionId, {
          status: 'confirmed',
          progress: 100,
          error: undefined
        });
        
        const updatedTransaction = transactions.find(tx => tx.id === transactionId);
        if (updatedTransaction && onTransactionComplete) {
          onTransactionComplete({ ...updatedTransaction, status: 'confirmed', progress: 100 });
        }
      } catch (error) {
        const transactionError: TransactionError = {
          code: 'RETRY_FAILED',
          message: error instanceof Error ? error.message : 'Transaction failed after retry',
          recoverable: retryCount < retryAttempts,
          suggestedAction: retryCount < retryAttempts ? 'Will retry automatically' : 'Manual intervention required'
        };

        updateTransaction(transactionId, {
          status: 'failed',
          error: transactionError
        });

        const failedTransaction = transactions.find(tx => tx.id === transactionId);
        if (failedTransaction && onTransactionFailed) {
          onTransactionFailed({ ...failedTransaction, status: 'failed', error: transactionError });
        }
      }
      
      retryTimeouts.current.delete(transactionId);
    }, delay);

    retryTimeouts.current.set(transactionId, timeout);
    return true;
  }, [transactions, retryAttempts, retryDelay, updateTransaction, onTransactionComplete, onTransactionFailed]);

  const executeTransaction = useCallback(async (
    type: TransactionType,
    executeFunction: () => Promise<any>,
    options: { id?: string; estimatedDuration?: number } = {}
  ): Promise<string> => {
    const transaction = createTransaction(type, options.id);
    
    if (options.estimatedDuration) {
      transaction.estimatedCompletion = new Date(Date.now() + options.estimatedDuration);
    }

    addTransaction(transaction);
    setIsProcessing(true);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        updateTransaction(transaction.id, {
          progress: Math.min(90, (Date.now() - parseInt(transaction.id.split('_')[1])) / 1000 * 3)
        });
      }, 1000);

      const result = await executeFunction();
      
      clearInterval(progressInterval);
      
      updateTransaction(transaction.id, {
        status: 'confirmed',
        progress: 100,
        error: undefined
      });

      if (onTransactionComplete) {
        const completedTransaction = { ...transaction, status: 'confirmed' as const, progress: 100 };
        onTransactionComplete(completedTransaction);
      }

      return transaction.id;
    } catch (error) {
      const transactionError: TransactionError = {
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Transaction execution failed',
        details: error,
        recoverable: true,
        suggestedAction: 'Click retry to attempt the transaction again'
      };

      updateTransaction(transaction.id, {
        status: 'failed',
        error: transactionError
      });

      if (onTransactionFailed) {
        const failedTransaction = { ...transaction, status: 'failed' as const, error: transactionError };
        onTransactionFailed(failedTransaction);
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [createTransaction, addTransaction, updateTransaction, onTransactionComplete, onTransactionFailed]);

  const getActiveTransactions = useCallback(() => {
    return transactions.filter(tx => tx.status === 'pending');
  }, [transactions]);

  const getFailedTransactions = useCallback(() => {
    return transactions.filter(tx => tx.status === 'failed');
  }, [transactions]);

  const getCompletedTransactions = useCallback(() => {
    return transactions.filter(tx => tx.status === 'confirmed');
  }, [transactions]);

  const canStartNewTransaction = useCallback(() => {
    return getActiveTransactions().length < maxConcurrentTransactions;
  }, [getActiveTransactions, maxConcurrentTransactions]);

  const clearCompletedTransactions = useCallback(() => {
    setTransactions(prev => prev.filter(tx => tx.status !== 'confirmed'));
  }, []);

  const clearFailedTransactions = useCallback(() => {
    setTransactions(prev => prev.filter(tx => tx.status !== 'failed'));
  }, []);

  const getTransactionById = useCallback((id: string) => {
    return transactions.find(tx => tx.id === id);
  }, [transactions]);

  const cancelTransaction = useCallback((transactionId: string) => {
    const timeout = retryTimeouts.current.get(transactionId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(transactionId);
    }
    
    updateTransaction(transactionId, {
      status: 'failed',
      error: {
        code: 'CANCELLED',
        message: 'Transaction was cancelled by user',
        recoverable: false,
        suggestedAction: 'Start a new transaction if needed'
      }
    });
  }, [updateTransaction]);

  return {
    transactions,
    isProcessing,
    executeTransaction,
    updateTransaction,
    removeTransaction,
    retryTransaction,
    getActiveTransactions,
    getFailedTransactions,
    getCompletedTransactions,
    canStartNewTransaction,
    clearCompletedTransactions,
    clearFailedTransactions,
    getTransactionById,
    cancelTransaction
  };
};