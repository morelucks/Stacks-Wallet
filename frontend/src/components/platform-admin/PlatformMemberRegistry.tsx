import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { GlobalMember, PlatformAdminService } from '../../services/platformAdminService'
import { MemberDetailModal } from './MemberDetailModal'

interface PlatformMemberRegistryProps {
  onMemberSelect?: (member: GlobalMember) => void
  className?: string
}

export function PlatformMemberRegistry({ onMemberSelect, className = '' }: PlatformMemberRegistryProps) {
  const [members, setMembers] = useState<GlobalMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<GlobalMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'frozen' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedMember, setSelectedMember] = useState<GlobalMember | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true)
      try {
        const membersData = await PlatformAdminService.getAllMembers()
        setMembers(membersData)
        setFilteredMembers(membersData)
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  useEffect(() => {
    let filtered = members.filter(member => {
      const matchesSearch = member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.memberAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.walletAssociations.some(assoc => 
                            assoc.walletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            assoc.adminAddress.toLowerCase().includes(searchTerm.toLowerCase())
                          )
      
      const matchesFilter = filterStatus === 'all' || member.accountStatus === filterStatus
      
      return matchesSearch && matchesFilter
    })

    setFilteredMembers(filtered)
    setCurrentPage(1)
  }, [members, searchTerm, filterStatus])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { status: 'Active', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' }
      case 'frozen':
        return { status: 'Frozen', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' }
      case 'inactive':
        return { status: 'Inactive', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' }
      default:
        return { status: 'Unknown', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Platform Member Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
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
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Platform Member Registry ({filteredMembers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by member name, address, or wallet association..."
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
          {paginatedMembers.length === 0 ? (
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
              {paginatedMembers.map((member) => {
                const statusInfo = getStatusInfo(member.accountStatus)
                
                return (
                  <div 
                    key={member.memberAddress} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onMemberSelect?.(member)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{member.memberName}</h4>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.status}
                            </span>
                          </div>
                          {member.walletAssociations.length > 1 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {member.walletAssociations.length} wallets
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-mono">{member.memberAddress}</p>
                          <div className="flex items-center gap-4">
                            <span>Total Spend Limit: <strong>{PlatformAdminService.formatSTX(member.totalSpendLimit)} STX</strong></span>
                            <span>Joined: <strong>{formatDate(member.joinDate)}</strong></span>
                          </div>
                          
                          {/* Wallet Associations */}
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 mb-1">Wallet Associations:</p>
                            <div className="flex flex-wrap gap-2">
                              {member.walletAssociations.map((assoc, index) => (
                                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                  <span className="font-medium">{assoc.walletName}</span>
                                  <span className="text-gray-500">({assoc.role})</span>
                                  {assoc.frozen && (
                                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  )
}