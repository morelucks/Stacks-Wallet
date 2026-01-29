import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface PlatformConfig {
  maxWalletsPerAdmin: number
  maxMembersPerWallet: number
  minWalletBalance: number
  maxWalletBalance: number
  defaultMemberSpendLimit: number
  walletCreationFee: number
  memberAdditionFee: number
  suspiciousActivityThreshold: number
  autoFreezeEnabled: boolean
  notificationsEnabled: boolean
  auditLogRetentionDays: number
  maintenanceMode: boolean
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: string
  totalTransactions: number
  errorRate: number
  responseTime: number
  memoryUsage: number
  diskUsage: number
}

interface PlatformSettingsProps {
  className?: string
}

export function PlatformSettings({ className = '' }: PlatformSettingsProps) {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Partial<PlatformConfig>>({})

  // Mock data
  const mockConfig: PlatformConfig = {
    maxWalletsPerAdmin: 5,
    maxMembersPerWallet: 100,
    minWalletBalance: 1000000, // 1 STX in microSTX
    maxWalletBalance: 1000000000000, // 1M STX in microSTX
    defaultMemberSpendLimit: 10000000, // 10 STX in microSTX
    walletCreationFee: 100000, // 0.1 STX in microSTX
    memberAdditionFee: 50000, // 0.05 STX in microSTX
    suspiciousActivityThreshold: 10,
    autoFreezeEnabled: true,
    notificationsEnabled: true,
    auditLogRetentionDays: 365,
    maintenanceMode: false
  }

  const mockSystemHealth: SystemHealth = {
    status: 'healthy',
    uptime: '15 days, 8 hours',
    totalTransactions: 12847,
    errorRate: 0.02,
    responseTime: 145,
    memoryUsage: 68,
    diskUsage: 42
  }

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setConfig(mockConfig)
        setSystemHealth(mockSystemHealth)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleConfigChange = (key: keyof PlatformConfig, value: any) => {
    if (!config) return

    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    setPendingChanges({ ...pendingChanges, [key]: value })
    setHasChanges(true)
  }

  const saveSettings = async () => {
    if (!config) return

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset changes tracking
      setHasChanges(false)
      setPendingChanges({})
      setShowConfirmation(false)
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    if (!config) return
    
    // Reset to original values
    const originalConfig = { ...mockConfig }
    setConfig(originalConfig)
    setHasChanges(false)
    setPendingChanges({})
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatSTX = (microSTX: number) => {
    return (microSTX / 1000000).toFixed(6)
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config || !systemHealth) {
    return (
      <div className={className}>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Settings</h3>
            <p className="text-red-700 mb-4">Failed to load platform configuration</p>
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
      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                {systemHealth.status.toUpperCase()}
              </div>
              <p className="text-xs text-gray-600 mt-1">Overall Status</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{systemHealth.uptime}</p>
              <p className="text-xs text-gray-600">Uptime</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{systemHealth.responseTime}ms</p>
              <p className="text-xs text-gray-600">Avg Response Time</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{systemHealth.errorRate}%</p>
              <p className="text-xs text-gray-600">Error Rate</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{systemHealth.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${systemHealth.memoryUsage > 80 ? 'bg-red-500' : systemHealth.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${systemHealth.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disk Usage</span>
                <span>{systemHealth.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${systemHealth.diskUsage > 80 ? 'bg-red-500' : systemHealth.diskUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${systemHealth.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Platform Configuration
            </CardTitle>
            <div className="flex gap-2">
              {hasChanges && (
                <>
                  <Button variant="outline" onClick={resetSettings}>
                    Reset
                  </Button>
                  <Button 
                    onClick={() => setShowConfirmation(true)}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Limits */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Wallet Limits</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Wallets per Admin
                </label>
                <Input
                  type="number"
                  value={config.maxWalletsPerAdmin}
                  onChange={(e) => handleConfigChange('maxWalletsPerAdmin', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Members per Wallet
                </label>
                <Input
                  type="number"
                  value={config.maxMembersPerWallet}
                  onChange={(e) => handleConfigChange('maxMembersPerWallet', parseInt(e.target.value))}
                  min="1"
                  max="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Wallet Balance (STX)
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formatSTX(config.minWalletBalance)}
                  onChange={(e) => handleConfigChange('minWalletBalance', parseFloat(e.target.value) * 1000000)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Wallet Balance (STX)
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formatSTX(config.maxWalletBalance)}
                  onChange={(e) => handleConfigChange('maxWalletBalance', parseFloat(e.target.value) * 1000000)}
                />
              </div>
            </div>

            {/* Fees and Security */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Fees & Security</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Creation Fee (STX)
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formatSTX(config.walletCreationFee)}
                  onChange={(e) => handleConfigChange('walletCreationFee', parseFloat(e.target.value) * 1000000)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Addition Fee (STX)
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formatSTX(config.memberAdditionFee)}
                  onChange={(e) => handleConfigChange('memberAdditionFee', parseFloat(e.target.value) * 1000000)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suspicious Activity Threshold
                </label>
                <Input
                  type="number"
                  value={config.suspiciousActivityThreshold}
                  onChange={(e) => handleConfigChange('suspiciousActivityThreshold', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audit Log Retention (Days)
                </label>
                <Input
                  type="number"
                  value={config.auditLogRetentionDays}
                  onChange={(e) => handleConfigChange('auditLogRetentionDays', parseInt(e.target.value))}
                  min="30"
                  max="3650"
                />
              </div>
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-4">System Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.autoFreezeEnabled}
                  onChange={(e) => handleConfigChange('autoFreezeEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Auto-freeze suspicious accounts</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.notificationsEnabled}
                  onChange={(e) => handleConfigChange('notificationsEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable platform notifications</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Maintenance mode</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Settings Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Are you sure you want to save these platform configuration changes?</p>
              
              {Object.keys(pendingChanges).length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Changes to be applied:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {Object.entries(pendingChanges).map(([key, value]) => (
                      <li key={key}>
                        • {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? 'Saving...' : 'Confirm Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSaving}
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