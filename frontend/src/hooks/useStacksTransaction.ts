import { useState, useCallback } from 'react'
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  type Transaction,
} from '@stacks/transactions'
import { useStacksWallet } from '../context/StacksWalletContext'

export interface TransactionOptions {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: any[]
  fee?: number
  postConditionMode?: number
  anchorMode?: AnchorMode
}

export interface TransactionResult {
  txid: string
  status: 'pending' | 'confirmed' | 'failed'
  error?: string
}

export interface UseStacksTransactionState {
  isLoading: boolean
  error: string | null
  txid: string | null
  status: 'idle' | 'pending' | 'confirmed' | 'failed'
}

export function useStacksTransaction() {
  const { address, getNetwork } = useStacksWallet()
  const [state, setState] = useState<UseStacksTransactionState>({
    isLoading: false,
    error: null,
    txid: null,
    status: 'idle',
  })

  const executeTransaction = useCallback(
    async (options: TransactionOptions): Promise<TransactionResult | null> => {
      if (!address) {
        const error = 'Wallet not connected'
        setState((prev) => ({ ...prev, error, status: 'failed' }))
        return null
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        status: 'pending',
      }))

      try {
        const network = getNetwork()

        const txOptions = {
          contractAddress: options.contractAddress,
          contractName: options.contractName,
          functionName: options.functionName,
          functionArgs: options.functionArgs,
          senderKey: '', // Will be handled by wallet
          network,
          anchorMode: options.anchorMode || AnchorMode.Any,
          postConditionMode: options.postConditionMode || PostConditionMode.Allow,
          fee: options.fee || 150000,
        }

        // Create transaction
        const transaction = await makeContractCall(txOptions)

        // Broadcast transaction
        const response = await broadcastTransaction({
          transaction,
          network,
        })

        if ('error' in response) {
          throw new Error(response.error)
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          txid: response.txid,
          status: 'confirmed',
        }))

        return {
          txid: response.txid,
          status: 'confirmed',
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Transaction failed'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
          status: 'failed',
        }))

        return {
          txid: '',
          status: 'failed',
          error,
        }
      }
    },
    [address, getNetwork]
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txid: null,
      status: 'idle',
    })
  }, [])

  return {
    ...state,
    executeTransaction,
    reset,
  }
}
