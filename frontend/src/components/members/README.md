# Member Components

This directory contains components for the member dashboard and member-specific functionality in the multi-signature wallet system.

## Components Overview

### MemberPage
The main page component that orchestrates all member functionality with tabbed navigation.

```tsx
import { MemberPage } from './pages/MemberPage'

function App() {
  return <MemberPage />
}
```

### MemberDashboard
Displays member profile information, status, and key metrics.

**Features:**
- Member profile with name, ID, and status indicators
- Spend limit and organization information
- Wallet addresses (member and admin)
- Loading states and error handling

```tsx
import { MemberDashboard } from './components/members'

<MemberDashboard memberAddress={address} />
```

### MemberStats
Analytics dashboard showing member transaction statistics and spending patterns.

**Features:**
- Total withdrawn amount and transaction count
- Average transaction size and monthly spending
- Spending trends with visual indicators
- Quick insights and activity summaries

```tsx
import { MemberStats } from './components/members'

<MemberStats memberAddress={address} />
```

### MemberWithdrawalForm
Form component for members to withdraw funds from their allocated spend limit.

**Features:**
- Real-time balance display with max amount button
- Form validation for amount and receiver address
- Transaction state management (pending, success, error)
- Prevention of self-transfers and overdraft protection

```tsx
import { MemberWithdrawalForm } from './components/members'

<MemberWithdrawalForm
  memberAddress={address}
  availableBalance={balance}
  onWithdrawalSubmitted={(amount, receiver) => {}}
  onError={(error) => {}}
/>
```

### MemberTransactionHistory
Displays paginated transaction history with status indicators and export functionality.

**Features:**
- Transaction list with amount, receiver, and status
- Status indicators (completed, pending, failed) with icons
- Transaction hash links to Stacks explorer
- Pagination for large transaction lists
- Export functionality and empty state handling

```tsx
import { MemberTransactionHistory } from './components/members'

<MemberTransactionHistory memberAddress={address} />
```

### MemberSettings
Profile and preference management component for member customization.

**Features:**
- Profile settings (display name, email)
- Notification preferences with toggle switches
- Security information and wallet-managed authentication
- Save/reset functionality with status feedback

```tsx
import { MemberSettings } from './components/members'

<MemberSettings
  memberAddress={address}
  currentName="John Doe"
  organizationName="Tech Startup"
/>
```

## Usage Patterns

### Complete Member Dashboard
```tsx
import { MemberPage } from './pages/MemberPage'

// Full member dashboard with all functionality
function MemberApp() {
  return <MemberPage />
}
```

### Individual Components
```tsx
import { 
  MemberDashboard,
  MemberStats,
  MemberWithdrawalForm,
  MemberTransactionHistory,
  MemberSettings
} from './components/members'

// Use components individually for custom layouts
function CustomMemberPage() {
  return (
    <div>
      <MemberDashboard memberAddress={address} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberWithdrawalForm {...props} />
        <MemberStats memberAddress={address} />
      </div>
      <MemberTransactionHistory memberAddress={address} />
    </div>
  )
}
```

## State Management

### Wallet Connection
All components integrate with the `WalletContext` to:
- Check wallet connection status
- Access connected wallet address
- Handle wallet disconnection scenarios

### Notifications
The MemberPage implements a notification system for:
- Success feedback (withdrawals, settings saved)
- Error handling (transaction failures, network issues)
- Auto-dismissing notifications with manual dismiss option

### Real-time Updates
Components automatically refresh data when:
- Withdrawals are completed (balance updates)
- Settings are saved (profile updates)
- Tab navigation occurs (data refresh)

## Styling and Design

### Design System
- Consistent with existing wallet components
- Orange/purple gradient theme for primary actions
- Status-based color coding (green/red/yellow)
- Responsive grid layouts and mobile-friendly design

### Loading States
- Skeleton animations for data loading
- Spinner indicators for form submissions
- Disabled states during processing

### Error Handling
- User-friendly error messages
- Retry functionality for failed operations
- Graceful degradation for missing data

## Integration Points

### WalletService
Components integrate with extended WalletService functions:
- `memberWithdrawal()` - Process member withdrawals
- `getMemberInfo()` - Fetch member profile data
- `getMemberTransactions()` - Get transaction history

### Contract Integration
Ready for integration with WalletX smart contract:
- Member withdrawal function calls
- Transaction history queries
- Member profile management

### Validation
Comprehensive validation for:
- Stacks address format validation
- Amount validation against available balance
- Form field validation with real-time feedback

## Testing Considerations

### Component Testing
- Form validation and submission flows
- Loading and error state handling
- User interaction patterns (tabs, buttons, forms)

### Integration Testing
- Wallet connection scenarios
- Service integration and error handling
- Cross-component communication

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- Focus management and ARIA labels

## Performance Optimizations

### Data Fetching
- Efficient API calls with proper loading states
- Caching of member data and transaction history
- Pagination for large datasets

### Component Optimization
- Proper React hooks usage for state management
- Memoization where appropriate
- Lazy loading for heavy components

## Future Enhancements

### Planned Features
- Real-time notifications via WebSocket
- Advanced transaction filtering and search
- Member-to-member transfers
- Spending analytics and budgeting tools

### Extensibility
- Plugin architecture for custom member features
- Theming support for organization branding
- Multi-language support for international users