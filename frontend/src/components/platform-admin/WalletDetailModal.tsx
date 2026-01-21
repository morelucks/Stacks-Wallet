import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { PlatformWallet, GlobalMember, PlatformAdminService } from '../../services/platformAdminService'

interface WalletDetailModalProps {
  wallet: PlatformWallet
  onClose: () => void
  className?: string
}

interface WalletTransaction {
  id: string
  timestamp: string
  type: 'member_addition' | 'withdrawal' | 'deposit' | 'freeze' | 'unfreeze'
  amount?: number
  memberAddress?: string
  memberName?: string
  description: string
}

export function WalletDetailModal({ wallet, onClose, className = '' }: WalletDetailModalProps) {
  const [walletMembers, setWalletMembers] = useState<GlobalMember[]>([])
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions' | 'settings'>('overview')

  // Mock transaction data
  const mockTransactions: WalletTransaction[] = [
    {
      id: '1',
      timestamp: '2024-12-30T10:30:00Z',
      type: 'member_addition',
      memberAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
      memberName: 'Alice Johnson',
      amount: 50000000,
      description: 'Added new member with 50 STX spend limit'
    },
    {
      id: '2',
      timestamp: '2024-12-30T09:15:00Z',
      type: 'withdrawal',
      memberAddress: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
      memberName: 'Bob Smith',
      amount: 25000000,
      description: 'Member withdrawal to external address'
    },
    {
      id: '3',
      timestamp: '2024-12-29T16:45:00Z',
      type: 'deposit',
      amount: 100000000,
      description: 'Admin wallet funding increase'
    },
    {
      id: '4',
      timestamp: '2024-12-29T14:20:00Z',
      type: 'freeze',
      memberAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
      memberName: 'Charlie Wilson',
      description: 'Member account frozen due to suspicious activity'
    }
  ]

  useEffect(() => {
    const fetchWalletDetails = async () => {
      setIsLoading(true)
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Filter members for this wallet
        const allMembers = await PlatformAdminService.getAllMembers()
        const filteredMembers = allMembers.filter(member => 
          member.walletAssociations.some(assoc => assoc.adminAddress === wallet.adminAddress)
        )
        
        setWalletMembers(filteredMembers)
        setWalletTransactions(mockTransactions)
      } catch (error) {
        console.error('Error fetching wallet details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletDetails()
  }, [wallet])

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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'member_addition': return 'bg-green-100 text-green-800'
      case 'withdrawal': return 'bg-red-100 text-red-800'
      case 'deposit': return 'bg-blue-100 text-blue-800'
      case 'freeze': return 'bg-yellow-100 text-yellow-800'
      case 'unfreeze': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{wallet.walletName}</h2>
            <p className="text-sm text-gray-600">Wallet ID: #{wallet.walletId}</p>
          </div>
          <div className="flex items-center gap-4">
            {wallet.suspiciousActivity && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Suspicious Activity
              </span>
            )}
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
              { id: 'members', label: 'Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
              { id: 'transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
                          <p className="text-2xl font-bold text-blue-900">{formatSTX(wallet.currentBalance)} STX</p>
                          <p className="text-sm text-blue-700">Current Balance</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-900">{wallet.memberCount}</p>
                          <p className="text-sm text-green-700">Total Members</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActivityColor(wallet.activityLevel)}`}>
                            {wallet.activityLevel.toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-700 mt-1">Activity Level</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Wallet Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Wallet Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Admin Address</p>
                          <p className="font-mono text-gray-900">{wallet.adminAddress}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Created</p>
                          <p className="text-gray-900">{formatTimestamp(wallet.creationDate)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Last Activity</p>
                          <p className="text-gray-900">{formatTimestamp(wallet.lastActivity)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Status</p>
                          <p className="text-gray-900">Active</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Wallet Members ({walletMembers.length})</h3>
                  </div>
                  
                  {walletMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No members found for this wallet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {walletMembers.map((member) => {
                        const walletAssoc = member.walletAssociations.find(assoc => assoc.adminAddress === wallet.adminAddress)
                        return (
                          <Card key={member.memberAddress}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{member.memberName}</h4>
                                  <p className="text-sm text-gray-600 font-mono">{member.memberAddress}</p>
                                  <p className="text-sm text-gray-600">
                                    Spend Limit: {formatSTX(walletAssoc?.spendLimit || 0)} STX
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    walletAssoc?.frozen ? 'bg-red-100 text-red-800' : 
                                    walletAssoc?.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {walletAssoc?.frozen ? 'Frozen' : walletAssoc?.active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Transactions ({walletTransactions.length})</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {walletTransactions.map((transaction) => (
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
                              {transaction.memberName && (
                                <p className="text-xs text-gray-600 mt-1">Member: {transaction.memberName}</p>
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

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Wallet Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Wallet Status</p>
                            <p className="text-sm text-gray-600">Current operational status</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Security Level</p>
                            <p className="text-sm text-gray-600">Multi-signature security</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            High
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto-freeze Suspicious Activity</p>
                            <p className="text-sm text-gray-600">Automatically freeze suspicious transactions</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Enabled
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
          <Button className="bg-blue-600 hover:bg-blue-700">
            Manage Wallet
          </Button>
        </div>
      </div>
    </div>
  )
}