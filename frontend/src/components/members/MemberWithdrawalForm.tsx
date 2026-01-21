import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { validateMemberAddress } from '../../services/walletService'

interface MemberWithdrawalFormProps {
    memberAddress: string
    availableBalance: number
    onWithdrawalSubmitted?: (amount: number, receiver: string) => void
    onError?: (error: string) => void
    className?: string
}

interface WithdrawalFormState {
    amount: string
    receiverAddress: string
}

interface FormErrors {
    amount?: string
    receiverAddress?: string
    general?: string
}

interface TransactionState {
    status: 'idle' | 'pending' | 'success' | 'error'
    txId?: string
    error?: string
}

export function MemberWithdrawalForm({ 
    memberAddress, 
    availableBalance, 
    onWithdrawalSubmitted, 
    onError,
    className = '' 
}: MemberWithdrawalFormProps) {
    const [formState, setFormState] = useState<WithdrawalFormState>({
        amount: '',
        receiverAddress: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [transactionState, setTransactionState] = useState<TransactionState>({ status: 'idle' })

    const formatSTX = (amount: number) => {
        return (amount / 1000000).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
        })
    }

    const validateAmount = (amount: string): string | null => {
        if (!amount.trim()) {
            return 'Amount is required'
        }
        
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount)) {
            return 'Please enter a valid number'
        }
        
        if (numAmount <= 0) {
            return 'Amount must be greater than 0'
        }
        
        const availableSTX = availableBalance / 1000000
        if (numAmount > availableSTX) {
            return `Amount cannot exceed available balance of ${formatSTX(availableBalance)} STX`
        }
        
        return null
    }

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        const amountError = validateAmount(formState.amount)
        if (amountError) newErrors.amount = amountError

        const addressError = validateMemberAddress(formState.receiverAddress)
        if (addressError) newErrors.receiverAddress = addressError

        // Check if trying to send to self
        if (formState.receiverAddress === memberAddress) {
            newErrors.receiverAddress = 'Cannot send funds to your own address'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof WithdrawalFormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const resetForm = () => {
        setFormState({
            amount: '',
            receiverAddress: ''
        })
        setErrors({})
        setTransactionState({ status: 'idle' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setTransactionState({ status: 'pending' })

        try {
            // Simulate API call - in real implementation, this would call WalletService.memberWithdrawal
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Mock success response
            const mockTxId = '0x' + Math.random().toString(16).substr(2, 16)
            
            setTransactionState({ 
                status: 'success', 
                txId: mockTxId 
            })
            
            onWithdrawalSubmitted?.(parseFloat(formState.amount), formState.receiverAddress)
            resetForm()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed'
            setTransactionState({ 
                status: 'error', 
                error: errorMessage 
            })
            onError?.(errorMessage)
        }
    }

    const setMaxAmount = () => {
        const maxSTX = availableBalance / 1000000
        setFormState(prev => ({ ...prev, amount: maxSTX.toString() }))
        if (errors.amount) {
            setErrors(prev => ({ ...prev, amount: undefined }))
        }
    }

    const isFormDisabled = transactionState.status === 'pending'

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Make Withdrawal
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Available Balance Display */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">Available Balance</p>
                            <p className="text-2xl font-bold text-blue-900">{formatSTX(availableBalance)} STX</p>
                        </div>
                        <div className="text-blue-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Amount Input */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Amount (STX)</label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={setMaxAmount}
                                disabled={isFormDisabled}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Use Max
                            </Button>
                        </div>
                        <Input
                            type="number"
                            step="0.000001"
                            placeholder="0.000000"
                            value={formState.amount}
                            onChange={(e) => handleInputChange('amount', e.target.value)}
                            error={errors.amount}
                            disabled={isFormDisabled}
                        />
                    </div>

                    {/* Receiver Address Input */}
                    <Input
                        label="Receiver Address"
                        placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                        value={formState.receiverAddress}
                        onChange={(e) => handleInputChange('receiverAddress', e.target.value)}
                        error={errors.receiverAddress}
                        disabled={isFormDisabled}
                    />

                    {/* Transaction Status Messages */}
                    {transactionState.status === 'success' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-green-800 font-medium">Withdrawal submitted successfully!</p>
                            </div>
                            {transactionState.txId && (
                                <p className="text-green-700 text-sm mt-1">
                                    Transaction ID: {transactionState.txId}
                                </p>
                            )}
                        </div>
                    )}

                    {transactionState.status === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-red-800 font-medium">Withdrawal failed</p>
                                    <p className="text-red-700 text-sm mt-1">
                                        {transactionState.error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {errors.general && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-800">{errors.general}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="submit"
                            disabled={isFormDisabled || availableBalance === 0}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                            {transactionState.status === 'pending' ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Submit Withdrawal
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={isFormDisabled}
                        >
                            Clear
                        </Button>
                    </div>

                    {/* Warning Message */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start">
                            <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-yellow-800 text-sm">
                                <strong>Important:</strong> Withdrawals are final and cannot be reversed. Please double-check the receiver address before submitting.
                            </p>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}