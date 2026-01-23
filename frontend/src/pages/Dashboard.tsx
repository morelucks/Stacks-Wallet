
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { WalletStatus } from '../components/WalletStatus'
import { useWalletConnection } from '../hooks/useWalletConnection'
import { WalletCard, EmptyWalletState } from '../components/wallet'
import { Link } from 'react-router-dom'
import { useState } from 'react'

// Mock wallet data - in a real app, this would come from an API
const mockWallets = [
    {
        id: '1',
        name: 'Company Treasury',
        balance: 50000000000, // 50,000 STX in microSTX
        memberCount: 5,
        transactionCount: 23,
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
        adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    },
    {
        id: '2',
        name: 'Marketing Budget',
        balance: 15000000000, // 15,000 STX in microSTX
        memberCount: 3,
        transactionCount: 8,
        isActive: true,
        createdAt: '2024-02-01T14:20:00Z',
        adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    },
    {
        id: '3',
        name: 'Development Fund',
        balance: 25000000000, // 25,000 STX in microSTX
        memberCount: 7,
        transactionCount: 45,
        isActive: false,
        createdAt: '2024-01-20T09:15:00Z',
        adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    }
]

export default function Dashboard() {
    const { evmWallet, stacksWallet, isAnyWalletConnected, isBothWalletsConnected } = useWalletConnection()
    const [wallets, setWallets] = useState(mockWallets)
    const [showAllWallets, setShowAllWallets] = useState(false)

    const handleManageWallet = (walletId: string) => {
        console.log('Managing wallet:', walletId)
        // In a real app, navigate to wallet management page
        alert(`Managing wallet ${walletId} - This would navigate to the wallet management page`)
    }

    const handleFreezeWallet = (walletId: string) => {
        setWallets(prev => prev.map(wallet => 
            wallet.id === walletId ? { ...wallet, isActive: false } : wallet
        ))
    }

    const handleUnfreezeWallet = (walletId: string) => {
        setWallets(prev => prev.map(wallet => 
            wallet.id === walletId ? { ...wallet, isActive: true } : wallet
        ))
    }

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
    const activeWallets = wallets.filter(wallet => wallet.isActive)
    const totalTransactions = wallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0)

    if (!isConnected && !stacksConnected) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Get Started with WalletX</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            Connect your Ethereum and Stacks wallets to access the WalletX dashboard.
                        </p>
                        <WalletStatus />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-600">
                            Please connect your wallet to access the dashboard and manage your assets.
                        </p>
                        <p className="text-sm text-gray-500">
                            Supported wallets: Leather, Hiro, and other WalletConnect compatible wallets
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-gray-600">
                        {isBothWalletsConnected 
                            ? 'All wallets connected - Full functionality available' 
                            : 'Partial connection - Some features may be limited'
                        }
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {isBothWalletsConnected && (
                        <Link to="/create-wallet">
                            <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Wallet
                            </Button>
                        </Link>
                    )}
                    <Button disabled={!isBothWalletsConnected}>
                        New Transaction
                    </Button>
                </div>
            </div>

            {/* Wallet Status Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <WalletStatus />
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isBothWalletsConnected ? 
                                `${(totalBalance / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 })} STX` : 
                                '-- STX'
                            }
                        </div>
                        <p className="text-xs text-gray-500">
                            {isBothWalletsConnected ? 'Across all wallets' : 'Connect both wallets'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isBothWalletsConnected ? activeWallets.length : '--'}
                        </div>
                        <p className="text-xs text-gray-500">
                            {isBothWalletsConnected ? 
                                `${wallets.length - activeWallets.length} frozen` : 
                                'Connect both wallets'
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isBothWalletsConnected ? 
                                wallets.reduce((sum, wallet) => sum + wallet.memberCount, 0) : 
                                '--'
                            }
                        </div>
                        <p className="text-xs text-gray-500">
                            {isBothWalletsConnected ? 'Across all wallets' : 'Connect both wallets'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isBothWalletsConnected ? totalTransactions : '--'}
                        </div>
                        <p className="text-xs text-gray-500">
                            {isBothWalletsConnected ? 'Total processed' : 'Connect both wallets'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Wallets Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Your Wallets</h3>
                    {wallets.length > 3 && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAllWallets(!showAllWallets)}
                        >
                            {showAllWallets ? 'Show Less' : `Show All (${wallets.length})`}
                        </Button>
                    )}
                </div>

                {isBothWalletsConnected ? (
                    wallets.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {(showAllWallets ? wallets : wallets.slice(0, 3)).map((wallet) => (
                                <WalletCard
                                    key={wallet.id}
                                    wallet={wallet}
                                    onManage={handleManageWallet}
                                    onFreeze={handleFreezeWallet}
                                    onUnfreeze={handleUnfreezeWallet}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyWalletState />
                    )
                ) : (
                    <Card className="border-2 border-dashed border-gray-300">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Both Wallets</h3>
                            <p className="text-gray-600 mb-4 max-w-sm">
                                Connect both your Ethereum and Stacks wallets to view and manage your multi-signature wallets.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Actions */}
            {isBothWalletsConnected && wallets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Link to="/create-wallet">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create New Wallet
                                </Button>
                            </Link>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                disabled={!stacksWallet.isConnected}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Add Funds
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Manage Members
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                View Reports
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
