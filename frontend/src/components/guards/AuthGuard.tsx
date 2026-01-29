import { useWalletConnection } from '../../hooks/useWalletConnection'
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAnyConnected } = useWalletConnection()
    if (!isAnyConnected) return <div>Access Denied</div>
    return <>{children}</>
}
