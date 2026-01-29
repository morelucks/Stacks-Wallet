# Allowance Management Components

This directory contains React components for managing token allowances in the Stacks wallet application.

## Components

### AllowancePage
The main page component that orchestrates the allowance management functionality. It includes:
- Wallet connection management
- Contract configuration
- Integration of all allowance components

### AllowanceForm
A form component for approving new token allowances.

**Features:**
- Input validation for Stacks addresses and amounts
- Real-time error feedback
- Loading states during transaction processing
- Clear error messaging

**Props:**
- `onSubmit`: Callback function when form is submitted
- `loading`: Boolean indicating if a transaction is in progress
- `error`: Error message to display
- `onClearError`: Function to clear error messages

### AllowanceChecker
A component for checking existing allowances between owner and spender addresses.

**Features:**
- Query allowances for any owner/spender pair
- Quick-fill with connected wallet address
- Display current allowance amounts
- Error handling for failed queries

**Props:**
- `onCheck`: Function to check allowance (returns Promise<bigint>)
- `loading`: Boolean indicating if check is in progress
- `connectedAddress`: Optional connected wallet address for quick-fill

### AllowanceList
A component for displaying a list of existing allowances.

**Features:**
- Grid layout for allowance items
- Address formatting for better readability
- Optional revoke functionality
- Responsive design

**Props:**
- `allowances`: Array of Allowance objects to display
- `loading`: Boolean indicating if data is loading
- `onRevoke`: Optional callback for revoking allowances

## Types

### Allowance
```typescript
interface Allowance {
  owner: string;
  spender: string;
  amount: bigint;
  contractAddress: string;
  contractName: string;
}
```

### AllowanceFormData
```typescript
interface AllowanceFormData {
  spender: string;
  amount: string;
}
```

### AllowanceState
```typescript
interface AllowanceState {
  allowances: Allowance[];
  loading: boolean;
  error: string | null;
}
```

## Services

### AllowanceService
A service class for interacting with token contracts for allowance operations.

**Methods:**
- `getAllowance(owner, spender)`: Fetch current allowance amount
- `approveAllowance(spender, amount, senderKey)`: Approve new allowance

## Hooks

### useAllowance
A custom hook for managing allowance state and operations.

**Returns:**
- `allowances`: Current allowances array
- `loading`: Loading state
- `error`: Current error message
- `getAllowance`: Function to fetch allowance
- `approveAllowance`: Function to approve allowance
- `clearError`: Function to clear errors

## Validation

### allowanceValidation.ts
Utility functions for validating user input:

- `validateStacksAddress(address)`: Validates Stacks address format
- `validateAmount(amount)`: Validates allowance amounts
- `formatAllowanceError(error)`: Formats error messages consistently

## Styling

The components use CSS modules with the following features:
- Dark theme consistent with the application
- Responsive grid layouts
- Form validation styling
- Hover effects and transitions
- Error and success message styling

## Usage Example

```typescript
import AllowancePage from './pages/AllowancePage';

// Add to router
{
  path: '/allowances',
  element: <AllowancePage />,
}
```

## Contract Integration

The allowance functionality integrates with SIP-010 compliant token contracts that implement:
- `get-allowance(owner, spender)`: Read-only function to check allowances
- `approve(spender, amount)`: Public function to set allowances

## Error Handling

The components provide comprehensive error handling for:
- Network connectivity issues
- Invalid contract addresses
- Transaction failures
- Input validation errors
- Wallet connection problems

## Accessibility

The components follow accessibility best practices:
- Proper form labels and ARIA attributes
- Keyboard navigation support
- Screen reader friendly error messages
- High contrast color schemes