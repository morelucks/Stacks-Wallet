import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'

interface Transaction {
    id: string
    amount: number
    receiver: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    txHash?: string
}

interface MemberTransactionHistoryProps {
    memberAddress: string
    className?: string
}

export function MemberTransactionHistory({ memberAddress, className = '' }: MemberTransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const transactionsPerPage = 10

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true)
            try {
                // Mock transaction data - in real implementation, this would be a contract call
                const mockTransactions: Transaction[] = [
                    {
                        id: '1',
                        amount: 5000000, // 5 STX
                        receiver: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                        timestamp: '2024-01-15T10:30:00Z',
                        status: 'completed',
                        txHash: '0x1234567890abcdef'
                    },
                    {
                        id: '2',
                        amount: 2500000, // 2.5 STX
                        receiver: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
                        timestamp: '2024-01-14T15:45:00Z',
                        status: 'completed',
                        txHash: '0xabcdef1234567890'
                    },
                    {
                        id: '3',
                        amount: 1000000, // 1 STX
                        receiver: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
                        timestamp: '2024-01-13T09:15:00Z',
                        status: 'pending'
                    },
                    {
                        id: '4',
                        amount: 7500000, // 7.5 STX
                        receiver: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
                        timestamp: '2024-01-12T14:20:00Z',
                        status: 'failed'
                    }
                ]
                
                setTransactions(mockTransactions)
                setTotalPages(Math.ceil(mockTransactions.length / transactionsPerPage))
            } catch (error) {
                console.error('Error fetching transactions:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (memberAddress) {
            fetchTransactions()
        }
    }, [memberAddress, currentPage])

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

    const getStatusColor = (status: Transaction['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: Transaction['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )
            case 'pending':
                return (
                    <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )
            case 'failed':
                return (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
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
                    <CardTitle>Transaction History</CardTitle>
                    <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                        <p className="text-gray-600">Your transaction history will appear here once you start making withdrawals.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(transaction.status)}
                                            <span className="font-semibold text-gray-900">
                                                {formatSTX(transaction.amount)} STX
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p>To: <span className="font-mono">{transaction.receiver}</span></p>
                                            <p>Date: {formatDate(transaction.timestamp)}</p>
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
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-gray-600">
                                    Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, transactions.length)} of {transactions.length} transactions
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