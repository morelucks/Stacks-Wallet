# Admin Components

Comprehensive admin dashboard components for multi-signature wallet management.

## Components

### AdminPage
Main admin dashboard with tabbed navigation for all admin functions.

### AdminDashboard
Wallet overview with key metrics, quick actions, and status indicators.

### AdminMemberManagement
Complete member management with search, filtering, and member actions (freeze, unfreeze, remove, reimburse).

### AdminTransactionMonitor
Transaction monitoring with advanced filtering, pagination, and CSV export.

### AdminAnalytics
Performance analytics with charts, trends, and insights.

### AdminSettings
Wallet configuration with security settings and notifications.

### AdminReports
Report generation with multiple formats and date ranges.

## Usage

```tsx
import { AdminPage } from './pages/AdminPage'
// or individual components
import { AdminDashboard, AdminMemberManagement } from './components/admin'

<AdminPage />
```

## Features

- **Complete Admin Control**: Full wallet management capabilities
- **Real-time Monitoring**: Live transaction and member activity tracking  
- **Advanced Analytics**: Performance metrics and trend analysis
- **Flexible Reporting**: Multiple report formats and custom date ranges
- **Security Management**: Member freeze/unfreeze, spending limits, auto-freeze
- **Notification System**: Configurable alerts and daily reports
- **Export Functionality**: CSV exports for transactions and analytics
- **Responsive Design**: Mobile-friendly admin interface

## Integration

All components integrate with:
- WalletService for contract interactions
- WalletContext for authentication
- Existing UI component library
- Real-time notification system

## Security

- Admin-only access with wallet verification
- Secure contract interactions
- Audit trail for all admin actions
- Role-based permission system