import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'
import { useWalletConnection } from '../../hooks/useWalletConnection'

export default function HeroSection() {
    const { connectBothWallets, isAnyWalletConnected, isBothWalletsConnected, isConnecting } = useWalletConnection()

    const handleGetStarted = () => {
        if (!isAnyWalletConnected) {
            connectBothWallets()
        }
    }

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Background decoration */}
            <div 
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            ></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                <div className="text-center">
                    {/* Main heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                        <span className="block">Secure Multi-Signature</span>
                        <span className="block bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                            Stacks Wallet
                        </span>
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed">
                        Enterprise-grade wallet management for teams and organizations. 
                        Secure your digital assets with collaborative control and advanced security features.
                    </p>
                    
                    {/* Connection Status */}
                    {isAnyWalletConnected && (
                        <div className="mb-6">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                                isBothWalletsConnected 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    isBothWalletsConnected ? 'bg-green-400' : 'bg-yellow-400'
                                }`}></div>
                                <span className="text-sm font-medium">
                                    {isBothWalletsConnected 
                                        ? 'Wallets Connected - Ready to Use!' 
                                        : 'Partial Connection - Connect Both Wallets'
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {isAnyWalletConnected ? (
                            <Link to="/dashboard">
                                <Button 
                                    size="lg" 
                                    className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Open Dashboard
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Button>
                            </Link>
                        ) : (
                            <Button 
                                size="lg" 
                                onClick={handleGetStarted}
                                disabled={isConnecting}
                                className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                            >
                                {isConnecting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        Connect Wallets
                                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </Button>
                        )}
                        
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-gray-300 text-white hover:bg-white hover:text-gray-900 transition-all duration-300"
                        >
                            View Demo
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </Button>
                    </div>
                    
                    {/* Trust indicators */}
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Non-custodial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Open Source</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Audited</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}