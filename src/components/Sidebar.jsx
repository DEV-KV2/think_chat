import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../App'

export default function Sidebar({ active }) {
    const { user, logout } = useContext(AuthContext)
    const location = useLocation()

    const navItems = [
        { id: 'home', path: '/', icon: 'home', label: 'Home' },
        { id: 'discover', path: '/discover', icon: 'search', label: 'Search' },
        { id: 'status', path: '/status', icon: 'schedule', label: 'Status' },
        { id: 'settings', path: '/settings', icon: 'settings', label: 'Settings' },
    ]

    return (
        <aside className="w-20 lg:w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d161a] flex flex-col justify-between py-6">
            <div className="flex flex-col gap-8">
                {/* Logo/Brand */}
                <div className="px-6 flex items-center gap-3">
                    <div className="bg-primary size-10 rounded-xl flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-2xl">cloud</span>
                    </div>
                    <div className="hidden lg:flex flex-col">
                        <h1 className="text-[#111618] dark:text-white text-base font-bold leading-none">think_chat</h1>
                        <p className="text-[#617c89] text-xs font-normal">Active</p>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col gap-2 px-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${active === item.id || location.pathname === item.path
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className={`material-symbols-outlined ${active === item.id ? 'filled' : ''}`}>{item.icon}</span>
                            <p className="hidden lg:block text-sm font-semibold">{item.label}</p>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Profile Section */}
            <div className="px-3">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 bg-primary/20"
                        style={{
                            backgroundImage: user?.avatarUrl
                                ? `url("${user.avatarUrl}")`
                                : undefined,
                        }}
                    >
                        {!user?.avatarUrl && (
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                                {user?.displayName?.[0] || user?.username?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <p className="hidden lg:block text-[#111618] dark:text-white text-sm font-medium">
                        {user?.displayName || user?.username || 'My Profile'}
                    </p>
                </Link>
            </div>
        </aside>
    )
}
