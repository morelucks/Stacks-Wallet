export function Badge({ children, color }: { children: React.ReactNode, color: string }) {
    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{children}</span>
}
