import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface PlatformNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  source: string
  actionRequired: boolean
  actionUrl?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  resolvedNotes?: string
}

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<PlatformNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterResolved, setFilterResolved] = useState<string>('all')
  const [selectedNotification, setSelectedNotification] = useState<PlatformNotification | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')

  // Mock notification data
  const mockNotifications: PlatformNotification[] = [
    {
      id: '1',
      title: 'Suspicious Wallet Activity Detected',
      message: 'Wallet #3 has shown unusual transaction patterns with multiple large withdrawals in a short timeframe.',
      type: 'warning',
      severity: 'high',
      timestamp: '2024-12-30T10:30:00Z',
      source: 'Security Monitor',
      actionRequired: true,
      actionUrl: '/admin/wallets/3',
      resolved: false
    },
    {
      id: '2',
      title: 'System Maintenance Scheduled',
      message: 'Platform maintenance is scheduled for January 1st, 2025 from 2:00 AM to 4:00 AM UTC.',
      type: 'info',
      severity: 'medium',
      timestamp: '2024-12-30T09:00:00Z',
      source: 'System Admin',
      actionRequired: false,
      resolved: false
    },
    {
      id: '3',
      title: 'High Memory Usage Alert',
      message: 'System memory usage has exceeded 85% for the past 30 minutes.',
      type: 'error',
      severity: 'critical',
      timestamp: '2024-12-30T08:45:00Z',
      source: 'System Monitor',
      actionRequired: true,
      resolved: true,
      resolvedBy: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      resolvedAt: '2024-12-30T09:15:00Z',
      resolvedNotes: 'Restarted memory-intensive processes and optimized cache usage.'
    },
    {
      id: '4',
      title: 'New Wallet Registration Spike',
      message: '15 new wallets were created in the last hour, which is 300% above normal.',
      type: 'info',
      severity: 'medium',
      timestamp: '2024-12-30T07:30:00Z',
      source: 'Analytics Engine',
      actionRequired: false,
      resolved: false
    },
    {
      id: '5',
      title: 'Failed Transaction Rate Increase',
      message: 'Transaction failure rate has increased to 5.2%, exceeding the 3% threshold.',
      type: 'warning',
      severity: 'high',
      timestamp: '2024-12-29T16:20:00Z',
      source: 'Transaction Monitor',
      actionRequired: true,
      resolved: false
    }
  ]

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setNotifications(mockNotifications)
        setFilteredNotifications(mockNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  useEffect(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.source.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || notification.type === filterType
      const matchesSeverity = filterSeverity === 'all' || notification.severity === filterSeverity
      const matchesResolved = filterResolved === 'all' || 
                            (filterResolved === 'resolved' && notification.resolved) ||
                            (filterResolved === 'unresolved' && !notification.resolved)
      
      return matchesSearch && matchesType && matchesSeverity && matchesResolved
    })

    // Sort by timestamp (newest first), then by severity
    filtered.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      
      if (!a.resolved && b.resolved) return -1
      if (a.resolved && !b.resolved) return 1
      
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      
      return timeB - timeA
    })

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, filterType, filterSeverity, filterResolved])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const resolveNotification = async (notification: PlatformNotification) => {
    if (!resolveNotes.trim()) {
      alert('Please provide resolution notes')
      return
    }

    try {
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id 
          ? {
              ...n,
              resolved: true,
              resolvedBy: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock admin address
              resolvedAt: new Date().toISOString(),
              resolvedNotes: resolveNotes
            }
          : n
      )
      
      setNotifications(updatedNotifications)
      setSelectedNotification(null)
      setResolveNotes('')
      
      alert('Notification marked as resolved')
    } catch (error) {
      console.error('Error resolving notification:', error)
      alert('Failed to resolve notification')
    }
  }

  const getUnresolvedCount = () => {
    return notifications.filter(n => !n.resolved).length
  }

  const getCriticalCount = () => {
    return notifications.filter(n => !n.resolved && n.severity === 'critical').length
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Unresolved</p>
                <p className="text-2xl font-bold text-orange-900">{getUnresolvedCount()}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Critical</p>
                <p className="text-2xl font-bold text-red-900">{getCriticalCount()}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z M4 19.5A2.5 2.5 0 016.5 17H20" />
              </svg>
              Platform Notifications ({filteredNotifications.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setFilterSeverity('all')
                setFilterResolved('all')
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Notifications */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'No notifications match the selected filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-lg p-4 ${notification.resolved ? 'opacity-60' : ''} ${getTypeColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(notification.severity)}`}></div>
                        <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{notification.source}</span>
                        {notification.resolved && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        <span className="capitalize">{notification.severity} severity</span>
                        {notification.resolved && notification.resolvedBy && (
                          <span>Resolved by {notification.resolvedBy.slice(0, 8)}...{notification.resolvedBy.slice(-6)}</span>
                        )}
                      </div>
                      {notification.resolved && notification.resolvedNotes && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                          <strong>Resolution:</strong> {notification.resolvedNotes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {notification.actionRequired && notification.actionUrl && !notification.resolved && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                      {!notification.resolved && (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedNotification(notification)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Resolve Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedNotification.title}</h4>
                <p className="text-sm text-gray-600">{selectedNotification.message}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes:
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Describe how this issue was resolved..."
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => resolveNotification(selectedNotification)}
                  disabled={!resolveNotes.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedNotification(null)
                    setResolveNotes('')
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