import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { PlatformWallet, GlobalMember, BulkOperationResult } from '../../services/platformAdminService'

interface BulkOperationsPanelProps {
  selectedWallets?: PlatformWallet[]
  selectedMembers?: GlobalMember[]
  onOperationComplete?: (results: BulkOperationResult[]) => void
  className?: string
}

type BulkOperationType = 
  | 'freeze-members' 
  | 'unfreeze-members' 
  | 'deactivate-wallets' 
  | 'send-notifications' 
  | 'export-data'
  | 'update-status'

interface BulkOperation {
  id: BulkOperationType
  label: string
  description: string
  icon: string
  requiresConfirmation: boolean
  appliesToWallets: boolean
  appliesToMembers: boolean
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'freeze-members',
    label: 'Freeze Members',
    description: 'Temporarily suspend selected members from all activities',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    requiresConfirmation: true,
    appliesToWallets: false,
    appliesToMembers: true
  },
  {
    id: 'unfreeze-members',
    label: 'Unfreeze Members',
    description: 'Restore access for selected frozen members',
    icon: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
    requiresConfirmation: true,
    appliesToWallets: false,
    appliesToMembers: true
  },
  {
    id: 'send-notifications',
    label: 'Send Notifications',
    description: 'Send platform notifications to selected wallet admins or members',
    icon: 'M15 17h5l-5 5v-5z M4 19.5A2.5 2.5 0 016.5 17H20',
    requiresConfirmation: false,
    appliesToWallets: true,
    appliesToMembers: true
  },
  {
    id: 'export-data',
    label: 'Export Data',
    description: 'Export detailed information for selected items',
    icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    requiresConfirmation: false,
    appliesToWallets: true,
    appliesToMembers: true
  },
  {
    id: 'update-status',
    label: 'Update Status',
    description: 'Batch update status for selected items',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    requiresConfirmation: true,
    appliesToWallets: true,
    appliesToMembers: true
  }
]

export function BulkOperationsPanel({ 
  selectedWallets = [], 
  selectedMembers = [], 
  onOperationComplete,
  className = '' 
}: BulkOperationsPanelProps) {
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<BulkOperationType | null>(null)
  const [operationProgress, setOperationProgress] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState<BulkOperationType | null>(null)
  const [notificationMessage, setNotificationMessage] = useState('')

  const totalSelectedItems = selectedWallets.length + selectedMembers.length

  const getAvailableOperations = (): BulkOperation[] => {
    return BULK_OPERATIONS.filter(op => {
      if (selectedWallets.length > 0 && selectedMembers.length > 0) {
        return op.appliesToWallets && op.appliesToMembers
      }
      if (selectedWallets.length > 0) {
        return op.appliesToWallets
      }
      if (selectedMembers.length > 0) {
        return op.appliesToMembers
      }
      return false
    })
  }

  const simulateOperation = async (operationType: BulkOperationType): Promise<BulkOperationResult[]> => {
    const results: BulkOperationResult[] = []
    const allItems = [
      ...selectedWallets.map(w => ({ id: w.adminAddress, type: 'wallet' as const })),
      ...selectedMembers.map(m => ({ id: m.memberAddress, type: 'member' as const }))
    ]

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i]
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Simulate some failures (10% failure rate)
      const success = Math.random() > 0.1
      
      results.push({
        itemId: item.id,
        success,
        error: success ? undefined : `Failed to ${operationType.replace('-', ' ')} ${item.type}`
      })
      
      setOperationProgress(((i + 1) / allItems.length) * 100)
    }

    return results
  }

  const executeOperation = async (operationType: BulkOperationType) => {
    if (operationType === 'send-notifications' && !notificationMessage.trim()) {
      alert('Please enter a notification message')
      return
    }

    setIsOperationInProgress(true)
    setCurrentOperation(operationType)
    setOperationProgress(0)

    try {
      const results = await simulateOperation(operationType)
      onOperationComplete?.(results)
      
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      alert(`Operation completed: ${successCount} successful, ${failureCount} failed`)
    } catch (error) {
      console.error('Bulk operation failed:', error)
      alert('Operation failed. Please try again.')
    } finally {
      setIsOperationInProgress(false)
      setCurrentOperation(null)
      setOperationProgress(0)
      setShowConfirmation(null)
      setNotificationMessage('')
    }
  }

  const handleOperationClick = (operation: BulkOperation) => {
    if (operation.requiresConfirmation) {
      setShowConfirmation(operation.id)
    } else {
      executeOperation(operation.id)
    }
  }

  if (totalSelectedItems === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Selected</h3>
            <p className="text-gray-600">
              Select wallets or members to perform bulk operations
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Bulk Operations ({totalSelectedItems} items selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selection Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Selected Items:</h4>
            <div className="flex gap-4 text-sm">
              {selectedWallets.length > 0 && (
                <span className="text-blue-700">
                  {selectedWallets.length} wallet{selectedWallets.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedMembers.length > 0 && (
                <span className="text-blue-700">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Operation Progress */}
          {isOperationInProgress && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <svg className="animate-spin w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-semibold text-yellow-900">
                  Processing {currentOperation?.replace('-', ' ')}...
                </span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${operationProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                {Math.round(operationProgress)}% complete
              </p>
            </div>
          )}

          {/* Available Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getAvailableOperations().map((operation) => (
              <Card 
                key={operation.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => !isOperationInProgress && handleOperationClick(operation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={operation.icon} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{operation.label}</h4>
                      <p className="text-sm text-gray-600">{operation.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Bulk Operation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to perform "{BULK_OPERATIONS.find(op => op.id === showConfirmation)?.label}" 
                on {totalSelectedItems} selected item{totalSelectedItems !== 1 ? 's' : ''}?
              </p>
              
              {showConfirmation === 'send-notifications' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Message:
                  </label>
                  <textarea
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    rows={3}
                    placeholder="Enter your notification message..."
                  />
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={() => executeOperation(showConfirmation)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(null)}
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