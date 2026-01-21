import { 
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    stringUtf8CV,
    uintCV,
    contractPrincipalCV,
    principalCV
} from '@stacks/transactions'
import { activeStacksNetwork, userSession } from '../config/stacks'

export interface CreateWalletParams {
    walletName: string
    fundAmount: number
    tokenContract?: string
}

export interface WalletCreationResult {
    success: boolean
    txId?: string
    error?: string
}

export interface AddMemberParams {
    memberAddress: string
    memberName: string
    spendLimit: number
    memberIdentifier: number
}

export interface MemberInfo {
    memberAddress: string
    adminAddress: string
    organizationName: string
    name: string
    active: boolean
    frozen: boolean
    spendLimit: number
    memberIdentifier: number
    role: string
}

export class WalletService {
    private static readonly CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // Replace with actual deployed contract address
    private static readonly CONTRACT_NAME = 'wallet-x'

    static async createWallet(params: CreateWalletParams): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()
            const senderAddress = userData.profile.stxAddress.testnet

            // Convert fund amount to microSTX (1 STX = 1,000,000 microSTX)
            const fundAmountMicroSTX = Math.floor(params.fundAmount * 1000000)

            // Default to a token contract (you might want to make this configurable)
            const tokenContract = params.tokenContract || `${this.CONTRACT_ADDRESS}.token-contract`

            const functionArgs = [
                stringUtf8CV(params.walletName),
                uintCV(fundAmountMicroSTX),
                contractPrincipalCV(this.CONTRACT_ADDRESS, 'token-contract')
            ]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'register-wallet',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error creating wallet:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async getWalletInfo(adminAddress: string) {
        try {
            // This would typically be a read-only contract call
            // For now, we'll return mock data
            return {
                walletName: 'Sample Wallet',
                balance: 1000000, // in microSTX
                active: true,
                walletId: 1
            }
        } catch (error) {
            console.error('Error fetching wallet info:', error)
            return null
        }
    }

    static formatSTXAmount(microSTX: number): string {
        return (microSTX / 1000000).toFixed(6)
    }

    static parseSTXAmount(stxAmount: string): number {
        return Math.floor(parseFloat(stxAmount) * 1000000)
    }

    static async addMember(params: AddMemberParams): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()
            
            // Convert spend limit to microSTX
            const spendLimitMicroSTX = Math.floor(params.spendLimit * 1000000)

            const functionArgs = [
                principalCV(params.memberAddress),
                stringUtf8CV(params.memberName),
                uintCV(spendLimitMicroSTX),
                uintCV(params.memberIdentifier)
            ]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'onboard-member',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error adding member:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async getWalletMembers(adminAddress: string): Promise<MemberInfo[]> {
        try {
            // This would typically be a read-only contract call
            // For now, we'll return mock data
            return [
                {
                    memberAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
                    adminAddress: adminAddress,
                    organizationName: 'Sample Wallet',
                    name: 'John Doe',
                    active: true,
                    frozen: false,
                    spendLimit: 100000000, // 100 STX in microSTX
                    memberIdentifier: 1,
                    role: 'member'
                }
            ]
        } catch (error) {
            console.error('Error fetching wallet members:', error)
            return []
        }
    }

    static async memberWithdrawal(amount: number, receiver: string): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()
            
            // Convert amount to microSTX
            const amountMicroSTX = Math.floor(amount * 1000000)

            const functionArgs = [
                uintCV(amountMicroSTX),
                principalCV(receiver),
                contractPrincipalCV(this.CONTRACT_ADDRESS, 'token-contract')
            ]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'member-withdrawal',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async getMemberInfo(memberAddress: string): Promise<MemberInfo | null> {
        try {
            // This would typically be a read-only contract call
            // For now, we'll return mock data
            return {
                memberAddress: memberAddress,
                adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                organizationName: 'Tech Startup Wallet',
                name: 'John Doe',
                active: true,
                frozen: false,
                spendLimit: 50000000, // 50 STX in microSTX
                memberIdentifier: 1,
                role: 'member'
            }
        } catch (error) {
            console.error('Error fetching member info:', error)
            return null
        }
    }

    static async getMemberTransactions(memberAddress: string): Promise<any[]> {
        try {
            // This would typically be a read-only contract call
            // For now, we'll return mock data
            return [
                {
                    amount: 5000000, // 5 STX
                    receiver: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
                },
                {
                    amount: 2500000, // 2.5 STX
                    receiver: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ'
                }
            ]
        } catch (error) {
            console.error('Error fetching member transactions:', error)
            return []
        }
    }

    // Admin-specific functions
    static async freezeMember(memberAddress: string): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()

