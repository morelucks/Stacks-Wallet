
import { Link } from 'react-router-dom'

export default function Sidebar() {
    return (
        <div className="w-64 border-r bg-gray-50/40 hidden md:block">
            <div className="flex h-full flex-col gap-2 p-4">
                <div className="font-semibold text-sm text-gray-500 mb-2">Menu</div>
                <Link to="/" className="px-4 py-2 hover:bg-gray-100 rounded-md text-sm font-medium">
                    Home
                </Link>
                <Link to="/dashboard" className="px-4 py-2 hover:bg-gray-100 rounded-md text-sm font-medium">
                    Dashboard
                </Link>
                <Link to="/allowances" className="px-4 py-2 hover:bg-gray-100 rounded-md text-sm font-medium">
                    Allowances
                </Link>
                <Link to="/transactions" className="px-4 py-2 hover:bg-gray-100 rounded-md text-sm font-medium">
                    Transactions
                </Link>
            </div>
        </div>
    )
}
