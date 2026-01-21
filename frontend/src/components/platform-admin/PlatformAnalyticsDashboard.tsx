import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { PlatformAnalytics, PlatformAdminService } from '../../services/platformAdminService'

interface PlatformAnalyticsDashboardProps {
  timeRange?: 'day' | 'week' | 'month' | 'year'
  className?: string
}

export function PlatformAnalyticsDashboard({ timeRange = 'week', className = '' }: PlatformAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        const analyticsData = await PlatformAdminService.getPlatformAnalytics()
        setAnalytics(analyticsData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedTimeRange])

  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    if (!analytics) return

    const data = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      metrics: analytics
    }

    const filename = `platform-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const jsonUrl = URL.createObjectURL(jsonBlob)
        const jsonLink = document.createElement('a')
        jsonLink.href = jsonUrl
        jsonLink.download = `${filename}.json`
        jsonLink.click()
        break
      
      case 'csv':
        const csvData = [
          ['Metric', 'Value'],
          ['Total Wallets', analytics.totalWallets],
          ['Total Members', analytics.totalMembers],
          ['Total Value Locked (STX)', PlatformAdminService.formatSTX(analytics.totalValueLocked)],
          ['Transaction Volume (STX)', PlatformAdminService.formatSTX(analytics.transactionVolume)],
          ['Wallets Growth (%)', analytics.growthMetrics.walletsGrowth],
          ['Members Growth (%)', analytics.growthMetrics.membersGrowth],
          ['Volume Growth (%)', analytics.growthMetrics.volumeGrowth]
        ]
        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const csvBlob = new Blob([csvContent], { type: 'text/csv' })
        const csvUrl = URL.createObjectURL(csvBlob)
        const csvLink = document.createElement('a')
        csvLink.href = csvUrl
        csvLink.download = `${filename}.csv`
        csvLink.click()
        break
      
      case 'pdf':
        // In a real implementation, you would use a PDF library like jsPDF
        alert('PDF export would be implemented with a PDF library like jsPDF')
        break
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analytics</h3>
            <p className="text-red-700 mb-4">Failed to load platform analytics data</p>
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
      {/* Header with Time Range and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Platform Analytics
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {(['day', 'week', 'month', 'year'] as const).map(range => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                    className="capitalize"
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportData('json')}>
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Wallets */}
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Wallets</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalWallets}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              +{analytics.growthMetrics.walletsGrowth}% from last {selectedTimeRange}
            </div>
          </CardContent>
        </Card>

        {/* Total Members */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Members</p>
                <p className="text-3xl font-bold text-green-900">{analytics.totalMembers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">
              +{analytics.growthMetrics.membersGrowth}% from last {selectedTimeRange}
            </div>
          </CardContent>
        </Card>

        {/* Total Value Locked */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Value Locked</p>
                <p className="text-3xl font-bold text-purple-900">
                  {PlatformAdminService.formatSTX(analytics.totalValueLocked)}
                </p>
                <p className="text-xs text-purple-700">STX</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-purple-600">
              +{analytics.growthMetrics.volumeGrowth}% from last {selectedTimeRange}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Transaction Volume</p>
                <p className="text-3xl font-bold text-orange-900">
                  {PlatformAdminService.formatSTX(analytics.transactionVolume)}
                </p>
                <p className="text-xs text-orange-700">STX</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-sm text-orange-600">
              Last {selectedTimeRange} activity
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Patterns Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2 p-4 bg-gray-50 rounded-lg">
            {analytics.activityPatterns.map((pattern, index) => {
              const maxValue = Math.max(...analytics.activityPatterns.map(p => p.walletCreations + p.memberAdditions + p.transactionCount))
              const totalActivity = pattern.walletCreations + pattern.memberAdditions + pattern.transactionCount
              const height = (totalActivity / maxValue) * 200
              
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                      style={{ height: `${height}px` }}
                      title={`Total Activity: ${totalActivity}`}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                      {new Date(pattern.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Combined Activity (Wallets + Members + Transactions)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Activity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Wallet Creations</th>
                  <th className="text-right py-2">Member Additions</th>
                  <th className="text-right py-2">Transactions</th>
                  <th className="text-right py-2">Total Activity</th>
                </tr>
              </thead>
              <tbody>
                {analytics.activityPatterns.map((pattern, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2">{new Date(pattern.date).toLocaleDateString()}</td>
                    <td className="text-right py-2">{pattern.walletCreations}</td>
                    <td className="text-right py-2">{pattern.memberAdditions}</td>
                    <td className="text-right py-2">{pattern.transactionCount}</td>
                    <td className="text-right py-2 font-semibold">
                      {pattern.walletCreations + pattern.memberAdditions + pattern.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}