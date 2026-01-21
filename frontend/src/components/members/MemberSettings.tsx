import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface MemberSettingsProps {
    memberAddress: string
    currentName: string
    organizationName: string
    className?: string
}

interface SettingsFormState {
    displayName: string
    email: string
    notifications: {
        transactions: boolean
        balanceUpdates: boolean
        adminMessages: boolean
    }
}

export function MemberSettings({ 
    memberAddress, 
    currentName, 
    organizationName,
    className = '' 
}: MemberSettingsProps) {
    const [formState, setFormState] = useState<SettingsFormState>({
        displayName: currentName,
        email: '',
        notifications: {
            transactions: true,
            balanceUpdates: true,
            adminMessages: true
        }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const handleInputChange = (field: keyof Omit<SettingsFormState, 'notifications'>, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
        if (saveStatus === 'saved') setSaveStatus('idle')
    }

    const handleNotificationChange = (field: keyof SettingsFormState['notifications'], value: boolean) => {
        setFormState(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [field]: value }
        }))
        if (saveStatus === 'saved') setSaveStatus('idle')
    }

    const handleSave = async () => {
        setSaveStatus('saving')
        setIsLoading(true)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))
            
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
        setFormState({
            displayName: currentName,
            email: '',
            notifications: {
                transactions: true,
                balanceUpdates: true,
                adminMessages: true
            }
        })
        setSaveStatus('idle')
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Display Name"
                            value={formState.displayName}
                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                            placeholder="Enter your display name"
                            disabled={isLoading}
                        />
                        
                        <Input
                            label="Email (Optional)"
                            type="email"
                            value={formState.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="your.email@example.com"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Wallet Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Member Address:</span>
                                <span className="font-mono text-gray-800">{memberAddress}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Organization:</span>
                                <span className="text-gray-800">{organizationName}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718l8.485-8.485M4.868 19.718L1.5 16.35l2.829-2.829m0 6.197l2.828-2.828M15 11V5a4 4 0 00-8 0v6l-2 2v3h12v-3l-2-2z" />
                        </svg>
                        Notification Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Transaction Notifications</h4>
                                <p className="text-sm text-gray-600">Get notified when transactions are processed</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formState.notifications.transactions}
                                    onChange={(e) => handleNotificationChange('transactions', e.target.checked)}
                                    className="sr-only peer"
                                    disabled={isLoading}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Balance Updates</h4>
                                <p className="text-sm text-gray-600">Get notified when your balance changes</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formState.notifications.balanceUpdates}
                                    onChange={(e) => handleNotificationChange('balanceUpdates', e.target.checked)}
                                    className="sr-only peer"
                                    disabled={isLoading}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Admin Messages</h4>
                                <p className="text-sm text-gray-600">Get notified of important messages from wallet admin</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formState.notifications.adminMessages}
                                    onChange={(e) => handleNotificationChange('adminMessages', e.target.checked)}
                                    className="sr-only peer"
                                    disabled={isLoading}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Security & Privacy
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                                <h4 className="font-medium text-yellow-800">Security Notice</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Your wallet security is managed through your connected Stacks wallet. 
                                    Always keep your private keys secure and never share them with anyone.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" disabled>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Change Password (Managed by Wallet)
                        </Button>

                        <Button variant="outline" className="w-full justify-start" disabled>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Two-Factor Authentication (Coming Soon)
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                    Reset
                </Button>
            </div>
        </div>
    )
}