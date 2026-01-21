
import { createAppKit } from '@reown/appkit/react'
import { wagmiAdapter, projectId } from './wagmi'
import { networks } from './networks'
import { QueryClient } from '@tanstack/react-query'

// 1. Setup QueryClient
export const queryClient = new QueryClient()

// 2. Create AppKit instance
export function initializeAppKit() {
    createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata: {
            name: 'Stacks-Wallet',
            description: 'Secure multi-signature wallet for the Stacks ecosystem',
            url: 'https://walletx.app',
            icons: ['https://walletx.app/icon.png']
        },
        features: {
            email: true,
            socials: ['google', 'x', 'github', 'discord', 'apple', 'farcaster'],
            emailShowWallets: true,
            analytics: true,
            onramp: true /* Enabled */ /* Enabled */,
            swaps: true /* Swaps Active */,
        },
        themeMode: 'system',
        themeVariables: {
            '--w3m-color-mix': '#FF6B35',
            '--w3m-color-mix-strength': 20,
            '--w3m-accent': '#FF6B35',
            '--w3m-border-radius-master': '8px'
        }
    })
}
// Exporting theme variables for custom usage
export const appKitTheme = {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#FF6B35'
}
// Exporting theme variables for custom usage
export const appKitTheme = {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#FF6B35'
}
