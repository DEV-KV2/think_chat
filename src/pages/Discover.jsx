import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import Sidebar from '../components/Sidebar'
import { chatSim } from '../utils/chatSimulation'

export default function Discover() {
    const [searchQuery, setSearchQuery] = useState('')
    const [allUsers, setAllUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const { user, token } = useContext(AuthContext)
    const navigate = useNavigate()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            // Try to fetch from real server first
            const response = await fetch('http://localhost:3001/api/users/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            
            if (response.ok) {
                const data = await response.json()
                setAllUsers(data)
                setFilteredUsers(data)
                console.log('✅ Loaded real users from server:', data.length)
                return
            }
        } catch (error) {
            console.log('❌ Server not available, using simulation')
        }
        
        // Fallback to simulation
        try {
            const users = chatSim.getOtherUsers()
            setAllUsers(users)
            setFilteredUsers(users)
            console.log('🔄 Using simulation, loaded users:', users.length)
        } catch (error) {
            console.error('❌ Failed to load users:', error)
            setAllUsers([])
            setFilteredUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = allUsers.filter(u =>
                (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setFilteredUsers(filtered)
            console.log('Search query:', searchQuery, 'Found users:', filtered.length)
        } else {
            setFilteredUsers(allUsers)
            console.log('No search query, showing all users:', allUsers.length)
        }
    }, [searchQuery, allUsers])

    const startChat = async (recipientId) => {
        try {
            // Try real server first
            const response = await fetch('http://localhost:3001/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId,
                    content: 'Hello! 👋'
                })
            })
            
            if (response.ok) {
                const data = await response.json()
                console.log('✅ Started chat via server:', data.conversationId)
                navigate(`/chat/${data.conversationId}`)
                return
            }
        } catch (error) {
            console.log('❌ Server not available, using simulation')
        }
        
        // Fallback to simulation
        try {
            const data = await chatSim.sendMessage(recipientId, 'Hello! 👋')
            console.log('🔄 Started chat via simulation:', data.conversationId)
            navigate(`/chat/${data.conversationId}`)
        } catch (error) {
            console.error('❌ Failed to start chat:', error)
            // Final fallback
            const conversationId = `chat-${user?.id}-${recipientId}`
            navigate(`/chat/${conversationId}`)
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-[#111618] dark:text-white transition-colors duration-200">
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 bg-white dark:bg-[#1a2730] border-r border-[#dbe2e6] dark:border-gray-800 flex flex-col justify-between p-6">
                <div className="flex flex-col gap-8">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-full p-2 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[#111618] dark:text-white text-lg font-bold leading-tight">think_chat</h1>
                            <p className="text-[#617c89] text-xs font-medium">Modern Messaging</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-2">
                        <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-[#617c89] dark:text-gray-400">
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span className="text-sm font-semibold tracking-wide">Messages</span>
                        </Link>
                        <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0f3f4] dark:bg-primary/20 text-primary transition-all" href="#">
                            <span className="material-symbols-outlined filled">explore</span>
                            <span className="text-sm font-semibold tracking-wide">Discover</span>
                        </a>
                        <Link to="/random" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-[#617c89] dark:text-gray-400">
                            <span className="material-symbols-outlined">shuffle</span>
                            <span className="text-sm font-semibold tracking-wide">Random Chat</span>
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-[#617c89] dark:text-gray-400">
                            <span className="material-symbols-outlined">account_circle</span>
                            <span className="text-sm font-semibold tracking-wide">Profile</span>
                        </Link>
                    </nav>
                </div>

                {/* Profile Widget */}
                <div className="mt-auto flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.displayName?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.displayName || 'User'}</p>
                        <p className="text-[11px] text-[#617c89] font-medium">Online</p>
                    </div>
                    <Link to="/settings" className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined text-xl">settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
                <div className="max-w-5xl mx-auto px-8 py-10">
                    {/* Header */}
                    <header className="mb-10">
                        <h1 className="text-[#111618] dark:text-white text-4xl font-extrabold tracking-tight mb-2">Search and Discover</h1>
                        <p className="text-[#617c89] dark:text-gray-400 text-base">Find your friends or meet someone new.</p>
                    </header>

                    {/* Search Controls */}
                    <div className="flex flex-wrap items-center gap-4 mb-12">
                        <div className="flex-1 min-w-[320px]">
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617c89] font-medium text-lg">@</span>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-10 pr-12 rounded-2xl border border-[#dbe2e6] dark:border-gray-800 bg-white dark:bg-[#1a2730] text-[#111618] dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-[#617c89]"
                                    placeholder="Search by username..."
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617c89]">
                                    <span className="material-symbols-outlined">search</span>
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/random"
                            className="flex items-center justify-center gap-2 h-14 px-8 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-105 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-xl">shuffle</span>
                            <span>Random Chat</span>
                        </Link>
                    </div>

                    {/* Suggested Users Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[#111618] dark:text-white text-xl font-bold tracking-tight">Suggested Users</h2>
                            <a className="text-primary text-sm font-bold hover:underline" href="#">View all</a>
                        </div>

                        {/* Grid of User Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                <div className="col-span-full flex items-center justify-center py-12">
                                    <div className="text-[#617c89]">Loading users...</div>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                    <div className="text-[#617c89] mb-2">No users found</div>
                                    <p className="text-sm text-[#617c89]">Try adjusting your search or check back later</p>
                                </div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="bg-white dark:bg-[#1a2730] p-6 rounded-3xl border border-[#dbe2e6] dark:border-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="relative">
                                                <div
                                                    className="w-16 h-16 rounded-2xl bg-cover bg-center shadow-md"
                                                    style={{ 
                                                        backgroundImage: u.avatarUrl 
                                                            ? `url('${u.avatarUrl}')` 
                                                            : undefined,
                                                        backgroundColor: !u.avatarUrl ? '#e5e7eb' : undefined
                                                    }}
                                                >
                                                    {!u.avatarUrl && (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xl">
                                                            {u.displayName?.[0] || u.username?.[0] || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${u.isOnline ? 'bg-green-500' : 'bg-gray-300'} border-2 border-white dark:border-[#1a2730] rounded-full`} />
                                            </div>
                                            <button className="text-gray-300 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">star</span>
                                            </button>
                                        </div>
                                        <div className="mb-6">
                                            <h3 className="text-[#111618] dark:text-white font-bold text-lg leading-tight">{u.displayName || u.username}</h3>
                                            <p className="text-[#617c89] text-sm font-medium">@{u.username}</p>
                                        </div>
                                        <button 
                                            onClick={() => startChat(u.id)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">send</span>
                                            <span>Start chat</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
