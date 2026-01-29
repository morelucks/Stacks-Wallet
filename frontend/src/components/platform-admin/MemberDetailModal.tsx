import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { GlobalMember, PlatformAdminService } from '../../services/platformAdminService'

interface MemberDetailModalProps {
  member: GlobalMember
  onClose: () => void
  className?: string
}

interface MemberTransaction {
  id: string
  timestamp: string
  walletName: string
  adminAddress: string
  type: 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze' | 'limit_change'
  amount?: number
  receiver?: string
  description: string
}

export function MemberDetailModal({ member, onClose, className = '' }: MemberDetailModalProps) {
  const [memberTransactions, setMemberTransactions] = useState<MemberTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'transactions' | 'activity'>('overview')

  // Mock transaction data
  const mockTransactions: MemberTransaction[] = [
    {
      id: '1',
      timestamp: '2024-12-30T10:30:00Z',
      walletName: 'Tech Startup Multi-Sig',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      type: 'withdrawal',
      amount: 15000000,
      receiver: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
      description: 'Withdrawal to external address for project expenses'
    },
    {
      id: '2',
      timestamp: '2024-12-29T16:45:00Z',
      walletName: 'Investment DAO Wallet',
      adminAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
      type: 'limit_change',
      amount: 75000000,
      description: 'Spend limit increased by admin'
    },
    {
      id: '3',
      timestamp: '2024-12-28T14:20:00Z',
      walletName: 'Tech Startup Multi-Sig',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      type: 'freeze',
      description: 'Account temporarily frozen for security review'
    },
    {
      id: '4',
      timestamp: '2024-12-27T11:15:00Z',
      walletName: 'Tech Startup Multi-Sig',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      type: 'unfreeze',
      description: 'Account unfrozen after security review completion'
    }
  ]

  useEffect(() => {
    const fetchMemberDetails = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMemberTransactions(mockTransactions)
      } catch (error) {
        console.error('Error fetching member details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemberDetails()
  }, [member])

  const formatSTX = (microSTX: number) => {
    return (microSTX / 1000000).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { status: 'Active', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' }
      case 'frozen':
        return { status: 'Frozen', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' }
      case 'inactive':
        return { status: 'Inactive', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' }
      default:
        return { status: 'Unknown', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' }
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'withdrawal': return 'bg-red-100 text-red-800'
      case 'deposit': return 'bg-green-100 text-green-800'
      case 'freeze': return 'bg-yellow-100 text-yellow-800'
      case 'unfreeze': return 'bg-blue-100 text-blue-800'
      case 'limit_change': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const statusInfo = getStatusInfo(member.accountStatus)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{member.memberName}</h2>
            <p className="text-sm text-gray-600 font-mono">{member.memberAddress}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusInfo.dotColor}`}></div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.status}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
              { id: 'wallets', label: 'Wallet Associations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { id: 'transactions', label: 'Transaction History', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { id: 'activity', label: 'Activity Log', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-900">{formatSTX(member.totalSpendLimit)} STX</p>
                          <p className="text-sm text-purple-700">Total Spend Limit</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-900">{member.walletAssociations.length}</p>
                          <p className="text-sm text-blue-700">Wallet Associations</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-900">{memberTransactions.length}</p>
                          <p className="text-sm text-green-700">Total Transactions</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Member Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Member Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Member Address</p>
                          <p className="font-mono text-gray-900">{member.memberAddress}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Account Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Join Date</p>
                          <p className="text-gray-900">{formatDate(member.joinDate)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Total Spend Limit</p>
                          <p className="text-gray-900">{formatSTX(member.totalSpendLimit)} STX</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button variant="outline" className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {member.accountStatus === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
                        </Button>
                        
                        <Button variant="outline" className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Adjust Limits
                        </Button>
                        
                        <Button variant="outline" className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                          </svg>
                          Send Notification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'wallets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Wallet Associations ({member.walletAssociations.length})</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {member.walletAssociations.map((association, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{association.walletName}</h4>
                              <p className="text-sm text-gray-600 font-mono">{association.adminAddress}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>Role: <strong>{association.role}</strong></span>
                                <span>Spend Limit: <strong>{formatSTX(association.spendLimit)} STX</strong></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                association.frozen ? 'bg-red-100 text-red-800' : 
                                association.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {association.frozen ? 'Frozen' : association.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Transaction History ({memberTransactions.length})</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {memberTransactions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                  {transaction.type.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-600">{formatTimestamp(transaction.timestamp)}</span>
                              </div>
                              <p className="text-sm text-gray-900">{transaction.description}</p>
                              <p className="text-xs text-gray-600 mt-1">Wallet: {transaction.walletName}</p>
                              {transaction.receiver && (
                                <p className="text-xs text-gray-600 font-mono">To: {transaction.receiver}</p>
                              )}
                            </div>
                            {transaction.amount && (
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatSTX(transaction.amount)} STX</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Account accessed from new device</p>
                            <p className="text-xs text-gray-600">2 hours ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Spend limit increased</p>
                            <p className="text-xs text-gray-600">1 day ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Security review completed</p>
                            <p className="text-xs text-gray-600">3 days ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Manage Member
          </Button>
        </div>
      </div>
    </div>
  )
}