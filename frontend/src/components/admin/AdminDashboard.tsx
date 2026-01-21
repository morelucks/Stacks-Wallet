import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'

interface WalletOverview {
    walletName: string
    totalBalance: number
    totalMembers: number
    activeMembers: number
    frozenMembers: number
    totalTransactions: number
    monthlyTransactions: number
    createdDate: string
    walletId: number
}

interface AdminDashboardProps {
    adminAddress: string
    className?: string
}

export function AdminDashboard({ adminAddress, className = '' }: AdminDashboardProps) {
    const [walletOverview, setWalletOverview] = useState<WalletOverview | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchWalletOverview = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // Mock wallet overview data - in real implementation, this would be contract calls
                const mockOverview: WalletOverview = {
                    walletName: 'Tech Startup Multi-Sig Wallet',
                    totalBalance: 250000000, // 250 STX in microSTX
                    totalMembers: 8,
                    activeMembers: 6,
                    frozenMembers: 2,
                    totalTransactions: 47,
                    monthlyTransactions: 12,
                    createdDate: '2024-01-01T00:00:00Z',
                    walletId: 1
                }
                
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000))
                setWalletOverview(mockOverview)
            } catch (err) {
                setError('Failed to load wallet overview')
                console.error('Error fetching wallet overview:', err)
            } finally {
                setIsLoading(false)
            }
        }

        if (adminAddress) {
            fetchWalletOverview()
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
            month: 'long',
            day: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card>
                    <CardHeader>
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error || !walletOverview) {
        return (
            <div className={`${className}`}>
                <Card className="border-red-200 bg-red-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Wallet Data</h3>
                        <p className="text-red-700 mb-4">{error}</p>
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Wallet Header */}
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                                {walletOverview.walletName}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Wallet ID: #{walletOverview.walletId}</span>
                                <span>•</span>
                                <span>Created: {formatDate(walletOverview.createdDate)}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Active</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-blue-900">
                                {formatSTX(walletOverview.totalBalance)} STX
                            </p>
                            <p className="text-sm text-blue-700">Total Balance</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Members */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800">Total Members</p>
                                <p className="text-3xl font-bold text-green-900">{walletOverview.totalMembers}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm">
                            <span className="text-green-600">{walletOverview.activeMembers} active</span>
                            <span className="text-gray-400 mx-1">•</span>
                            <span className="text-red-600">{walletOverview.frozenMembers} frozen</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Transactions */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-800">Total Transactions</p>
                                <p className="text-3xl font-bold text-purple-900">{walletOverview.totalTransactions}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-purple-600">
                            {walletOverview.monthlyTransactions} this month
                        </div>
                    </CardContent>
                </Card>

                {/* Active Members */}
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-800">Active Members</p>
                                <p className="text-3xl font-bold text-orange-900">{walletOverview.activeMembers}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-orange-600">
                            {((walletOverview.activeMembers / walletOverview.totalMembers) * 100).toFixed(0)}% of total
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Activity */}
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-800">Monthly Activity</p>
                                <p className="text-3xl font-bold text-indigo-900">{walletOverview.monthlyTransactions}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-indigo-600">
                            Transactions this month
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button className="h-16 flex-col gap-2 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Member
                        </Button>
                        
                        <Button variant="outline" className="h-16 flex-col gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Add Funds
                        </Button>
                        
                        <Button variant="outline" className="h-16 flex-col gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Reports
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Admin Address Info */}
            <Card className="bg-gray-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Admin Address</p>
                            <p className="font-mono text-sm text-gray-900">{adminAddress}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}