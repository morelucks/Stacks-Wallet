import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { useEffect, useState } from 'react'
import { isStacksWalletConnected, getStacksUserData } from '../config/stacks'

interface WalletInfo {
    isConnected: boolean
    address?: string
    network?: string
    balance?: string
}

export function WalletStatus() {
    const { isConnected: evmConnected, address: evmAddress } = useAppKitAccount()
    const { caipNetwork } = useAppKitNetwork()
    const [stacksWallet, setStacksWallet] = useState<WalletInfo>({ isConnected: false })

    useEffect(() => {
        const checkStacksWallet = () => {
            const connected = isStacksWalletConnected()
            if (connected) {
                const userData = getStacksUserData()
                setStacksWallet({
                    isConnected: true,
                    address: userData?.profile?.stxAddress?.testnet,
                    network: 'Stacks Testnet'
                })
            } else {
                setStacksWallet({ isConnected: false })
            }
        }

        checkStacksWallet()
        window.addEventListener('focus', checkStacksWallet)
        
        return () => window.removeEventListener('focus', checkStacksWallet)
    }, [])

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 8)}...${addr.slice(-6)}`
    }

    if (!evmConnected && !stacksWallet.isConnected) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-800 font-medium">No wallets connected</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                    Connect your Ethereum and Stacks wallets to access WalletX features
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* EVM Wallet Status */}
            {evmConnected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-green-800">Ethereum Wallet</span>
                        </div>
                        <span className="text-sm text-green-600">{caipNetwork?.name || 'Connected'}</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1 font-mono">
                        {evmAddress ? formatAddress(evmAddress) : 'Connected'}
                    </p>
                </div>
            )}

            {/* Stacks Wallet Status */}
            {stacksWallet.isConnected && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="font-medium text-orange-800">Stacks Wallet</span>
                        </div>
                        <span className="text-sm text-orange-600">{stacksWallet.network}</span>
                    </div>
                    <p className="text-orange-700 text-sm mt-1 font-mono">
                        {stacksWallet.address ? formatAddress(stacksWallet.address) : 'Connected'}
                    </p>
                </div>
            )}

            {/* Connection Status Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Multi-Wallet Status:</span>
                    <span className={`font-medium ${
                        evmConnected && stacksWallet.isConnected 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                    }`}>
                        {evmConnected && stacksWallet.isConnected 
                            ? 'Fully Connected' 
                            : 'Partially Connected'
                        }
                    </span>
                </div>
            </div>
        </div>
    )
}
