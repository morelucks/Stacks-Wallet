
// Enhanced Stacks network configuration with wallet connection support
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { AppConfig, UserSession, showConnect } from '@stacks/connect'

// Stacks network configurations
export const stacksNetworks = {
    testnet: new StacksTestnet(),
    mainnet: new StacksMainnet(),
}

export const activeStacksNetwork = import.meta.env.PROD ? stacksNetworks.mainnet : stacksNetworks.testnet

// App configuration for Stacks Connect
export const appConfig = new AppConfig(['store_write', 'publish_data'])
export const userSession = new UserSession({ appConfig })

// Stacks wallet connection options
export const connectOptions = {
    appDetails: {
        name: 'WalletX',
        icon: '/icon.png',
    },
    redirectTo: '/',
    onFinish: () => {
        console.log('Stacks wallet connected successfully')
        window.location.reload()
    },
    userSession,
}

// Helper functions for Stacks wallet management
export const connectStacksWallet = () => {
    showConnect(connectOptions)
}

export const disconnectStacksWallet = () => {
    userSession.signUserOut()
    window.location.reload()
}

export const isStacksWalletConnected = () => {
    return userSession.isUserSignedIn()
}

export const getStacksUserData = () => {
    if (userSession.isUserSignedIn()) {
        return userSession.loadUserData()
    }
    return null
}

export const getStxBalance = async (address: string) => {
    const response = await fetch(`${activeStacksNetwork.coreApiUrl}/extended/v1/address/${address}/balances`);
    return response.json();
}
export const getSIP10Balances = async (address: string) => {
    // Placeholder for SIP-10 token fetching
    return []
}
export const signTransaction = async (tx: any) => {
    // Signing logic placeholder
}
export const getSIP10Balances = async (address: string) => {
    // Placeholder for SIP-10 token fetching
    return []
}
