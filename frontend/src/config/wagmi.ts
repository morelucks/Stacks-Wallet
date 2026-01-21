
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { networks } from './networks'

// 1. Get projectId from environment
export const projectId = import.meta.env.VITE_PROJECT_ID

if (!projectId) {
    console.warn('Project ID is missing - AppKit might not function correctly')
}

// 2. Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks
})
// Placeholder for ERC-20 token support helpers
export const getERC20Balance = () => {}
// Placeholder for ERC-20 token support helpers
export const getERC20Balance = () => {}
