import { useState } from 'react'
export function useActivity() {
    const [activities] = useState([])
    return { activities }
}
