import { useBalance } from '../../hooks/useBalance'
import { Skeleton } from '../ui/Skeleton'

export function UnifiedBalance({ address }: { address: string | null }) {
    const { balance, loading } = useBalance(address)
    if (loading) return <Skeleton className="h-8 w-32" />
    return <div className="text-2xl font-bold">{balance?.stx?.balance || '0'} STX</div>
}
