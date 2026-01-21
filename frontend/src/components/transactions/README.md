# Transaction Management Components

This directory contains React components for managing and viewing transaction history in the Stacks wallet application.

## Components Overview

### TransactionsPage
The main page component that orchestrates all transaction functionality including:
- Wallet connection management
- Network configuration
- Transaction filtering, searching, and pagination
- Export functionality
- Integration of all transaction components

### TransactionList
Displays a list of transactions with detailed information.

**Features:**
- Clickable transaction items that open detailed modals
- Status indicators with color coding
- Address formatting for better readability
- Load more functionality for pagination
- Empty state handling

**Props:**
- `transactions`: Array of Transaction objects
- `loading`: Boolean indicating loading state
- `onLoadMore`: Optional callback for loading more transactions
- `hasMore`: Boolean indicating if more transactions are available

### TransactionDetail
Modal component showing comprehensive transaction details.

**Features:**
- Full transaction information display
- Copy-to-clipboard functionality for addresses and IDs
- Organized sections for different data types
- Responsive modal design
- Click outside to close

**Props:**
- `transaction`: Transaction object to display (nullable)
- `isOpen`: Boolean controlling modal visibility
- `onClose`: Callback function to close modal

### TransactionFilter
Advanced filtering component for transaction queries.

**Features:**
- Filter by transaction type, status, date range, and amount
- Collapsible interface to save space
- Real-time filter application
- Clear all filters functionality
- Form validation and disabled states

**Props:**
- `onFilterChange`: Callback function receiving filter object
- `loading`: Boolean indicating if filtering is in progress

### TransactionStats
Statistical overview component for transaction data.

**Features:**
- Total transaction count
- Status breakdown (confirmed, pending, failed)
- Volume calculations
- Average amount calculations
- Color-coded statistics

**Props:**
- `transactions`: Array of transactions for analysis
- `loading`: Boolean indicating loading state

### TransactionSearch
Search functionality for finding specific transactions.

**Features:**
- Search by transaction ID, addresses, or contract details
- Search tips and guidance
- Clear search functionality
- Real-time search validation

**Props:**
- `onSearch`: Callback function receiving search query
- `loading`: Boolean indicating search state

### TransactionPagination
Pagination component for large transaction datasets.

**Features:**
- Smart page number display with ellipsis
- Previous/Next navigation
- Current page highlighting
- Responsive design for mobile

**Props:**
- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `onPageChange`: Callback for page changes
- `loading`: Boolean indicating loading state

## Types and Interfaces

### Transaction
```typescript
interface Transaction {
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
```

### TransactionFilter
```typescript
interface TransactionFilter {
  type?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: bigint;
  maxAmount?: bigint;
}
```

### TransactionState
```typescript
interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}
```

## Services

### TransactionService
Service class for interacting with Stacks blockchain APIs.

**Methods:**
- `getTransactions(address, limit, offset, filter)`: Fetch transactions with filtering
- `mapTransactionType(txType)`: Convert API transaction types to internal types
- `applyFilters(transactions, filter)`: Apply client-side filtering

## Hooks

### useTransactions
Custom hook for managing transaction state and operations.

**Returns:**
- `transactions`: Current transactions array
- `loading`: Loading state
- `error`: Current error message
- `hasMore`: Whether more transactions are available
- `page`: Current page number
- `loadTransactions`: Function to load transactions
- `refreshTransactions`: Function to refresh transaction list
- `clearError`: Function to clear error state

## Utilities

### transactionExport.ts
Utility functions for exporting transaction data:

- `exportTransactionsToCSV(transactions)`: Export to CSV format
- `exportTransactionsToJSON(transactions)`: Export to JSON format
- `formatTransactionSummary(transactions)`: Generate summary statistics

## Styling

The components use a comprehensive CSS system with:
- Dark theme consistent with application design
- Responsive layouts for mobile and desktop
- Interactive hover effects and transitions
- Status-based color coding
- Accessible form controls and navigation

## API Integration

The transaction system integrates with Stacks blockchain APIs:
- Fetches transaction data from `/extended/v1/address/{address}/transactions`
- Supports pagination with limit and offset parameters
- Handles different transaction types and statuses
- Processes blockchain-specific data formats

## Usage Example

```typescript
import TransactionsPage from './pages/TransactionsPage';

// Add to router
{
  path: '/transactions',
  element: <TransactionsPage />,
}
```

## Error Handling

Comprehensive error handling for:
- Network connectivity issues
- API rate limiting
- Invalid transaction data
- Wallet connection problems
- Filter validation errors

## Performance Considerations

- Lazy loading of transaction data
- Efficient pagination to handle large datasets
- Debounced search functionality
- Optimized re-rendering with React hooks
- Memory-efficient bigint handling

## Accessibility Features

- Keyboard navigation support
- Screen reader friendly labels
- High contrast color schemes
- Focus management in modals
- Semantic HTML structure

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly button sizes
- Collapsible filter sections
- Optimized modal sizing
- Horizontal scroll prevention

## Future Enhancements

Potential improvements for the transaction system:
- Real-time transaction updates via WebSocket
- Advanced analytics and charting
- Transaction categorization and tagging
- Bulk operations on transactions
- Integration with external block explorers