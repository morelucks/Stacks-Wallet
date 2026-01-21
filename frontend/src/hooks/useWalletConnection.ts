import { useAppKitAccount } from '@reown/appkit/react'
import { isStacksWalletConnected, getStacksUserData } from '../config/stacks'
import { useState, useEffect } from 'react'

export function useWalletConnection() {
    const { isConnected: isEvmConnected, address: evmAddress } = useAppKitAccount()
    const [isStacksConnected, setIsStacksConnected] = useState(false)
    const [stacksAddress, setStacksAddress] = useState<string | null>(null)

    useEffect(() => {
        const check = () => {
            const connected = isStacksWalletConnected()
            setIsStacksConnected(connected)
            if (connected) {
                setStacksAddress(getStacksUserData()?.profile?.stxAddress?.testnet || null)
            }
        }
        check()
        window.addEventListener('focus', check)
        return () => window.removeEventListener('focus', check)
    }, [])

    return { isEvmConnected, evmAddress, isStacksConnected, stacksAddress, isAnyConnected: isEvmConnected || isStacksConnected }
}
