import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import Sidebar from '../components/Sidebar'
import { chatSim } from '../utils/chatSimulation'

export default function Home() {
    const [conversations, setConversations] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedChat, setSelectedChat] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user, token } = useContext(AuthContext)
    const navigate = useNavigate()

    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        try {
            const conversations = chatSim.getConversations()
            setConversations(conversations)
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
            setConversations([])
        } finally {
            setLoading(false)
        }
    }

    const handleNewChat = () => {
        navigate('/discover')
    }

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-[#111618] dark:text-white transition-colors duration-200">
            {/* Sidebar Navigation (Rail) */}
            <Sidebar active="home" />

            {/* Chat List Sidebar */}
            <main className="w-full sm:w-[400px] flex-shrink-0 bg-white dark:bg-[#101c22] flex flex-col border-r border-gray-200 dark:border-gray-800">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-center gap-3 p-6 pb-2">
                    <p className="text-[#111618] dark:text-white tracking-tight text-2xl font-bold">Chats</p>
                    <button 
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="truncate">New Chat</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4">
                    <label className="flex flex-col w-full">
                        <div className="flex w-full items-stretch rounded-xl h-12 bg-gray-100 dark:bg-[#1b2a32]">
                            <div className="text-[#617c89] flex items-center justify-center pl-4">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-none bg-transparent focus:ring-0 text-[#111618] dark:text-white placeholder:text-[#617c89] px-4 text-base font-normal"
                                placeholder="Search conversations..."
                            />
                        </div>
                    </label>
                </div>

                {/* Scrollable Chat List */}
                <div className="flex-1 overflow-y-auto space-y-1 pb-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-[#617c89]">Loading conversations...</div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="text-[#617c89] mb-2">No conversations yet</div>
                            <button 
                                onClick={handleNewChat}
                                className="text-primary hover:underline text-sm"
                            >
                                Start your first conversation
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map((conv, index) => (
                            <Link
                                key={conv.id}
                                to={`/chat/${conv.id}`}
                                className={`flex items-center gap-4 px-6 min-h-[80px] py-3 cursor-pointer transition-colors border-l-4 ${index === 0
                                        ? 'bg-primary/5 dark:bg-primary/10 border-primary'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    {conv.isGroup ? (
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #13a4ec, #0a6999)' }}
                                        >
                                            <span className="material-symbols-outlined text-white text-2xl">groups</span>
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14"
                                            style={{ 
                                                backgroundImage: conv.participants?.[0]?.avatarUrl 
                                                    ? `url("${conv.participants[0].avatarUrl}")` 
                                                    : undefined,
                                                backgroundColor: !conv.participants?.[0]?.avatarUrl ? '#e5e7eb' : undefined
                                            }}
                                        >
                                            {!conv.participants?.[0]?.avatarUrl && (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                                    {conv.participants?.[0]?.displayName?.[0] || conv.participants?.[0]?.username?.[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {conv.participants?.[0]?.isOnline && (
                                        <div className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white dark:border-[#101c22] bg-[#078836]" />
                                    )}
                                </div>
                                <div className="flex flex-col justify-center flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[#111618] dark:text-white text-base font-bold leading-normal truncate">{conv.name}</p>
                                        <p className="text-[#617c89] text-[12px] font-normal shrink-0">
                                            {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <p className={`text-sm font-normal leading-normal truncate ${index === 0 ? 'text-primary font-medium' : 'text-[#617c89] dark:text-gray-400'
                                            }`}>
                                            {conv.lastMessage || 'No messages yet'}
                                        </p>
                                        {conv.unread > 0 && (
                                            <div className="flex size-5 items-center justify-center bg-primary rounded-full shrink-0">
                                                <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>

            {/* Main Chat Area (Empty State) */}
            <section className="hidden sm:flex flex-1 bg-background-light dark:bg-[#0b1216] flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md flex flex-col items-center gap-6">
                    <div className="size-24 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-5xl">forum</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#111618] dark:text-white">Start a conversation</h2>
                        <p className="text-[#617c89] mt-2 text-base">Select a chat from the left sidebar to start messaging. Your conversations are safe and encrypted.</p>
                    </div>
                    <button 
                        onClick={handleNewChat}
                        className="flex items-center justify-center gap-2 rounded-xl h-11 px-8 bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        <span>Direct Message</span>
                    </button>
                </div>
            </section>
        </div>
    )
}
