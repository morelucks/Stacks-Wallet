import { Transaction } from '../types/transaction';

export const exportTransactionsToCSV = (transactions: Transaction[]): void => {
  const headers = [
    'Transaction ID',
    'Type',
    'Status',
    'Sender',
    'Recipient',
    'Amount',
    'Fee',
    'Block Height',
    'Date',
    'Contract Address',
    'Function Name',
    'Memo'
  ];

  const csvContent = [
    headers.join(','),
    ...transactions.map(tx => [
      tx.txid,
      tx.type,
      tx.status,
      tx.sender,
      tx.recipient || '',
      tx.amount.toString(),
      tx.fee.toString(),
      tx.blockHeight.toString(),
      new Date(tx.timestamp).toISOString(),
      tx.contractAddress || '',
      tx.functionName || '',
      tx.memo || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportTransactionsToJSON = (transactions: Transaction[]): void => {
  const jsonContent = JSON.stringify(transactions, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }, 2);

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const formatTransactionSummary = (transactions: Transaction[]): string => {
  const summary = {
    totalTransactions: transactions.length,
    confirmedTransactions: transactions.filter(tx => tx.status === 'confirmed').length,
    pendingTransactions: transactions.filter(tx => tx.status === 'pending').length,
    failedTransactions: transactions.filter(tx => tx.status === 'failed').length,
    totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, BigInt(0)).toString(),
    dateRange: {
      from: transactions.length > 0 ? new Date(Math.min(...transactions.map(tx => tx.timestamp))).toISOString() : null,
      to: transactions.length > 0 ? new Date(Math.max(...transactions.map(tx => tx.timestamp))).toISOString() : null
    }
  };

  return JSON.stringify(summary, null, 2);
};