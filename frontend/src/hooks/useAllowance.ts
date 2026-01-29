import { useState, useCallback } from 'react';
import { AllowanceService } from '../services/allowanceService';
import { Allowance, AllowanceState } from '../types/allowance';

export const useAllowance = (allowanceService: AllowanceService | null) => {
  const [state, setState] = useState<AllowanceState>({
    allowances: [],
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const getAllowance = useCallback(async (owner: string, spender: string): Promise<bigint> => {
    if (!allowanceService) {
      throw new Error('Allowance service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const amount = await allowanceService.getAllowance(owner, spender);
      return amount;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch allowance';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [allowanceService, setLoading, setError]);

  const approveAllowance = useCallback(async (
    spender: string, 
    amount: bigint, 
    senderKey: string
  ): Promise<string> => {
    if (!allowanceService) {
      throw new Error('Allowance service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const txid = await allowanceService.approveAllowance(spender, amount, senderKey);
      return txid;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to approve allowance';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [allowanceService, setLoading, setError]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    ...state,
    getAllowance,
    approveAllowance,
    clearError,
  };
};