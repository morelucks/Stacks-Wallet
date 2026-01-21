import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PlatformWallet, PlatformAdminService } from '../../services/platformAdminService'
import { WalletDetailModal } from './WalletDetailModal'

interface PlatformWalletRegistryProps {
  onWalletSelect?: (wallet: PlatformWallet) => void
  className?: string
}

export function PlatformWalletRegistry({ onWalletSelect, className = '' }: PlatformWalletRegistryProps) {
  const [wallets, setWallets] = useState<PlatformWallet[]>([])
  const [filteredWallets, setFilteredWallets] = useState<PlatformWallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'creationDate' | 'balance' | 'memberCount' | 'activity'>('creationDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedWallet, setSelectedWallet] = useState<PlatformWallet | null>(null)

  useEffect(() => {
    const fetchWallets = async () => {
      setIsLoading(true)
      try {
        const walletsData = await PlatformAdminService.getAllWallets()
        setWallets(walletsData)
        setFilteredWallets(walletsData)
      } catch (error) {
        console.error('Error fetching wallets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWallets()
  }, [])

  useEffect(() => {
    let filtered = wallets.filter(wallet => 
      wallet.walletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.adminAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.walletId.toString().includes(searchTerm)
    )

    // Sort wallets
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'creationDate':
          aValue = new Date(a.creationDate).getTime()
          bValue = new Date(b.creationDate).getTime()
          break
        case 'balance':
          aValue = a.currentBalance
          bValue = b.currentBalance
          break
        case 'memberCount':
          aValue = a.memberCount
          bValue = b.memberCount
          break
        case 'activity':
          const activityOrder = { high: 3, medium: 2, low: 1 }
          aValue = activityOrder[a.activityLevel]
          bValue = activityOrder[b.activityLevel]
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredWallets(filtered)
    setCurrentPage(1)
  }, [wallets, searchTerm, sortBy, sortOrder])

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
  const totalPages = Math.ceil(filteredWallets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedWallets = filteredWallets.slice(startIndex, startIndex + itemsPerPage)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Platform Wallet Registry</CardTitle>
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
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Platform Wallet Registry ({filteredWallets.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by wallet name, admin address, or wallet ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="creationDate">Creation Date</option>
                <option value="balance">Balance</option>
                <option value="memberCount">Member Count</option>
                <option value="activity">Activity Level</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Wallets List */}
          {paginatedWallets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Wallets Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'No wallets have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedWallets.map((wallet) => (
                <div 
                  key={wallet.walletId} 
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    wallet.suspiciousActivity ? 'border-red-300 bg-red-50/30' : ''
                  }`}
                  onClick={() => onWalletSelect?.(wallet)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{wallet.walletName}</h4>
                        <span className="text-sm text-gray-500">#{wallet.walletId}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(wallet.activityLevel)}`}>
                          {wallet.activityLevel} activity
                        </span>
                        {wallet.suspiciousActivity && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Suspicious
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-mono">{wallet.adminAddress}</p>
                        <div className="flex items-center gap-4">
                          <span>Balance: <strong>{PlatformAdminService.formatSTX(wallet.currentBalance)} STX</strong></span>
                          <span>Members: <strong>{wallet.memberCount}</strong></span>
                          <span>Created: <strong>{formatDate(wallet.creationDate)}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedWallet(wallet)}
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
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWallets.length)} of {filteredWallets.length} wallets
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

      {/* Wallet Detail Modal */}
      {selectedWallet && (
        <WalletDetailModal
          wallet={selectedWallet}
          onClose={() => setSelectedWallet(null)}
        />
      )}
    </div>
  )
}