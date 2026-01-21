import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { WalletService, MemberInfo } from '../../services/walletService'

interface MemberDashboardProps {
    memberAddress: string
    className?: string
}

export function MemberDashboard({ memberAddress, className = '' }: MemberDashboardProps) {
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMemberInfo = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // Mock member data - in real implementation, this would be a contract call
                const mockMemberInfo: MemberInfo = {
                    memberAddress: memberAddress,
                    adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                    organizationName: 'Tech Startup Wallet',
                    name: 'John Doe',
                    active: true,
                    frozen: false,
                    spendLimit: 50000000, // 50 STX in microSTX
                    memberIdentifier: 1,
                    role: 'member'
                }
                setMemberInfo(mockMemberInfo)
            } catch (err) {
                setError('Failed to load member information')
                console.error('Error fetching member info:', err)
            } finally {
                setIsLoading(false)
            }
        }

        if (memberAddress) {
            fetchMemberInfo()
        }
    }, [memberAddress])

    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card>
                    <CardHeader>
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="animate-pulse space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error || !memberInfo) {
        return (
            <div className={`${className}`}>
                <Card className="border-red-200 bg-red-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Member Data</h3>
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
            {/* Member Profile Card */}
            <Card className={`${memberInfo.active && !memberInfo.frozen ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                                {memberInfo.name}
                            </CardTitle>
                            <p className="text-gray-600">Member #{memberInfo.memberIdentifier}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                                memberInfo.active && !memberInfo.frozen ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                memberInfo.active && !memberInfo.frozen 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {!memberInfo.active ? 'Inactive' : memberInfo.frozen ? 'Frozen' : 'Active'}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Spend Limit */}
                        <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {formatSTX(memberInfo.spendLimit)} STX
                            </div>
                            <p className="text-sm text-gray-600">Available Spend Limit</p>
                        </div>

                        {/* Organization */}
                        <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-lg font-semibold text-gray-900 mb-1">
                                {memberInfo.organizationName}
                            </div>
                            <p className="text-sm text-gray-600">Organization</p>
                        </div>

                        {/* Role */}
                        <div className="text-center p-4 bg-white rounded-lg border">
                            <div className="text-lg font-semibold text-purple-600 mb-1 capitalize">
                                {memberInfo.role}
                            </div>
                            <p className="text-sm text-gray-600">Role</p>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Wallet Addresses</h4>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500">Member Address</p>
                                <p className="text-sm font-mono text-gray-800 break-all">{memberInfo.memberAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Admin Address</p>
                                <p className="text-sm font-mono text-gray-800 break-all">{memberInfo.adminAddress}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}