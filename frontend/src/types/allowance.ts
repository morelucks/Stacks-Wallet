export interface Allowance {
  owner: string;
  spender: string;
  amount: bigint;
  contractAddress: string;
  contractName: string;
}

export interface AllowanceFormData {
  spender: string;
  amount: string;
}

export interface AllowanceState {
  allowances: Allowance[];
  loading: boolean;
  error: string | null;
}