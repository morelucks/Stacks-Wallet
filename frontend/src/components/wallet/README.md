# Wallet Member Management Components

This directory contains components for managing members in multi-signature wallets.

## Components

### AddMemberComponent
The main component that orchestrates the entire member management interface.

```tsx
import { AddMemberComponent } from './components/wallet'

function MyWalletPage() {
  return (
    <AddMemberComponent
      walletAddress="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      onMemberAdded={(member) => console.log('Member added:', member)}
      onError={(error) => console.error('Error:', error)}
    />
  )
}
```

**Props:**
- `walletAddress: string` - The admin's wallet address
- `onMemberAdded?: (member: AddMemberParams) => void` - Callback when member is successfully added
- `onError?: (error: string) => void` - Callback for error handling
- `className?: string` - Additional CSS classes

### AddMemberForm
Form component for adding new members with validation and transaction handling.

**Features:**
- Real-time validation for all form fields
- Transaction state management (idle, pending, success, error)
- Automatic form reset on successful submission
- Comprehensive error handling with user-friendly messages

### WalletInfoDisplay
Displays current wallet information including balance, member count, and admin address.

**Features:**
- Loading states with skeleton animations
- Responsive grid layout
- Real-time balance updates
- Formatted STX amounts

### MemberListComponent
Displays a list of current wallet members with their information and status.

**Features:**
- Visual status indicators (active, frozen, inactive)
- Empty state handling
- Member information display (name, address, spend limit, role)
- Loading states

## Usage Examples

### Basic Usage
```tsx
import { AddMemberComponent } from './components/wallet'

<AddMemberComponent walletAddress={userAddress} />
```

### With Callbacks
```tsx
import { AddMemberComponent } from './components/wallet'

<AddMemberComponent
  walletAddress={userAddress}
  onMemberAdded={(member) => {
    // Handle successful member addition
    showSuccessMessage(`Added ${member.memberName}`)
    refreshWalletData()
  }}
  onError={(error) => {
    // Handle errors
    showErrorMessage(error)
  }}
/>
```

### Individual Components
```tsx
import { 
  WalletInfoDisplay, 
  AddMemberForm, 
  MemberListComponent 
} from './components/wallet'

// Use components individually for custom layouts
<div>
  <WalletInfoDisplay {...props} />
  <AddMemberForm {...props} />
  <MemberListComponent {...props} />
</div>
```

## Validation

The components include comprehensive validation for:

- **Member Address**: Valid Stacks address format (ST/SP + 39 characters)
- **Member Name**: 2-50 characters, alphanumeric with spaces, hyphens, underscores
- **Spend Limit**: Positive number not exceeding wallet balance
- **Member Identifier**: Positive integer unique within the organization

## Error Handling

The components handle various error scenarios:

- **Contract Errors**: Mapped to user-friendly messages
- **Network Issues**: Retry suggestions and connection checks
- **Validation Errors**: Real-time field-specific feedback
- **Transaction Failures**: Detailed error information with troubleshooting hints

## Styling

Components use Tailwind CSS classes and follow the existing design system:
- Consistent color scheme (orange/purple gradients)
- Responsive design patterns
- Loading states and animations
- Accessible form elements

## Integration

The components integrate with:
- **WalletService**: For contract interactions and data fetching
- **WalletContext**: For wallet connection state
- **Existing UI Components**: Button, Input, Card components

## Testing

Components are designed to be testable with:
- Clear prop interfaces
- Separated business logic
- Mockable service dependencies
- Predictable state management