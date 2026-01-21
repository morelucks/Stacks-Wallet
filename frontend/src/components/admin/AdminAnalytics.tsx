import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'

interface AnalyticsData {
    totalVolume: number
    monthlyVolume: number
    averageTransactionSize: number
    memberGrowth: number
    transactionGrowth: number
    topMembers: Array<{
        name: string
        address: string
        totalSpent: number
        transactionCount: number
    }>
    monthlyTrends: Array<{
        month: string
        transactions: number
        volume: number
        members: number
    }>
    spendingDistribution: Array<{
        range: string
        count: number
        percentage: number
    }>
}

interface AdminAnalyticsProps {
    adminAddress: string
    className?: string
}

export function AdminAnalytics({ adminAddress, className = '' }: AdminAnalyticsProps) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true)
            try {
                // Mock analytics data - in real implementation, this would be calculated from contract data
                const mockAnalytics: AnalyticsData = {
                    totalVolume: 125000000, // 125 STX
                    monthlyVolume: 45000000, // 45 STX
                    averageTransactionSize: 3750000, // 3.75 STX
                    memberGrowth: 25, // 25% growth
                    transactionGrowth: 15, // 15% growth
                    topMembers: [
                        {
                            name: 'Alice Wilson',
                            address: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
                            totalSpent: 35000000, // 35 STX
                            transactionCount: 12
                        },
                        {
                            name: 'John Doe',
                            address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                            totalSpent: 28000000, // 28 STX
                            transactionCount: 8
                        },
                        {
                            name: 'Jane Smith',
                            address: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
                            totalSpent: 22000000, // 22 STX
                            transactionCount: 6
                        }
                    ],
                    monthlyTrends: [
                        { month: 'Oct 2023', transactions: 15, volume: 25000000, members: 4 },
                        { month: 'Nov 2023', transactions: 22, volume: 35000000, members: 6 },
                        { month: 'Dec 2023', transactions: 28, volume: 42000000, members: 7 },
                        { month: 'Jan 2024', transactions: 35, volume: 45000000, members: 8 }
                    ],
                    spendingDistribution: [
                        { range: '0-5 STX', count: 18, percentage: 45 },
                        { range: '5-15 STX', count: 12, percentage: 30 },
                        { range: '15-30 STX', count: 7, percentage: 17.5 },
                        { range: '30+ STX', count: 3, percentage: 7.5 }
                    ]
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000))
                setAnalytics(mockAnalytics)
            } catch (error) {
                console.error('Error fetching analytics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (adminAddress) {
            fetchAnalytics()
        }
    }, [adminAddress, selectedPeriod])

    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : ''
        return `${sign}${value.toFixed(1)}%`
    }

    const getTrendColor = (value: number) => {
        return value >= 0 ? 'text-green-600' : 'text-red-600'
    }

    const getTrendIcon = (value: number) => {
        return value >= 0 ? (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
        )
    }

    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card>
                    <CardHeader>
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-64 bg-gray-200 rounded"></div>
                                <div className="h-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!analytics) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header with Period Selector */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Wallet Analytics
                        </CardTitle>
                        <div className="flex gap-2">
                            {(['7d', '30d', '90d', '1y'] as const).map(period => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period)}
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Volume */}
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-blue-800">Total Volume</h4>
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{formatSTX(analytics.totalVolume)} STX</p>
                        <div className="flex items-center mt-2 text-sm">
                            {getTrendIcon(analytics.transactionGrowth)}
                            <span className={getTrendColor(analytics.transactionGrowth)}>
                                {formatPercentage(analytics.transactionGrowth)} vs last period
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Volume */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-green-800">Monthly Volume</h4>
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{formatSTX(analytics.monthlyVolume)} STX</p>
                        <p className="text-sm text-green-600 mt-2">This month's activity</p>
                    </CardContent>
                </Card>

                {/* Average Transaction */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-purple-800">Avg Transaction</h4>
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{formatSTX(analytics.averageTransactionSize)} STX</p>
                        <p className="text-sm text-purple-600 mt-2">Per transaction</p>
                    </CardContent>
                </Card>

                {/* Member Growth */}
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-orange-800">Member Growth</h4>
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">{formatPercentage(analytics.memberGrowth)}</p>
                        <div className="flex items-center mt-2 text-sm">
                            {getTrendIcon(analytics.memberGrowth)}
                            <span className={getTrendColor(analytics.memberGrowth)}>
                                Growth rate
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Members */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            Top Members by Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.topMembers.map((member, index) => (
                                <div key={member.address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                            index === 1 ? 'bg-gray-100 text-gray-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{member.name}</p>
                                            <p className="text-sm text-gray-600 font-mono">{member.address.slice(0, 10)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatSTX(member.totalSpent)} STX</p>
                                        <p className="text-sm text-gray-600">{member.transactionCount} transactions</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Spending Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                            Transaction Size Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.spendingDistribution.map((range, index) => (
                                <div key={range.range} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">{range.range}</span>
                                        <span className="text-sm text-gray-600">{range.count} transactions ({range.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                index === 0 ? 'bg-blue-500' :
                                                index === 1 ? 'bg-green-500' :
                                                index === 2 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${range.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Monthly Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Month</th>
                                    <th className="text-right py-2">Transactions</th>
                                    <th className="text-right py-2">Volume (STX)</th>
                                    <th className="text-right py-2">Members</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.monthlyTrends.map((trend, index) => (
                                    <tr key={trend.month} className="border-b">
                                        <td className="py-3 font-medium">{trend.month}</td>
                                        <td className="py-3 text-right">{trend.transactions}</td>
                                        <td className="py-3 text-right">{formatSTX(trend.volume)}</td>
                                        <td className="py-3 text-right">{trend.members}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Export Actions */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Export Analytics</h4>
                            <p className="text-sm text-gray-600">Download detailed reports for further analysis</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export PDF
                            </Button>
                            <Button variant="outline">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}