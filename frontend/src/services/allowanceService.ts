import { 
  fetchCallReadOnlyFunction, 
  cvToJSON, 
  standardPrincipalCV, 
  uintCV,
  makeContractCall,
  broadcastTransaction,
  AnchorMode
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { Allowance } from '../types/allowance';

export class AllowanceService {
  constructor(
    private network: StacksNetwork,
    private contractAddress: string,
    private contractName: string
  ) {}

  async getAllowance(owner: string, spender: string): Promise<bigint> {
    try {
      const clarityValue = await fetchCallReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-allowance',
        functionArgs: [standardPrincipalCV(owner), standardPrincipalCV(spender)],
        senderAddress: this.contractAddress,
        network: this.network,
      });

      const json = cvToJSON(clarityValue) as any;
      if (json?.type === 'response' && json.success) {
        const value = json.value;
        if (value?.type === 'uint') {
          return BigInt(value.value);
        }
      }
      return BigInt(0);
    } catch (error) {
      console.error('Error fetching allowance:', error);
      return BigInt(0);
    }
  }

  async approveAllowance(
    spender: string, 
    amount: bigint, 
    senderKey: string
  ): Promise<string> {
    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'approve',
      functionArgs: [standardPrincipalCV(spender), uintCV(amount)],
      senderKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, this.network);
    
    if (broadcastResponse.error) {
      throw new Error(broadcastResponse.reason || 'Transaction failed');
    }
    
    return broadcastResponse.txid;
  }
}