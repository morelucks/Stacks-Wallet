import { useState } from 'react'
import { AddMemberComponent } from '../components/wallet'
import { useWallet } from '../context/WalletContext'
import { AddMemberParams } from '../services/walletService'

export function MemberManagementPage() {
    const { stacksWallet } = useWallet()
    const [notifications, setNotifications] = useState<{ type: 'success' | 'error', message: string }[]>([])

    const handleMemberAdded = (member: AddMemberParams) => {
        setNotifications(prev => [...prev, {
            type: 'success',
            message: `Successfully added ${member.memberName} to your wallet!`
        }])

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.slice(1))
        }, 5000)
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

    if (!stacksWallet.isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
                    <p className="text-gray-600 mb-6">
                        Please connect your Stacks wallet to manage members.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
                    <p className="text-gray-600 mt-1">
                        Add and manage members for your multi-signature wallet
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {notifications.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 py-4">
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

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <AddMemberComponent
                    walletAddress={stacksWallet.address || ''}
                    onMemberAdded={handleMemberAdded}
                    onError={handleError}
                />
            </div>

            {/* Footer */}
            <div className="bg-white border-t mt-12">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="text-center text-sm text-gray-500">
                        <p>
                            Need help? Check out our{' '}
                            <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                                documentation
                            </a>{' '}
                            or{' '}
                            <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
                                contact support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}