import { useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { PlatformWalletRegistry } from './PlatformWalletRegistry'
import { PlatformMemberRegistry } from './PlatformMemberRegistry'
import { PlatformAnalyticsDashboard } from './PlatformAnalyticsDashboard'
import { BulkOperationsPanel } from './BulkOperationsPanel'
import { AuditLogViewer } from './AuditLogViewer'
import { PlatformSettings } from './PlatformSettings'
import { NotificationCenter } from './NotificationCenter'
import { Button } from '../ui/Button'
import { PlatformWallet, GlobalMember, BulkOperationResult } from '../../services/platformAdminService'

interface PlatformAdminDashboardProps {
  className?: string
}

export function PlatformAdminDashboard({ className = '' }: PlatformAdminDashboardProps) {
  const { stacksWallet } = useWallet()
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'members' | 'bulk-ops' | 'analytics' | 'notifications' | 'audit' | 'settings'>('overview')
  const [selectedWallets, setSelectedWallets] = useState<PlatformWallet[]>([])
  const [selectedMembers, setSelectedMembers] = useState<GlobalMember[]>([])
  const [notifications, setNotifications] = useState<{ type: 'success' | 'error' | 'info', message: string }[]>([])

  const handleWalletSelect = (wallet: PlatformWallet) => {
    // Toggle selection
    setSelectedWallets(prev => {
      const isSelected = prev.some(w => w.walletId === wallet.walletId)
      if (isSelected) {
        return prev.filter(w => w.walletId !== wallet.walletId)
      } else {
        return [...prev, wallet]
      }
    })
  }

  const handleMemberSelect = (member: GlobalMember) => {
    // Toggle selection
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.memberAddress === member.memberAddress)
      if (isSelected) {
        return prev.filter(m => m.memberAddress !== member.memberAddress)
      } else {
        return [...prev, member]
      }
    })
  }

  const handleBulkOperationComplete = (results: BulkOperationResult[]) => {
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    setNotifications(prev => [...prev, {
      type: failureCount === 0 ? 'success' : 'info',
      message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`
    }])

    // Clear selections after bulk operation
    setSelectedWallets([])
    setSelectedMembers([])

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1))
    }, 5000)
  }

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      description: 'Platform overview and key metrics'
    },
    { 
      id: 'wallets', 
      label: 'Wallets', 
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      description: 'View and manage all platform wallets'
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      description: 'Manage platform members across all wallets'
    },
    { 
      id: 'bulk-ops', 
      label: 'Bulk Operations', 
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      description: 'Perform bulk operations on selected items'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      description: 'Platform analytics and insights'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: 'M15 17h5l-5 5v-5z M4 19.5A2.5 2.5 0 016.5 17H20',
      description: 'Platform notifications and alerts'
    },
    { 
      id: 'audit', 
      label: 'Audit Logs', 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      description: 'View audit logs and compliance data'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      description: 'Platform configuration and settings'
    }
  ]

  if (!stacksWallet.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Platform Admin Access Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your platform administrator wallet to access the comprehensive admin dashboard and management tools.
          </p>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Admin Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive platform management and oversight tools
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Platform Admin</p>
                <p className="font-mono text-sm text-gray-800">
                  {stacksWallet.address?.slice(0, 10)}...{stacksWallet.address?.slice(-6)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border flex items-center justify-between ${
                  notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : notification.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : notification.type === 'error' ? (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{notification.message}</span>
                </div>
                <button
                  onClick={() => dismissNotification(index)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedWallets.length > 0 || selectedMembers.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                Selected: {selectedWallets.length} wallet{selectedWallets.length !== 1 ? 's' : ''}, {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setActiveTab('bulk-ops')}
              >
                Bulk Operations
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setSelectedWallets([])
                  setSelectedMembers([])
                }}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <PlatformAnalyticsDashboard />
          )}

          {activeTab === 'wallets' && (
            <PlatformWalletRegistry onWalletSelect={handleWalletSelect} />
          )}

          {activeTab === 'members' && (
            <PlatformMemberRegistry onMemberSelect={handleMemberSelect} />
          )}

          {activeTab === 'bulk-ops' && (
            <BulkOperationsPanel
              selectedWallets={selectedWallets}
              selectedMembers={selectedMembers}
              onOperationComplete={handleBulkOperationComplete}
            />
          )}

          {activeTab === 'analytics' && (
            <PlatformAnalyticsDashboard />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer />
          )}

          {activeTab === 'settings' && (
            <PlatformSettings />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-6 mb-4">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Platform Admin Guide
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support Center
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security Policy
              </a>
            </div>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
              <div className="text-gray-300">•</div>
              <div className="text-sm text-gray-500">
                Platform Admin Dashboard v1.0
              </div>
              <div className="text-gray-300">•</div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 WalletX Platform Admin Portal. Comprehensive platform management and oversight.
            </p>
            <div className="mt-2 text-xs text-gray-400">
              Built with React, TypeScript, and Stacks blockchain integration
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}