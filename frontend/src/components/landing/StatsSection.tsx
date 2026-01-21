import { useEffect, useState } from 'react'

interface StatItemProps {
    value: string
    label: string
    description: string
    icon: React.ReactNode
}

function StatItem({ value, label, description, icon }: StatItemProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className={`text-center transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full text-white shadow-lg">
                    {icon}
                </div>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-white mb-2 font-mono">
                {value}
            </div>
            <div className="text-xl font-semibold text-orange-300 mb-2">
                {label}
            </div>
            <div className="text-gray-300 text-sm max-w-xs mx-auto">
                {description}
            </div>
        </div>
    )
}

export default function StatsSection() {
    const stats = [
        {
            value: "$50M+",
            label: "Assets Secured",
            description: "Total value of digital assets protected by our multi-signature wallets",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            value: "1,200+",
            label: "Active Wallets",
            description: "Organizations and teams trusting our platform for their digital asset management",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            value: "99.9%",
            label: "Uptime",
            description: "Reliable infrastructure ensuring your wallet is always accessible when you need it",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            value: "24/7",
            label: "Security Monitoring",
            description: "Continuous monitoring and threat detection to keep your assets safe around the clock",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        }
    ]

    return (
        <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Background decoration */}
            <div 
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            ></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Trusted by Organizations Worldwide
                    </h2>
                    <p className="max-w-3xl mx-auto text-xl text-gray-300">
                        Join thousands of teams and organizations who trust WalletX to secure their digital assets. 
                        Our track record speaks for itself.
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatItem
                            key={index}
                            value={stat.value}
                            label={stat.label}
                            description={stat.description}
                            icon={stat.icon}
                        />
                    ))}
                </div>

                {/* Trust badges */}
                <div className="mt-20 text-center">
                    <p className="text-gray-400 mb-8 text-lg">
                        Audited and trusted by leading security firms
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                        {/* Placeholder for security audit badges */}
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">Security Audited</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">SOC 2 Compliant</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">Open Source</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}