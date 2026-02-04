import { useState, useEffect, useRef, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { chatSim } from '../utils/chatSimulation'

export default function Chat() {
    const { id } = useParams()
    const { user, token } = useContext(AuthContext)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [contact, setContact] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        fetchMessages()
    }, [id])

    const fetchMessages = async () => {
        try {
            const messages = chatSim.getMessages(id)
            setMessages(messages)
            
            // Set contact info from messages
            if (messages.length > 0) {
                const otherUser = messages.find(msg => msg.senderId !== user?.id)
                if (otherUser) {
                    setContact({
                        id: otherUser.senderId,
                        name: otherUser.senderName,
                        avatar: otherUser.senderAvatar,
                        isOnline: otherUser.isOnline
                    })
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
            if (error.message === 'Conversation not found') {
                navigate('/')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        
        try {
            // Get recipient from conversation
            const conversations = chatSim.getConversationsData()
            const conversation = conversations.find(conv => conv.id === id)
            const recipientId = conversation?.participants.find(p => p !== user?.id)
            
            if (!recipientId) {
                throw new Error('Recipient not found')
            }
            
            const data = await chatSim.sendMessage(recipientId, newMessage.trim())
            
            // Add message to local state
            const newMsg = {
                id: data.id,
                content: data.content,
                senderId: data.senderId,
                senderName: user.displayName || user.username,
                senderAvatar: null,
                createdAt: data.createdAt,
                isRead: false
            }
            setMessages([...messages, newMsg])
            setNewMessage('')
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const isMyMessage = (msg) => msg.senderId === user?.id || msg.senderId === 'me'

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#111618] dark:text-white">
            {/* Left Navigation Rail */}
            <aside className="w-20 flex flex-col items-center py-6 gap-8 border-r border-[#f0f3f4] dark:border-white/10 bg-white dark:bg-background-dark">
                <Link to="/" className="bg-primary size-12 rounded-xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                </Link>
                <nav className="flex flex-col gap-6">
                    <Link to="/" className="text-primary cursor-pointer">
                        <span className="material-symbols-outlined text-2xl filled">chat</span>
                    </Link>
                    <Link to="/discover" className="text-[#617c89] hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">group</span>
                    </Link>
                    <div className="text-[#617c89] hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">call</span>
                    </div>
                    <Link to="/settings" className="text-[#617c89] hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </Link>
                </nav>
                <div className="mt-auto">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/20"
                    />
                </div>
            </aside>

            {/* Sidebar: Conversation List */}
            <div className="w-80 hidden md:flex flex-col bg-white dark:bg-background-dark border-r border-[#f0f3f4] dark:border-white/10">
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">Messages</h2>
                    <div className="relative">
                        <div className="flex w-full items-stretch rounded-lg h-10 bg-[#f0f3f4] dark:bg-white/5">
                            <div className="text-[#617c89] flex items-center justify-center pl-3">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input
                                className="form-input flex w-full border-none bg-transparent focus:outline-0 focus:ring-0 text-[#111618] dark:text-white placeholder:text-[#617c89] px-3 text-sm"
                                placeholder="Search conversations..."
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {/* Active Chat Item */}
                    <div className="flex items-center gap-3 bg-primary/10 dark:bg-primary/20 px-4 min-h-[72px] py-2 cursor-pointer border-r-4 border-primary">
                        <div className="relative shrink-0">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12"
                                style={{ backgroundImage: `url("${contact?.avatar}")` }}
                            />
                            {contact?.isOnline && (
                                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-[#078836] border-2 border-white dark:border-background-dark" />
                            )}
                        </div>
                        <div className="flex flex-col justify-center flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[#111618] dark:text-white text-sm font-semibold truncate">{contact?.name}</p>
                                <p className="text-[#617c89] text-[10px]">12:45 PM</p>
                            </div>
                            <p className="text-primary text-xs font-medium truncate">Can you send the files?</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-[#fcfcfc] dark:bg-background-dark/50">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-background-dark border-b border-[#f0f3f4] dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="md:hidden text-[#617c89] hover:text-primary">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                            style={{ 
                                backgroundImage: contact?.avatar 
                                    ? `url("${contact.avatar}")` 
                                    : undefined,
                                backgroundColor: !contact?.avatar ? '#e5e7eb' : undefined
                            }}
                        >
                            {!contact?.avatar && (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                    {contact?.name?.[0] || '?'}
                                </div>
                            )}
                        </div>
                        {contact?.isOnline && (
                            <div className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#078836] border-2 border-white dark:border-background-dark" />
                        )}
                        <div className="flex flex-col">
                            <h2 className="text-[#111618] dark:text-white text-base font-bold leading-tight">{contact?.name}</h2>
                            <p className="text-[#617c89] text-xs font-normal leading-tight">
                                {contact?.isOnline ? 'Active Now' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center rounded-lg size-10 bg-[#f0f3f4] dark:bg-white/5 text-[#111618] dark:text-white hover:bg-[#e4e7e9] dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-xl">call</span>
                        </button>
                        <button className="flex items-center justify-center rounded-lg size-10 bg-[#f0f3f4] dark:bg-white/5 text-[#111618] dark:text-white hover:bg-[#e4e7e9] dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-xl">videocam</span>
                        </button>
                        <button className="flex items-center justify-center rounded-lg size-10 bg-[#f0f3f4] dark:bg-white/5 text-[#111618] dark:text-white hover:bg-[#e4e7e9] dark:hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-xl">info</span>
                        </button>
                    </div>
                </header>

                {/* Chat Content */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-[#617c89]">Loading messages...</div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-[#617c89] mb-2">No messages yet</div>
                            <p className="text-sm text-[#617c89]">Start the conversation with a message!</p>
                        </div>
                    ) : (
                        <>
                            {/* Timestamp Separator */}
                            <div className="flex items-center justify-center my-2">
                                <div className="h-[1px] bg-[#f0f3f4] dark:bg-white/10 flex-1" />
                                <span className="px-4 text-[11px] text-[#617c89] font-medium uppercase tracking-wider">Today</span>
                                <div className="h-[1px] bg-[#f0f3f4] dark:bg-white/10 flex-1" />
                            </div>

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 max-w-[70%] ${isMyMessage(msg) ? 'flex-col items-end self-end' : 'items-end'}`}
                                >
                                    {!isMyMessage(msg) && (
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 self-end"
                                            style={{ 
                                                backgroundImage: msg.senderAvatar 
                                                    ? `url("${msg.senderAvatar}")` 
                                                    : undefined,
                                                backgroundColor: !msg.senderAvatar ? '#e5e7eb' : undefined
                                            }}
                                        >
                                            {!msg.senderAvatar && (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                                    {msg.senderName?.[0] || '?'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`flex flex-col gap-1 ${isMyMessage(msg) ? 'items-end' : ''}`}>
                                        <div
                                            className={`p-4 rounded-2xl text-sm shadow-sm ${isMyMessage(msg)
                                                    ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20'
                                                    : 'bg-[#f0f3f4] dark:bg-white/10 text-[#111618] dark:text-white rounded-bl-none'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 mx-1">
                                            <p className="text-[10px] text-[#617c89]">
                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                            {isMyMessage(msg) && msg.isRead && (
                                                <span className="material-symbols-outlined text-primary text-[14px]">done_all</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className="p-6 bg-white dark:bg-background-dark border-t border-[#f0f3f4] dark:border-white/10 shrink-0">
                    <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#f0f3f4] dark:bg-white/5 rounded-xl px-3 py-2">
                        <button type="button" className="text-[#617c89] hover:text-primary transition-colors p-1">
                            <span className="material-symbols-outlined text-2xl">add_circle</span>
                        </button>
                        <button type="button" className="text-[#617c89] hover:text-primary transition-colors p-1">
                            <span className="material-symbols-outlined text-2xl">image</span>
                        </button>
                        <button type="button" className="text-[#617c89] hover:text-primary transition-colors p-1">
                            <span className="material-symbols-outlined text-2xl">mood</span>
                        </button>
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#111618] dark:text-white placeholder:text-[#617c89]"
                            placeholder="Type a message..."
                        />
                        <button
                            type="submit"
                            className="bg-primary text-white size-10 rounded-lg flex items-center justify-center shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </form>
                </div>
            </main>

            {/* Right Contact Info Panel */}
            <aside className="w-72 hidden xl:flex flex-col bg-white dark:bg-background-dark border-l border-[#f0f3f4] dark:border-white/10 p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 border-4 border-[#f0f3f4] dark:border-white/5"
                        style={{ backgroundImage: `url("${contact?.avatar}")` }}
                    />
                    <div>
                        <h3 className="text-lg font-bold">{contact?.name}</h3>
                        <p className="text-sm text-[#617c89]">{contact?.role}</p>
                    </div>
                </div>
                <div className="mt-10 flex flex-col gap-6">
                    <div>
                        <h4 className="text-xs font-bold text-[#617c89] uppercase tracking-wider mb-3">Shared Files</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 bg-background-light dark:bg-white/5 p-2 rounded-lg cursor-pointer hover:bg-[#e4e7e9] dark:hover:bg-white/10 transition-colors">
                                <div className="bg-primary/20 text-primary p-2 rounded">
                                    <span className="material-symbols-outlined">description</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">Mobile_Flow_v2.pdf</p>
                                    <p className="text-[10px] text-[#617c89]">2.4 MB • Oct 12</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-background-light dark:bg-white/5 p-2 rounded-lg cursor-pointer hover:bg-[#e4e7e9] dark:hover:bg-white/10 transition-colors">
                                <div className="bg-primary/20 text-primary p-2 rounded">
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">Hero_Draft.png</p>
                                    <p className="text-[10px] text-[#617c89]">1.1 MB • Oct 10</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-[#617c89] uppercase tracking-wider mb-3">Settings</h4>
                        <div className="flex flex-col gap-1">
                            <button className="flex items-center justify-between w-full py-2 px-1 text-sm hover:text-primary transition-colors">
                                <span>Notifications</span>
                                <span className="material-symbols-outlined text-lg">toggle_on</span>
                            </button>
                            <button className="flex items-center justify-between w-full py-2 px-1 text-sm hover:text-primary transition-colors">
                                <span>Block {contact?.name?.split(' ')[0]}</span>
                                <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}
