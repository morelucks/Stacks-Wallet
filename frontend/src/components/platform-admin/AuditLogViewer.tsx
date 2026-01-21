import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface AuditLogEntry {
  id: string
  timestamp: string
  adminAddress: string
  action: string
  resourceType: 'wallet' | 'member' | 'platform'
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  success: boolean
}

interface AuditLogViewerProps {
  className?: string
}

export function AuditLogViewer({ className = '' }: AuditLogViewerProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterResource, setFilterResource] = useState<string>('all')
  const [filterSuccess, setFilterSuccess] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Mock audit log data
  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-12-30T10:30:00Z',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      action: 'freeze_member',
      resourceType: 'member',
      resourceId: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
      details: 'Frozen member due to suspicious activity',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true
    },
    {
      id: '2',
      timestamp: '2024-12-30T09:15:00Z',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      action: 'view_wallet_details',
      resourceType: 'wallet',
      resourceId: '3',
      details: 'Accessed wallet details for investigation',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true
    },
    {
      id: '3',
      timestamp: '2024-12-30T08:45:00Z',
      adminAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
      action: 'bulk_export_data',
      resourceType: 'platform',
      resourceId: 'export_001',
      details: 'Exported member data for compliance report',
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      success: true
    },
    {
      id: '4',
      timestamp: '2024-12-30T07:20:00Z',
      adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      action: 'update_platform_settings',
      resourceType: 'platform',
      resourceId: 'settings',
      details: 'Failed to update wallet creation limits - insufficient permissions',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: false
    },
    {
      id: '5',
      timestamp: '2024-12-29T16:30:00Z',
      adminAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
      action: 'send_notification',
      resourceType: 'member',
      resourceId: 'bulk_notification_001',
      details: 'Sent platform maintenance notification to 15 members',
      ipAddress: '10.0.0.50',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      success: true
    }
  ]

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAuditLogs(mockAuditLogs)
        setFilteredLogs(mockAuditLogs)
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  useEffect(() => {
    let filtered = auditLogs.filter(log => {
      const matchesSearch = log.adminAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.resourceId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesAction = filterAction === 'all' || log.action === filterAction
      const matchesResource = filterResource === 'all' || log.resourceType === filterResource
      const matchesSuccess = filterSuccess === 'all' || 
                           (filterSuccess === 'success' && log.success) ||
                           (filterSuccess === 'failure' && !log.success)
      
      return matchesSearch && matchesAction && matchesResource && matchesSuccess
    })

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [auditLogs, searchTerm, filterAction, filterResource, filterSuccess])

  const getActionColor = (action: string) => {
    if (action.includes('freeze') || action.includes('remove') || action.includes('delete')) {
      return 'bg-red-100 text-red-800'
    }
    if (action.includes('create') || action.includes('add') || action.includes('unfreeze')) {
      return 'bg-green-100 text-green-800'
    }
    if (action.includes('update') || action.includes('modify')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportAuditLogs = (format: 'csv' | 'json') => {
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}`

    if (format === 'json') {
      const jsonBlob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(jsonBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.json`
      link.click()
    } else {
      const csvData = [
        ['Timestamp', 'Admin Address', 'Action', 'Resource Type', 'Resource ID', 'Details', 'Success', 'IP Address'],
        ...filteredLogs.map(log => [
          log.timestamp,
          log.adminAddress,
          log.action,
          log.resourceType,
          log.resourceId,
          log.details,
          log.success ? 'Success' : 'Failure',
          log.ipAddress
        ])
      ]
      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const csvBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(csvBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.csv`
      link.click()
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))]

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Audit Log Viewer</CardTitle>
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
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Audit Log Viewer ({filteredLogs.length} entries)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportAuditLogs('csv')}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportAuditLogs('json')}>
                Export JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace('_', ' ')}</option>
              ))}
            </select>

            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Resources</option>
              <option value="wallet">Wallets</option>
              <option value="member">Members</option>
              <option value="platform">Platform</option>
            </select>

            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Results</option>
              <option value="success">Success Only</option>
              <option value="failure">Failures Only</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilterAction('all')
                setFilterResource('all')
                setFilterSuccess('all')
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Timestamp</th>
                  <th className="text-left py-3 px-4">Admin</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Resource</th>
                  <th className="text-left py-3 px-4">Details</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {log.adminAddress.slice(0, 8)}...{log.adminAddress.slice(-6)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{log.resourceType}</span>
                        <span className="text-gray-500 font-mono text-xs">
                          {log.resourceId.length > 10 ? `${log.resourceId.slice(0, 10)}...` : log.resourceId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? 'Success' : 'Failure'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
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
    </div>
  )
}