import { mainnet, arbitrum, sepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Define supported EVM networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, sepolia]
