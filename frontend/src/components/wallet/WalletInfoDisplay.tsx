import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface WalletInfoDisplayProps {
    walletAddress: string
    balance: number
    memberCount: number
    isLoading: boolean
    walletName?: string
}

export function WalletInfoDisplay({ 
    walletAddress, 
    balance, 
    memberCount, 
    isLoading, 
    walletName = 'My Wallet' 
}: WalletInfoDisplayProps) {
    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    if (isLoading) {
        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Wallet Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded"></div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded"></div>
                        </div>
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                    {walletName} - Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Wallet Balance */}
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatSTX(balance)} STX
                        </p>
                    </div>

                    {/* Member Count */}
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-gray-600 mb-1">Active Members</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {memberCount}
                        </p>
                    </div>

                    {/* Wallet Address */}
                    <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm font-medium text-gray-600 mb-1">Admin Address</p>
                        <p className="text-xs font-mono text-gray-800 break-all">
                            {walletAddress}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}