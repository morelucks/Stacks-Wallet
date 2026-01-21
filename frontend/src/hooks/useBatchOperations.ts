/**
 * Hook for batch contract operations
 * Allows executing multiple contract calls in sequence
 */

import { useState, useCallback } from "react";
import { useContractCall } from "./useContractCall";
import type { CallContractParams } from "./useContractCall";

export interface BatchOperation {
  id: string;
  params: CallContractParams;
  status: "pending" | "success" | "failed";
  txId?: string;
  error?: string;
}

export interface UseBatchOperationsReturn {
  operations: BatchOperation[];
  isExecuting: boolean;
  execute: (operations: CallContractParams[]) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for batch contract operations
 */
export function useBatchOperations(): UseBatchOperationsReturn {
  const { call } = useContractCall();
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const execute = useCallback(async (ops: CallContractParams[]) => {
    setIsExecuting(true);

    // Initialize operations
    const batchOps: BatchOperation[] = ops.map((params, index) => ({
      id: `op-${index}`,
      params,
      status: "pending" as const,
    }));

    setOperations(batchOps);

    // Execute operations sequentially
    for (let i = 0; i < batchOps.length; i++) {
      const op = batchOps[i];
      
      try {
        setOperations((prev) =>
          prev.map((p) => (p.id === op.id ? { ...p, status: "pending" } : p))
        );

        const txId = await call(op.params);

        if (txId) {
          setOperations((prev) =>
            prev.map((p) =>
              p.id === op.id ? { ...p, status: "success", txId } : p
            )
          );
        } else {
          setOperations((prev) =>
            prev.map((p) =>
              p.id === op.id
                ? { ...p, status: "failed", error: "Transaction failed or was cancelled" }
                : p
            )
          );
        }

        // Small delay between operations
        if (i < batchOps.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err: any) {
        setOperations((prev) =>
          prev.map((p) =>
            p.id === op.id
              ? { ...p, status: "failed", error: err.message || "Unknown error" }
              : p
          )
        );
      }
    }

    setIsExecuting(false);
  }, [call]);

  const clear = useCallback(() => {
    setOperations([]);
  }, []);

  return {
    operations,
    isExecuting,
    execute,
    clear,
  };
}

