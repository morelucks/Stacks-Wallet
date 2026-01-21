import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { MemberInfo } from '../../services/walletService'

interface MemberListComponentProps {
    walletAddress: string
    members: MemberInfo[]
    isLoading: boolean
}

export function MemberListComponent({ members, isLoading }: MemberListComponentProps) {
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
                    <CardTitle className="text-lg font-semibold">Current Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (members.length === 0) {
        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Current Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Yet</h3>
                        <p className="text-gray-600">
                            Add your first member to start sharing wallet access with your team.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    Current Members ({members.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {members.map((member) => (
                        <div 
                            key={member.memberIdentifier} 
                            className={`border rounded-lg p-4 transition-all ${
                                member.active && !member.frozen 
                                    ? 'border-green-200 bg-green-50/30' 
                                    : 'border-red-200 bg-red-50/30'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900">{member.name}</h4>
                                        <span className="text-sm text-gray-500">#{member.memberIdentifier}</span>
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${
                                                member.active && !member.frozen 
                                                    ? 'bg-green-500' 
                                                    : 'bg-red-500'
                                            }`}></div>
                                            <span className={`text-xs font-medium ${
                                                member.active && !member.frozen 
                                                    ? 'text-green-700' 
                                                    : 'text-red-700'
                                            }`}>
                                                {!member.active ? 'Inactive' : member.frozen ? 'Frozen' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 font-mono break-all mb-2">
                                        {member.memberAddress}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>Spend Limit: <strong>{formatSTX(member.spendLimit)} STX</strong></span>
                                        <span>Role: <strong className="capitalize">{member.role}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}