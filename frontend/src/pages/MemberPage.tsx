import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { MemberDashboard } from '../components/members/MemberDashboard'
import { MemberStats } from '../components/members/MemberStats'
import { MemberWithdrawalForm } from '../components/members/MemberWithdrawalForm'
import { MemberTransactionHistory } from '../components/members/MemberTransactionHistory'
import { MemberSettings } from '../components/members/MemberSettings'
import { Button } from '../components/ui/Button'

interface MemberPageProps {
    className?: string
}

export function MemberPage({ className = '' }: MemberPageProps) {
    const { stacksWallet } = useWallet()
    const [activeTab, setActiveTab] = useState<'overview' | 'withdraw' | 'history' | 'stats' | 'settings'>('overview')
    const [notifications, setNotifications] = useState<{ type: 'success' | 'error', message: string }[]>([])
    const [memberBalance, setMemberBalance] = useState(50000000) // 50 STX in microSTX

    const handleWithdrawalSubmitted = (amount: number, receiver: string) => {
        // Update balance
        const amountMicroSTX = Math.floor(amount * 1000000)
        setMemberBalance(prev => prev - amountMicroSTX)
        
        // Show success notification
        setNotifications(prev => [...prev, {
            type: 'success',
            message: `Successfully withdrew ${amount} STX to ${receiver.slice(0, 10)}...`
        }])

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.slice(1))
        }, 5000)

        // Switch to history tab to show the new transaction
        setActiveTab('history')
    }

    const handleError = (error: string) => {
        setNotifications(prev => [...prev, {
            type: 'error',
            message: error
        }])

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.slice(1))
        }, 5000)
    }

    const dismissNotification = (index: number) => {
        setNotifications(prev => prev.filter((_, i) => i !== index))
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
        { id: 'withdraw', label: 'Withdraw', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
        { id: 'history', label: 'History', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { id: 'stats', label: 'Statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
    ]

    if (!stacksWallet.isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Wallet Not Connected</h2>
                    <p className="text-gray-600 mb-6">
                        Please connect your Stacks wallet to access your member dashboard and manage your funds.
                    </p>
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                        Connect Wallet
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${className}`}>
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Member Dashboard</h1>
                            <p className="text-gray-600 mt-1">
                                Manage your wallet funds and view transaction history
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Connected as</p>
                                <p className="font-mono text-sm text-gray-800">
                                    {stacksWallet.address?.slice(0, 10)}...{stacksWallet.address?.slice(-6)}
                                </p>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="space-y-2">
                        {notifications.map((notification, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-md border flex items-center justify-between ${
                                    notification.type === 'success'
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                }`}
                            >
                                <div className="flex items-center">
                                    {notification.type === 'success' ? (
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

            {/* Navigation Tabs */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                                {tab.id === 'settings' && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full">
                                        New
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <MemberDashboard memberAddress={stacksWallet.address || ''} />
                            <MemberStats memberAddress={stacksWallet.address || ''} />
                        </div>
                    )}

                    {activeTab === 'withdraw' && (
                        <MemberWithdrawalForm
                            memberAddress={stacksWallet.address || ''}
                            availableBalance={memberBalance}
                            onWithdrawalSubmitted={handleWithdrawalSubmitted}
                            onError={handleError}
                        />
                    )}

                    {activeTab === 'history' && (
                        <MemberTransactionHistory memberAddress={stacksWallet.address || ''} />
                    )}

                    {activeTab === 'stats' && (
                        <MemberStats memberAddress={stacksWallet.address || ''} />
                    )}

                    {activeTab === 'settings' && (
                        <MemberSettings
                            memberAddress={stacksWallet.address || ''}
                            currentName="John Doe"
                            organizationName="Tech Startup Wallet"
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t mt-12">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Help Center
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Contact Support
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Terms of Service
                            </a>
                        </div>
                        <div className="flex items-center justify-center gap-4 mb-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>All systems operational</span>
                            </div>
                            <div className="text-gray-300">•</div>
                            <div className="text-sm text-gray-500">
                                Last updated: {new Date().toLocaleDateString()}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm">
                            © 2024 WalletX Member Dashboard. Secure multi-signature wallet management.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}