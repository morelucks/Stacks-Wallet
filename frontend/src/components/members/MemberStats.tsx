import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface MemberStatsData {
    totalWithdrawn: number
    transactionCount: number
    averageTransaction: number
    lastTransactionDate: string | null
    monthlySpending: number
    spendingTrend: 'up' | 'down' | 'stable'
}

interface MemberStatsProps {
    memberAddress: string
    className?: string
}

export function MemberStats({ memberAddress, className = '' }: MemberStatsProps) {
    const [stats, setStats] = useState<MemberStatsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true)
            try {
                // Mock stats data - in real implementation, this would be calculated from transaction history
                const mockStats: MemberStatsData = {
                    totalWithdrawn: 15000000, // 15 STX
                    transactionCount: 8,
                    averageTransaction: 1875000, // 1.875 STX
                    lastTransactionDate: '2024-01-15T10:30:00Z',
                    monthlySpending: 12000000, // 12 STX
                    spendingTrend: 'up'
                }
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                setStats(mockStats)
            } catch (error) {
                console.error('Error fetching member stats:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (memberAddress) {
            fetchStats()
        }
    }, [memberAddress])

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
            day: 'numeric'
        })
    }

    const getTrendIcon = (trend: MemberStatsData['spendingTrend']) => {
        switch (trend) {
            case 'up':
                return (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                )
            case 'down':
                return (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                )
            case 'stable':
                return (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                )
        }
    }

    const getTrendColor = (trend: MemberStatsData['spendingTrend']) => {
        switch (trend) {
            case 'up':
                return 'text-red-600'
            case 'down':
                return 'text-green-600'
            case 'stable':
                return 'text-gray-600'
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Member Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse p-4 border rounded-lg">
                                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!stats) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Member Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Available</h3>
                        <p className="text-gray-600">Statistics will be available once you start making transactions.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Member Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Total Withdrawn */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-blue-800">Total Withdrawn</h4>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{formatSTX(stats.totalWithdrawn)} STX</p>
                    </div>

                    {/* Transaction Count */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-green-800">Total Transactions</h4>
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{stats.transactionCount}</p>
                    </div>

                    {/* Average Transaction */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-purple-800">Average Transaction</h4>
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{formatSTX(stats.averageTransaction)} STX</p>
                    </div>

                    {/* Last Transaction */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-orange-800">Last Transaction</h4>
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-lg font-bold text-orange-900">
                            {stats.lastTransactionDate ? formatDate(stats.lastTransactionDate) : 'Never'}
                        </p>
                    </div>

                    {/* Monthly Spending */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-indigo-800">This Month</h4>
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">{formatSTX(stats.monthlySpending)} STX</p>
                    </div>

                    {/* Spending Trend */}
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-800">Spending Trend</h4>
                            {getTrendIcon(stats.spendingTrend)}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className={`text-lg font-bold capitalize ${getTrendColor(stats.spendingTrend)}`}>
                                {stats.spendingTrend}
                            </p>
                            <span className="text-sm text-gray-600">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Additional Insights */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Quick Insights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700">
                                You've made {stats.transactionCount} transactions so far
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700">
                                Average transaction: {formatSTX(stats.averageTransaction)} STX
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-gray-700">
                                Monthly spending is trending {stats.spendingTrend}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-700">
                                {stats.lastTransactionDate 
                                    ? `Last active ${formatDate(stats.lastTransactionDate)}`
                                    : 'No recent activity'
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}