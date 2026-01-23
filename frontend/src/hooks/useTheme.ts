import { useState } from 'react'
export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')
    return { theme, toggle }
}
