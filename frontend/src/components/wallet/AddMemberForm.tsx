import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { 
    validateMemberAddress, 
    validateMemberName, 
    validateSpendLimit, 
    validateMemberIdentifier,
    WalletService,
    AddMemberParams,
    MemberInfo
} from '../../services/walletService'

interface AddMemberFormProps {
    walletAddress: string
    walletBalance: number
    existingMembers: MemberInfo[]
    onMemberAdded?: (member: AddMemberParams) => void
    onError?: (error: string) => void
}

interface FormState {
    memberAddress: string
    memberName: string
    spendLimit: string
    memberIdentifier: string
}

interface FormErrors {
    memberAddress?: string
    memberName?: string
    spendLimit?: string
    memberIdentifier?: string
    general?: string
}

interface TransactionState {
    status: 'idle' | 'pending' | 'success' | 'error'
    txId?: string
    error?: string
}

export function AddMemberForm({ 
    walletAddress, 
    walletBalance, 
    existingMembers, 
    onMemberAdded, 
    onError 
}: AddMemberFormProps) {
    const [formState, setFormState] = useState<FormState>({
        memberAddress: '',
        memberName: '',
        spendLimit: '',
        memberIdentifier: ''
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [transactionState, setTransactionState] = useState<TransactionState>({ status: 'idle' })

    const existingIds = existingMembers.map(m => m.memberIdentifier)

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        const addressError = validateMemberAddress(formState.memberAddress)
        if (addressError) newErrors.memberAddress = addressError

        const nameError = validateMemberName(formState.memberName)
        if (nameError) newErrors.memberName = nameError

        const spendLimitError = validateSpendLimit(formState.spendLimit, walletBalance)
        if (spendLimitError) newErrors.spendLimit = spendLimitError

        const identifierError = validateMemberIdentifier(formState.memberIdentifier, existingIds)
        if (identifierError) newErrors.memberIdentifier = identifierError

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof FormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const resetForm = () => {
        setFormState({
            memberAddress: '',
            memberName: '',
            spendLimit: '',
            memberIdentifier: ''
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
            const memberParams: AddMemberParams = {
                memberAddress: formState.memberAddress,
                memberName: formState.memberName,
                spendLimit: parseFloat(formState.spendLimit),
                memberIdentifier: parseInt(formState.memberIdentifier)
            }

            const result = await WalletService.addMember(memberParams)

            if (result.success) {
                setTransactionState({ 
                    status: 'success', 
                    txId: result.txId 
                })
                onMemberAdded?.(memberParams)
                resetForm()
            } else {
                const errorMessage = result.error || 'Failed to add member'
                setTransactionState({ 
                    status: 'error', 
                    error: errorMessage 
                })
                onError?.(errorMessage)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            setTransactionState({ 
                status: 'error', 
                error: errorMessage 
            })
            onError?.(errorMessage)
        }
    }

    const isFormDisabled = transactionState.status === 'pending'

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Add New Member</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Member Address"
                            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                            value={formState.memberAddress}
                            onChange={(e) => handleInputChange('memberAddress', e.target.value)}
                            error={errors.memberAddress}
                            disabled={isFormDisabled}
                        />

                        <Input
                            label="Member Name"
                            placeholder="John Doe"
                            value={formState.memberName}
                            onChange={(e) => handleInputChange('memberName', e.target.value)}
                            error={errors.memberName}
                            disabled={isFormDisabled}
                        />

                        <Input
                            label="Spend Limit (STX)"
                            type="number"
                            step="0.000001"
                            placeholder="100.0"
                            value={formState.spendLimit}
                            onChange={(e) => handleInputChange('spendLimit', e.target.value)}
                            error={errors.spendLimit}
                            disabled={isFormDisabled}
                        />

                        <Input
                            label="Member Identifier"
                            type="number"
                            placeholder="1"
                            value={formState.memberIdentifier}
                            onChange={(e) => handleInputChange('memberIdentifier', e.target.value)}
                            error={errors.memberIdentifier}
                            disabled={isFormDisabled}
                        />
                    </div>

                    {/* Transaction Status Messages */}
                    {transactionState.status === 'success' && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-green-800 font-medium">Member added successfully!</p>
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
                                    <p className="text-red-800 font-medium">Failed to add member</p>
                                    <p className="text-red-700 text-sm mt-1">
                                        {transactionState.error}
                                    </p>
                                    <p className="text-red-600 text-xs mt-2">
                                        If this problem persists, please check your wallet connection and try again.
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

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={isFormDisabled}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                        >
                            {transactionState.status === 'pending' ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding Member...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Member
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            disabled={isFormDisabled}
                        >
                            Clear Form
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}