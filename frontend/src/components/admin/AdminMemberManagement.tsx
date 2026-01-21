import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { MemberInfo } from '../../services/walletService'

interface AdminMemberManagementProps {
    adminAddress: string
    className?: string
}

interface MemberAction {
    type: 'freeze' | 'unfreeze' | 'remove' | 'reimburse'
    memberId: number
    memberName: string
}

export function AdminMemberManagement({ adminAddress, className = '' }: AdminMemberManagementProps) {
    const [members, setMembers] = useState<MemberInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'frozen' | 'inactive'>('all')
    const [actionInProgress, setActionInProgress] = useState<number | null>(null)
    const [selectedAction, setSelectedAction] = useState<MemberAction | null>(null)
    const [reimburseAmount, setReimburseAmount] = useState('')

    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true)
            try {
                // Mock member data - in real implementation, this would be contract calls
                const mockMembers: MemberInfo[] = [
                    {
                        memberAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                        adminAddress: adminAddress,
                        organizationName: 'Tech Startup Wallet',
                        name: 'John Doe',
                        active: true,
                        frozen: false,
                        spendLimit: 50000000, // 50 STX
                        memberIdentifier: 1,
                        role: 'member'
                    },
                    {
                        memberAddress: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
                        adminAddress: adminAddress,
                        organizationName: 'Tech Startup Wallet',
                        name: 'Jane Smith',
                        active: true,
                        frozen: true,
                        spendLimit: 25000000, // 25 STX
                        memberIdentifier: 2,
                        role: 'member'
                    },
                    {
                        memberAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
                        adminAddress: adminAddress,
                        organizationName: 'Tech Startup Wallet',
                        name: 'Bob Johnson',
                        active: false,
                        frozen: false,
                        spendLimit: 0,
                        memberIdentifier: 3,
                        role: 'member'
                    },
                    {
                        memberAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
                        adminAddress: adminAddress,
                        organizationName: 'Tech Startup Wallet',
                        name: 'Alice Wilson',
                        active: true,
                        frozen: false,
                        spendLimit: 75000000, // 75 STX
                        memberIdentifier: 4,
                        role: 'member'
                    }
                ]
                
                await new Promise(resolve => setTimeout(resolve, 1000))
                setMembers(mockMembers)
            } catch (error) {
                console.error('Error fetching members:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (adminAddress) {
            fetchMembers()
        }
    }, [adminAddress])

    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    const getStatusInfo = (member: MemberInfo) => {
        if (!member.active) {
            return { status: 'Inactive', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' }
        }
        if (member.frozen) {
            return { status: 'Frozen', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' }
        }
        return { status: 'Active', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' }
    }

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.memberAddress.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesFilter = filterStatus === 'all' || 
                            (filterStatus === 'active' && member.active && !member.frozen) ||
                            (filterStatus === 'frozen' && member.frozen) ||
                            (filterStatus === 'inactive' && !member.active)
        
        return matchesSearch && matchesFilter
    })

    const handleMemberAction = async (action: MemberAction) => {
        setActionInProgress(action.memberId)
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            // Update member status based on action
            setMembers(prev => prev.map(member => {
                if (member.memberIdentifier === action.memberId) {
                    switch (action.type) {
                        case 'freeze':
                            return { ...member, frozen: true }
                        case 'unfreeze':
                            return { ...member, frozen: false }
                        case 'remove':
                            return { ...member, active: false, spendLimit: 0 }
                        case 'reimburse':
                            const additionalAmount = parseFloat(reimburseAmount) * 1000000
                            return { ...member, spendLimit: member.spendLimit + additionalAmount }
                        default:
                            return member
                    }
                }
                return member
            }))
            
            setSelectedAction(null)
            setReimburseAmount('')
        } catch (error) {
            console.error('Error performing member action:', error)
        } finally {
            setActionInProgress(null)
        }
    }

    const openActionModal = (action: MemberAction) => {
        setSelectedAction(action)
        if (action.type !== 'reimburse') {
            handleMemberAction(action)
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Member Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse border rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Member Management ({filteredMembers.length})
                        </CardTitle>
                        <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Member
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <Input
                                placeholder="Search members by name or address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'active', 'frozen', 'inactive'] as const).map(status => (
                                <Button
                                    key={status}
                                    variant={filterStatus === status ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus(status)}
                                    className="capitalize"
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Members List */}
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Found</h3>
                            <p className="text-gray-600">
                                {searchTerm ? 'Try adjusting your search terms.' : 'No members match the selected filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMembers.map((member) => {
                                const statusInfo = getStatusInfo(member)
                                const isProcessing = actionInProgress === member.memberIdentifier
                                
                                return (
                                    <div key={member.memberIdentifier} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                                    <span className="text-sm text-gray-500">#{member.memberIdentifier}</span>
                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                            {statusInfo.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p className="font-mono">{member.memberAddress}</p>
                                                    <p>Spend Limit: <strong>{formatSTX(member.spendLimit)} STX</strong></p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {isProcessing ? (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="text-sm">Processing...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {member.active && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openActionModal({
                                                                        type: 'reimburse',
                                                                        memberId: member.memberIdentifier,
                                                                        memberName: member.name
                                                                    })}
                                                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                                                >
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                    </svg>
                                                                    Add Funds
                                                                </Button>
                                                                
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openActionModal({
                                                                        type: member.frozen ? 'unfreeze' : 'freeze',
                                                                        memberId: member.memberIdentifier,
                                                                        memberName: member.name
                                                                    })}
                                                                    className={member.frozen 
                                                                        ? "text-blue-600 border-blue-300 hover:bg-blue-50"
                                                                        : "text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                                                                    }
                                                                >
                                                                    {member.frozen ? (
                                                                        <>
                                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                            </svg>
                                                                            Unfreeze
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                            </svg>
                                                                            Freeze
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </>
                                                        )}
                                                        
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openActionModal({
                                                                type: 'remove',
                                                                memberId: member.memberIdentifier,
                                                                memberName: member.name
                                                            })}
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Remove
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reimburse Modal */}
            {selectedAction?.type === 'reimburse' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Add Funds to {selectedAction.memberName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                label="Amount (STX)"
                                type="number"
                                step="0.000001"
                                placeholder="0.000000"
                                value={reimburseAmount}
                                onChange={(e) => setReimburseAmount(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleMemberAction(selectedAction)}
                                    disabled={!reimburseAmount || parseFloat(reimburseAmount) <= 0}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                                >
                                    Add Funds
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedAction(null)
                                        setReimburseAmount('')
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}