import { useState, useEffect } from 'react'
import { getStxBalance } from '../config/stacks'

export function useBalance(stacksAddress: string | null) {
    const [balance, setBalance] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (stacksAddress) {
            setLoading(true)
            getStxBalance(stacksAddress)
                .then(setBalance)
                .finally(() => setLoading(false))
        }
    }, [stacksAddress])

    return { balance, loading }
}
