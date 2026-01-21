import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface WalletTransaction {
    id: string
    type: 'member_withdrawal' | 'member_onboard' | 'admin_reimburse' | 'admin_fund'
    memberName: string
    memberAddress: string
    amount: number
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    txHash?: string
    description: string
}

interface AdminTransactionMonitorProps {
    adminAddress: string
    className?: string
}

export function AdminTransactionMonitor({ adminAddress, className = '' }: AdminTransactionMonitorProps) {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<'all' | WalletTransaction['type']>('all')
    const [filterStatus, setFilterStatus] = useState<'all' | WalletTransaction['status']>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const transactionsPerPage = 10

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true)
            try {
                // Mock transaction data - in real implementation, this would be contract calls
                const mockTransactions: WalletTransaction[] = [
                    {
                        id: '1',
                        type: 'member_withdrawal',
                        memberName: 'John Doe',
                        memberAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                        amount: 5000000, // 5 STX
                        timestamp: '2024-01-15T10:30:00Z',
                        status: 'completed',
                        txHash: '0x1234567890abcdef',
                        description: 'Member withdrawal to external address'
                    },
                    {
                        id: '2',
                        type: 'member_onboard',
                        memberName: 'Alice Wilson',
                        memberAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
                        amount: 75000000, // 75 STX
                        timestamp: '2024-01-14T15:45:00Z',
                        status: 'completed',
                        txHash: '0xabcdef1234567890',
                        description: 'New member onboarded with initial spend limit'
                    },
                    {
                        id: '3',
                        type: 'admin_reimburse',
                        memberName: 'Jane Smith',
                        memberAddress: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
                        amount: 25000000, // 25 STX
                        timestamp: '2024-01-13T09:15:00Z',
                        status: 'completed',
                        txHash: '0x9876543210fedcba',
                        description: 'Admin added funds to member spend limit'
                    },
                    {
                        id: '4',
                        type: 'member_withdrawal',
                        memberName: 'John Doe',
                        memberAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                        amount: 2500000, // 2.5 STX
                        timestamp: '2024-01-12T14:20:00Z',
                        status: 'pending',
                        description: 'Member withdrawal pending confirmation'
                    },
                    {
                        id: '5',
                        type: 'admin_fund',
                        memberName: 'Admin',
                        memberAddress: adminAddress,
                        amount: 100000000, // 100 STX
                        timestamp: '2024-01-11T11:00:00Z',
                        status: 'completed',
                        txHash: '0xfedcba0987654321',
                        description: 'Admin added funds to wallet'
                    },
                    {
                        id: '6',
                        type: 'member_withdrawal',
                        memberName: 'Alice Wilson',
                        memberAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
                        amount: 15000000, // 15 STX
                        timestamp: '2024-01-10T16:30:00Z',
                        status: 'failed',
                        description: 'Member withdrawal failed - insufficient balance'
                    }
                ]
                
                await new Promise(resolve => setTimeout(resolve, 1000))
                setTransactions(mockTransactions)
            } catch (error) {
                console.error('Error fetching transactions:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (adminAddress) {
            fetchTransactions()
        }
    }, [adminAddress])

    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTransactionTypeInfo = (type: WalletTransaction['type']) => {
        switch (type) {
            case 'member_withdrawal':
                return { 
                    label: 'Member Withdrawal', 
                    color: 'bg-red-100 text-red-800',
                    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                }
            case 'member_onboard':
                return { 
                    label: 'Member Onboard', 
                    color: 'bg-green-100 text-green-800',
                    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                }
            case 'admin_reimburse':
                return { 
                    label: 'Admin Reimburse', 
                    color: 'bg-blue-100 text-blue-800',
                    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                }
            case 'admin_fund':
                return { 
                    label: 'Admin Fund', 
                    color: 'bg-purple-100 text-purple-800',
                    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                }
        }
    }

    const getStatusInfo = (status: WalletTransaction['status']) => {
        switch (status) {
            case 'completed':
                return { 
                    label: 'Completed', 
                    color: 'bg-green-100 text-green-800',
                    icon: 'M5 13l4 4L19 7'
                }
            case 'pending':
                return { 
                    label: 'Pending', 
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                }
            case 'failed':
                return { 
                    label: 'Failed', 
                    color: 'bg-red-100 text-red-800',
                    icon: 'M6 18L18 6M6 6l12 12'
                }
        }
    }

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.memberAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesType = filterType === 'all' || transaction.type === filterType
        const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
        
        let matchesDate = true
        if (dateRange.start && dateRange.end) {
            const transactionDate = new Date(transaction.timestamp)
            const startDate = new Date(dateRange.start)
            const endDate = new Date(dateRange.end)
            matchesDate = transactionDate >= startDate && transactionDate <= endDate
        }
        
        return matchesSearch && matchesType && matchesStatus && matchesDate
    })

    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * transactionsPerPage,
        currentPage * transactionsPerPage
    )

    const exportTransactions = () => {
        const csvContent = [
            ['Date', 'Type', 'Member', 'Amount (STX)', 'Status', 'Description'].join(','),
            ...filteredTransactions.map(tx => [
                formatDate(tx.timestamp),
                getTransactionTypeInfo(tx.type).label,
                tx.memberName,
                formatSTX(tx.amount),
                getStatusInfo(tx.status).label,
                tx.description
            ].join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Transaction Monitor</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse border rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Transaction Monitor ({filteredTransactions.length})
                    </CardTitle>
                    <Button onClick={exportTransactions} variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="member_withdrawal">Member Withdrawals</option>
                        <option value="member_onboard">Member Onboards</option>
                        <option value="admin_reimburse">Admin Reimburse</option>
                        <option value="admin_fund">Admin Funding</option>
                    </select>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="text-sm"
                        />
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="text-sm"
                        />
                    </div>
                </div>

                {/* Transactions List */}
                {paginatedTransactions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                        <p className="text-gray-600">
                            {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                                ? 'Try adjusting your search or filter criteria.' 
                                : 'No transactions have been recorded yet.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedTransactions.map((transaction) => {
                            const typeInfo = getTransactionTypeInfo(transaction.type)
                            const statusInfo = getStatusInfo(transaction.status)
                            
                            return (
                                <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                                                </svg>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                                <span className="text-lg font-semibold text-gray-900">
                                                    {formatSTX(transaction.amount)} STX
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p><strong>{transaction.memberName}</strong> • {formatDate(transaction.timestamp)}</p>
                                                <p className="font-mono text-xs">{transaction.memberAddress}</p>
                                                <p>{transaction.description}</p>
                                                {transaction.txHash && (
                                                    <p>
                                                        Tx Hash: 
                                                        <a 
                                                            href={`https://explorer.stacks.co/txid/${transaction.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-mono text-blue-600 hover:text-blue-800 ml-1"
                                                        >
                                                            {transaction.txHash.slice(0, 10)}...
                                                        </a>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-gray-600">
                                    Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}