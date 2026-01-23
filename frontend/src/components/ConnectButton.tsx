import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useState } from 'react'
import { connectStacksWallet, isStacksWalletConnected, getStacksUserData, disconnectStacksWallet } from '../config/stacks'

export function ConnectButton() {
    const { open } = useAppKit()
    const { isConnected, address } = useAppKitAccount()
    const [stacksConnected, setStacksConnected] = useState(false)
    const [stacksAddress, setStacksAddress] = useState<string | null>(null)

    useEffect(() => {
        const checkStacksConnection = () => {
            const connected = isStacksWalletConnected()
            setStacksConnected(connected)
            
            if (connected) {
                const userData = getStacksUserData()
                setStacksAddress(userData?.profile?.stxAddress?.testnet || null)
            }
        }

        checkStacksConnection()
        window.addEventListener('focus', checkStacksConnection)
        return () => window.removeEventListener('focus', checkStacksConnection)
    }, [])

    const handleStacksConnect = () => connectStacksWallet()
    const handleStacksDisconnect = () => disconnectStacksWallet()

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">EVM Wallet</label>
                {isConnected ? (
                    <button
                        onClick={() => open()}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all text-sm font-medium shadow-sm"
                    >
                        {formatAddress(address || '')}
                    </button>
                ) : (
                    <button
                        onClick={() => open()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                    >
                        Connect EVM
                    </button>
                )}
            </div>

            <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Stacks Wallet</label>
                {stacksConnected ? (
                    <button
                        onClick={handleStacksDisconnect}
                        className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 hover:bg-orange-100 transition-all text-sm font-medium shadow-sm"
                    >
                        {stacksAddress ? formatAddress(stacksAddress) : 'Connected'}
                    </button>
                ) : (
                    <button
                        onClick={handleStacksConnect}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                    >
                        Connect Stacks
                    </button>
                )}
            </div>
        </div>
    )
}
