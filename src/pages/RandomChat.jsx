import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../App'

export default function RandomChat() {
    const [status, setStatus] = useState('waiting') // waiting, connected, disconnected
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const { user } = useContext(AuthContext)

    useEffect(() => {
        // Simulate connection after 2 seconds
        const timer = setTimeout(() => {
            setStatus('connected')
            setMessages([
                {
                    id: '1',
                    content: 'Hey there! 👋 Just got connected. How\'s it going today?',
                    senderId: 'stranger',
                    timestamp: '10:42 AM',
                },
            ])
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    const handleSend = (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const msg = {
            id: Date.now().toString(),
            content: newMessage,
            senderId: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages([...messages, msg])
        setNewMessage('')
    }

    const handleDisconnect = () => {
        setStatus('disconnected')
        setMessages([])
    }

    const handleNewChat = () => {
        setStatus('waiting')
        setMessages([])
        setTimeout(() => {
            setStatus('connected')
            setMessages([
                {
                    id: '1',
                    content: 'Hello! Nice to meet you! 🎉',
                    senderId: 'stranger',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ])
        }, 2000)
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-[#111618] dark:text-white transition-colors duration-200">
            {/* Sidebar Navigation */}
            <aside className="w-72 border-r border-solid border-[#e5e7eb] dark:border-[#1e293b] bg-white dark:bg-[#15232a] flex flex-col justify-between p-4 shrink-0">
                <div className="flex flex-col gap-6">
                    {/* App Brand */}
                    <div className="flex items-center gap-3 px-2 py-3">
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">bolt</span>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">Random Chat</h2>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background-light dark:bg-background-dark/50">
                        <div className="size-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-bold">
                            {user?.displayName?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-semibold">{user?.displayName || 'User'}</h1>
                            <p className="text-xs text-[#617c89] dark:text-gray-400">Online</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1">
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium" href="#">
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span className="text-sm">Current Chat</span>
                        </a>
                        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-[#617c89] dark:text-gray-400 transition-colors">
                            <span className="material-symbols-outlined">home</span>
                            <span className="text-sm text-[#111618] dark:text-white">Home</span>
                        </Link>
                        <Link to="/discover" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-[#617c89] dark:text-gray-400 transition-colors">
                            <span className="material-symbols-outlined">group</span>
                            <span className="text-sm text-[#111618] dark:text-white">Friends</span>
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-[#617c89] dark:text-gray-400 transition-colors">
                            <span className="material-symbols-outlined">settings</span>
                            <span className="text-sm text-[#111618] dark:text-white">Preferences</span>
                        </Link>
                    </nav>
                </div>

                {/* Session Controls */}
                <div className="flex flex-col gap-2 pt-4 border-t border-[#e5e7eb] dark:border-[#1e293b]">
                    {status === 'connected' ? (
                        <button
                            onClick={handleDisconnect}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-11 px-4 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 text-sm font-bold transition-all border border-red-100 dark:border-red-900/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">block</span>
                            <span>Disconnect</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleNewChat}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-11 px-4 bg-primary text-white hover:bg-primary/90 text-sm font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">shuffle</span>
                            <span>Find New Chat</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-background-light dark:bg-background-dark relative">
                {/* Chat Top Header */}
                <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#15232a] border-b border-[#e5e7eb] dark:border-[#1e293b] shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            <div className="size-8 rounded-full border-2 border-white dark:border-[#15232a] bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                {user?.displayName?.[0] || 'U'}
                            </div>
                            <div className="size-8 rounded-full border-2 border-white dark:border-[#15232a] bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">
                                ?
                            </div>
                        </div>
                        <h2 className="text-base font-bold tracking-tight">
                            {user?.displayName?.split(' ')[0] || 'You'} <span className="text-[#617c89] font-normal mx-1">&</span> {status === 'connected' ? 'Stranger' : '...'}
                        </h2>
                        {status === 'connected' && (
                            <span className="flex size-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-full text-[#617c89]">
                            <span className="material-symbols-outlined">report</span>
                        </button>
                        <button className="p-2 hover:bg-background-light dark:hover:bg-background-dark rounded-full text-[#617c89]">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </header>

                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-6 gap-6">
                    {status === 'waiting' && (
                        <div className="flex flex-col items-center gap-4 py-20">
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <span className="material-symbols-outlined text-primary text-4xl">shuffle</span>
                            </div>
                            <p className="text-[#617c89] dark:text-gray-400 text-sm">Looking for someone to chat with...</p>
                        </div>
                    )}

                    {status === 'connected' && (
                        <>
                            {/* System Connection Message */}
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="bg-primary/5 dark:bg-primary/10 px-4 py-1.5 rounded-full">
                                    <p className="text-primary text-xs font-semibold uppercase tracking-wider">Connected</p>
                                </div>
                                <p className="text-[#617c89] dark:text-gray-400 text-sm">Connected successfully, now chat.</p>
                            </div>

                            {/* Chat Bubbles */}
                            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-end gap-3 max-w-[80%] ${msg.senderId === 'me' ? 'self-end flex-row-reverse' : 'self-start'}`}
                                    >
                                        <div className={`size-8 rounded-full shrink-0 shadow-sm flex items-center justify-center ${msg.senderId === 'me' ? 'bg-primary/20 border-2 border-primary/20 text-primary' : 'bg-gray-300 text-gray-600'} text-xs font-bold`}>
                                            {msg.senderId === 'me' ? (user?.displayName?.[0] || 'U') : '?'}
                                        </div>
                                        <div className={`flex flex-col gap-1.5 ${msg.senderId === 'me' ? 'items-end' : ''}`}>
                                            <span className="text-[11px] font-semibold text-[#617c89] px-1">
                                                {msg.senderId === 'me' ? 'You' : 'Stranger'} • {msg.timestamp}
                                            </span>
                                            <div className={`px-4 py-3 rounded-xl shadow-sm text-sm leading-relaxed ${msg.senderId === 'me'
                                                    ? 'bg-primary text-white rounded-br-none shadow-md'
                                                    : 'bg-white dark:bg-[#1e293b] text-[#111618] dark:text-white rounded-bl-none border border-[#e5e7eb] dark:border-[#2a3a44]'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {status === 'disconnected' && (
                        <div className="flex flex-col items-center gap-4 py-20">
                            <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 text-4xl">person_off</span>
                            </div>
                            <p className="text-[#617c89] dark:text-gray-400 text-sm">Chat ended. Click below to find someone new!</p>
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">shuffle</span>
                                <span>New Random Chat</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {status === 'connected' && (
                    <footer className="p-6 bg-white dark:bg-[#15232a] border-t border-[#e5e7eb] dark:border-[#1e293b] shrink-0">
                        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-3 bg-background-light dark:bg-background-dark rounded-xl p-1.5 border border-[#e5e7eb] dark:border-[#2a3a44]">
                            <button type="button" className="p-2.5 text-[#617c89] hover:bg-white dark:hover:bg-[#1e293b] rounded-lg transition-colors">
                                <span className="material-symbols-outlined">mood</span>
                            </button>
                            <button type="button" className="p-2.5 text-[#617c89] hover:bg-white dark:hover:bg-[#1e293b] rounded-lg transition-colors">
                                <span className="material-symbols-outlined">attach_file</span>
                            </button>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-[#111618] dark:text-white placeholder-[#617c89]"
                                placeholder="Type a message..."
                            />
                            <button
                                type="submit"
                                className="flex items-center justify-center size-10 bg-primary text-white rounded-lg hover:brightness-110 transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </form>
                        <div className="max-w-3xl mx-auto mt-3 flex justify-center">
                            <p className="text-[10px] text-[#617c89] uppercase tracking-widest font-semibold opacity-70">Shift + Enter for new line</p>
                        </div>
                    </footer>
                )}
            </main>
        </div>
    )
}
