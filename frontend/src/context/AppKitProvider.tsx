import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { wagmiAdapter } from '../config/wagmi'
import { queryClient } from '../config/appkit'
import { WalletProvider } from './WalletContext'

// Initialize AppKit logic purely for side effects
import '../init'

interface Props {
    children: ReactNode
}

export function AppKitProvider({ children }: Props) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <WalletProvider>
                    {children}
                </WalletProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default AppKitProvider
