import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface WalletSettings {
    walletName: string
    description: string
    maxMembers: number
    defaultSpendLimit: number
    requireApproval: boolean
    autoFreeze: boolean
    notifications: {
        memberActions: boolean
        largeTransactions: boolean
        dailyReports: boolean
        securityAlerts: boolean
    }
    security: {
        multiSigRequired: boolean
        freezeThreshold: number
        maxDailyWithdrawal: number
    }
}

interface AdminSettingsProps {
    adminAddress: string
    className?: string
}

export function AdminSettings({ adminAddress, className = '' }: AdminSettingsProps) {
    const [settings, setSettings] = useState<WalletSettings>({
        walletName: 'Tech Startup Multi-Sig Wallet',
        description: 'Multi-signature wallet for team expense management and fund distribution',
        maxMembers: 20,
        defaultSpendLimit: 10, // 10 STX
        requireApproval: false,
        autoFreeze: true,
        notifications: {
            memberActions: true,
            largeTransactions: true,
            dailyReports: false,
            securityAlerts: true
        },
        security: {
            multiSigRequired: false,
            freezeThreshold: 100, // 100 STX
            maxDailyWithdrawal: 500 // 500 STX
        }
    })

    const [isLoading, setIsLoading] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general')

    const handleInputChange = (field: keyof Omit<WalletSettings, 'notifications' | 'security'>, value: string | number | boolean) => {
        setSettings(prev => ({ ...prev, [field]: value }))
        if (saveStatus === 'saved') setSaveStatus('idle')
    }

    const handleNotificationChange = (field: keyof WalletSettings['notifications'], value: boolean) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [field]: value }
        }))
        if (saveStatus === 'saved') setSaveStatus('idle')
    }

    const handleSecurityChange = (field: keyof WalletSettings['security'], value: number | boolean) => {
        setSettings(prev => ({
            ...prev,
            security: { ...prev.security, [field]: value }
        }))
        if (saveStatus === 'saved') setSaveStatus('idle')
    }

    const handleSave = async () => {
        setSaveStatus('saving')
        setIsLoading(true)

        try {
            // Simulate API call to update wallet settings
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            setSaveStatus('saved')
            
            // Reset status after 3 seconds
            setTimeout(() => {
                setSaveStatus('idle')
            }, 3000)
        } catch (error) {
            setSaveStatus('error')
            console.error('Error saving settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        setSettings({
            walletName: 'Tech Startup Multi-Sig Wallet',
            description: 'Multi-signature wallet for team expense management and fund distribution',
            maxMembers: 20,
            defaultSpendLimit: 10,
            requireApproval: false,
            autoFreeze: true,
            notifications: {
                memberActions: true,
                largeTransactions: true,
                dailyReports: false,
                securityAlerts: true
            },
            security: {
                multiSigRequired: false,
                freezeThreshold: 100,
                maxDailyWithdrawal: 500
            }
        })
        setSaveStatus('idle')
    }

    const tabs = [
        { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-5 5v-5zM4.868 19.718l8.485-8.485M4.868 19.718L1.5 16.35l2.829-2.829m0 6.197l2.828-2.828M15 11V5a4 4 0 00-8 0v6l-2 2v3h12v-3l-2-2z' }
    ]

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Wallet Settings
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-orange-500 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                            </svg>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && (
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Wallet Name"
                                value={settings.walletName}
                                onChange={(e) => handleInputChange('walletName', e.target.value)}
                                disabled={isLoading}
                            />
                            
                            <Input
                                label="Maximum Members"
                                type="number"
                                value={settings.maxMembers}
                                onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={settings.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                disabled={isLoading}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-950"
                                placeholder="Describe the purpose of this wallet..."
                            />
                        </div>

                        <Input
                            label="Default Spend Limit (STX)"
                            type="number"
                            step="0.000001"
                            value={settings.defaultSpendLimit}
                            onChange={(e) => handleInputChange('defaultSpendLimit', parseFloat(e.target.value))}
                            disabled={isLoading}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Require Approval for New Members</h4>
                                    <p className="text-sm text-gray-600">New members need admin approval before activation</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.requireApproval}
                                        onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Auto-Freeze Suspicious Activity</h4>
                                    <p className="text-sm text-gray-600">Automatically freeze members with unusual spending patterns</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoFreeze}
                                        onChange={(e) => handleInputChange('autoFreeze', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'security' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Auto-Freeze Threshold (STX)"
                                type="number"
                                step="0.000001"
                                value={settings.security.freezeThreshold}
                                onChange={(e) => handleSecurityChange('freezeThreshold', parseFloat(e.target.value))}
                                disabled={isLoading}
                            />
                            
                            <Input
                                label="Max Daily Withdrawal (STX)"
                                type="number"
                                step="0.000001"
                                value={settings.security.maxDailyWithdrawal}
                                onChange={(e) => handleSecurityChange('maxDailyWithdrawal', parseFloat(e.target.value))}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Multi-Signature Required</h4>
                                <p className="text-sm text-gray-600">Require multiple signatures for large transactions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.security.multiSigRequired}
                                    onChange={(e) => handleSecurityChange('multiSigRequired', e.target.checked)}
                                    className="sr-only peer"
                                    disabled={isLoading}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <h4 className="font-medium text-yellow-800">Security Recommendations</h4>
                                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                                        <li>• Enable auto-freeze for transactions above 100 STX</li>
                                        <li>• Set daily withdrawal limits based on your organization's needs</li>
                                        <li>• Consider multi-signature for transactions above 50 STX</li>
                                        <li>• Regularly review member activity and permissions</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'notifications' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Member Actions</h4>
                                    <p className="text-sm text-gray-600">Get notified when members join, leave, or are frozen</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.memberActions}
                                        onChange={(e) => handleNotificationChange('memberActions', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Large Transactions</h4>
                                    <p className="text-sm text-gray-600">Get notified of transactions above the freeze threshold</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.largeTransactions}
                                        onChange={(e) => handleNotificationChange('largeTransactions', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Daily Reports</h4>
                                    <p className="text-sm text-gray-600">Receive daily summary of wallet activity</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.dailyReports}
                                        onChange={(e) => handleNotificationChange('dailyReports', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900">Security Alerts</h4>
                                    <p className="text-sm text-gray-600">Get notified of suspicious activity and security events</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications.securityAlerts}
                                        onChange={(e) => handleNotificationChange('securityAlerts', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Save Status and Actions */}
            {saveStatus !== 'idle' && (
                <div className={`p-4 rounded-md border ${
                    saveStatus === 'saved' 
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : saveStatus === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                    <div className="flex items-center">
                        {saveStatus === 'saving' && (
                            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {saveStatus === 'saved' && (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {saveStatus === 'error' && (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium">
                            {saveStatus === 'saving' && 'Saving settings...'}
                            {saveStatus === 'saved' && 'Settings saved successfully!'}
                            {saveStatus === 'error' && 'Failed to save settings. Please try again.'}
                        </span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Settings
                        </>
                    )}
                </Button>

                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                >
                    Reset to Defaults
                </Button>
            </div>

            {/* Admin Address Info */}
            <Card className="bg-gray-50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Admin Address</p>
                            <p className="font-mono text-sm text-gray-900">{adminAddress}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}