            const functionArgs = [principalCV(memberAddress)]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'freeze-member',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error freezing member:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async unfreezeMember(memberAddress: string): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()

            const functionArgs = [principalCV(memberAddress)]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'unfreeze-member',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error unfreezing member:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async removeMember(memberAddress: string): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()

            const functionArgs = [principalCV(memberAddress)]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'remove-member',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error removing member:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async reimburseMember(memberIdentifier: number, amount: number): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()
            
            // Convert amount to microSTX
            const amountMicroSTX = Math.floor(amount * 1000000)

            const functionArgs = [
                uintCV(memberIdentifier),
                uintCV(amountMicroSTX)
            ]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'reimburse-member',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error reimbursing member:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    static async reimburseWallet(amount: number): Promise<WalletCreationResult> {
        try {
            if (!userSession.isUserSignedIn()) {
                throw new Error('User not signed in')
            }

            const userData = userSession.loadUserData()
            
            // Convert amount to microSTX
            const amountMicroSTX = Math.floor(amount * 1000000)

            const functionArgs = [
                uintCV(amountMicroSTX),
                contractPrincipalCV(this.CONTRACT_ADDRESS, 'token-contract')
            ]

            const txOptions = {
                contractAddress: this.CONTRACT_ADDRESS,
                contractName: this.CONTRACT_NAME,
                functionName: 'reimburse-wallet',
                functionArgs,
                senderKey: userData.appPrivateKey,
                validateWithAbi: false,
                network: activeStacksNetwork,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            }

            const transaction = await makeContractCall(txOptions)
            const broadcastResponse = await broadcastTransaction(transaction, activeStacksNetwork)

            if (broadcastResponse.error) {
                throw new Error(broadcastResponse.error)
            }

            return {
                success: true,
                txId: broadcastResponse.txid
            }
        } catch (error) {
            console.error('Error reimbursing wallet:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }
}

// Validation utilities
export const validateWalletName = (name: string): string | null => {
    if (!name.trim()) {
        return 'Wallet name is required'
    }
    if (name.length < 3) {
        return 'Wallet name must be at least 3 characters'
    }
    if (name.length > 50) {
        return 'Wallet name must be less than 50 characters'
    }
    return null
}

export const validateFundingAmount = (amount: string): string | null => {
    if (!amount.trim()) {
        return 'Funding amount is required'
    }
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) {
        return 'Please enter a valid number'
    }
    
    if (numAmount <= 0) {
        return 'Amount must be greater than 0'
    }
    
    if (numAmount > 1000000) {
        return 'Amount cannot exceed 1,000,000 STX'
    }
    
    return null
}

// Member validation utilities
export const validateMemberAddress = (address: string): string | null => {
    if (!address.trim()) {
        return 'Member address is required'
    }
    
    // Basic Stacks address validation (starts with ST or SP)
    const stacksAddressRegex = /^S[TP][0-9A-Z]{39}$/
    if (!stacksAddressRegex.test(address)) {
        return 'Please enter a valid Stacks address (e.g., ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)'
    }
    
    return null
}

export const validateMemberName = (name: string): string | null => {
    if (!name.trim()) {
        return 'Member name is required'
    }
    
    if (name.length < 2) {
        return 'Member name must be at least 2 characters'
    }
    
    if (name.length > 50) {
        return 'Member name must be less than 50 characters'
    }
    
    // Allow letters, numbers, spaces, hyphens, and underscores
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/
    if (!nameRegex.test(name)) {
        return 'Member name can only contain letters, numbers, spaces, hyphens, and underscores'
    }
    
    return null
}

export const validateSpendLimit = (amount: string, walletBalance: number): string | null => {
    if (!amount.trim()) {
        return 'Spend limit is required'
    }
    
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) {
        return 'Please enter a valid number'
    }
    
    if (numAmount <= 0) {
        return 'Spend limit must be greater than 0'
    }
    
    const walletBalanceSTX = walletBalance / 1000000
    if (numAmount > walletBalanceSTX) {
        return `Spend limit cannot exceed wallet balance of ${walletBalanceSTX.toFixed(6)} STX`
    }
    
    return null
}

export const validateMemberIdentifier = (identifier: string, existingIds: number[]): string | null => {
    if (!identifier.trim()) {
        return 'Member identifier is required'
    }
    
    const numId = parseInt(identifier)
    if (isNaN(numId)) {
        return 'Member identifier must be a number'
    }
    
    if (numId <= 0) {
        return 'Member identifier must be a positive number'
    }
    
    if (existingIds.includes(numId)) {
        return 'This member identifier is already in use'
    }
    
    return null
}