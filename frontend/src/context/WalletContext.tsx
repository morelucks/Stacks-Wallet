import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { isStacksWalletConnected, getStacksUserData } from '../config/stacks'

interface StacksWalletData {
    isConnected: boolean
    address?: string
    userData?: any
}

interface WalletContextType {
    // EVM Wallet (via AppKit)
    evmWallet: {
        isConnected: boolean
        address?: string
    }
    
    // Stacks Wallet
    stacksWallet: StacksWalletData
    
    // Combined status
    isAnyWalletConnected: boolean
    isBothWalletsConnected: boolean
    
    // Actions
    refreshWalletStatus: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
    children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
    const { isConnected: evmConnected, address: evmAddress } = useAppKitAccount()
    const [stacksWallet, setStacksWallet] = useState<StacksWalletData>({ isConnected: false })

    const refreshWalletStatus = () => {
        const stacksConnected = isStacksWalletConnected()
        if (stacksConnected) {
            const userData = getStacksUserData()
            setStacksWallet({
                isConnected: true,
                address: userData?.profile?.stxAddress?.testnet,
                userData
            })
        } else {
            setStacksWallet({ isConnected: false })
        }
    }

    useEffect(() => {
        refreshWalletStatus()
        
        // Listen for wallet connection changes
        const handleFocus = () => refreshWalletStatus()
        const handleStorage = () => refreshWalletStatus()
        
        window.addEventListener('focus', handleFocus)
        window.addEventListener('storage', handleStorage)
        
        return () => {
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('storage', handleStorage)
        }
    }, [])

    const contextValue: WalletContextType = {
        evmWallet: {
            isConnected: evmConnected,
            address: evmAddress
        },
        stacksWallet,
        isAnyWalletConnected: evmConnected || stacksWallet.isConnected,
        isBothWalletsConnected: evmConnected && stacksWallet.isConnected,
        refreshWalletStatus
    }

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const context = useContext(WalletContext)
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider')
    }
    return context
}
