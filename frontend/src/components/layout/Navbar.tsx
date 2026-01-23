
import { Link } from 'react-router-dom'
import { ConnectButton } from '../ConnectButton'
import { useWalletConnection } from '../../hooks/useWalletConnection'
import { useWallet } from '../../context/WalletContext'
import { Button } from '../ui/Button'

export default function Navbar() {
    const { isAnyWalletConnected, isBothWalletsConnected } = useWalletConnection()
    const { stacksWallet } = useWallet()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex transition-all duration-300 h-16 items-center justify-between px-4">
                <div className="flex transition-all duration-300 items-center gap-6">
                    <Link to="/" className="flex transition-all duration-300 items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-600 rounded-lg flex transition-all duration-300 items-center justify-center">
                            <span className="text-white font-bold text-sm">W</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                            WalletX
                        </span>
                    </Link>
                    
                    {/* Navigation Links */}
                    <nav className="hidden md:flex transition-all duration-300 items-center gap-6">
                        <Link 
                            to="/" 
                            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                        >
                            Home
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                        >
                            Dashboard
                        </Link>
                        {stacksWallet.isConnected && (
                            <>
                                <Link 
                                    to="/admin" 
                                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Wallet Admin
                                </Link>
                                <Link 
                                    to="/platform-admin" 
                                    className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Platform Admin
                                </Link>
                            </>
                        )}
                        {isBothWalletsConnected && (
                            <Link 
                                to="/create-wallet" 
                                className="text-orange-600 hover:text-orange-700 transition-colors font-medium flex transition-all duration-300 items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Wallet
                            </Link>
                        )}
                        <a 
                            href="#features" 
                            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                        >
                            Features
                        </a>
                        <a 
                            href="#how-it-works" 
                            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                        >
                            How it Works
                        </a>
                    </nav>
                </div>
                
                <div className="flex transition-all duration-300 items-center gap-4">
                    {/* Create Wallet Button */}
                    {isBothWalletsConnected && (
                        <Link to="/create-wallet">
                            <Button 
                                size="sm" 
                                className="hidden sm:flex transition-all duration-300 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Wallet
                            </Button>
                        </Link>
                    )}

                    {/* Connection Status Indicator */}
                    {isAnyWalletConnected && (
                        <div className="hidden sm:flex transition-all duration-300 items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                isBothWalletsConnected ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm text-gray-600">
                                {isBothWalletsConnected ? 'Fully Connected' : 'Partially Connected'}
                            </span>
                        </div>
                    )}
                    
                    <ConnectButton />
                </div>
            </div>
        </header>
    )
}
