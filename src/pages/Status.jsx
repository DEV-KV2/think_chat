import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../App'

export default function Status() {
    const [myStatus, setMyStatus] = useState('Focusing on the new project 🚀')
    const [showModal, setShowModal] = useState(false)
    const [newStatus, setNewStatus] = useState('')
    const { user } = useContext(AuthContext)

    const statuses = [
        { id: '1', name: 'Sarah Jenkins', content: 'Exploring the city today! 🏙️📸', expiresIn: '2h', timeAgo: '10 min ago', isOnline: true },
        { id: '2', name: 'David Chen', content: 'Deep work mode: On 💻', expiresIn: '4h', timeAgo: '45 min ago', isOnline: false },
        { id: '3', name: 'Emily Watson', content: 'Off to the gym! 🏋️‍♀️', expiresIn: 'Expired', timeAgo: '3 hours ago', expired: true },
    ]

    const handlePostStatus = () => {
        if (newStatus.trim()) { setMyStatus(newStatus); setNewStatus(''); setShowModal(false) }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#111618] dark:text-white">
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark flex flex-col p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">cloud</span>
                    </div>
                    <div><h1 className="text-base font-bold">think_chat</h1><p className="text-[#617c89] text-xs">Status</p></div>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                    <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">chat_bubble</span><span className="text-sm font-semibold">Chats</span></Link>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary"><span className="material-symbols-outlined filled">schedule</span><span className="text-sm font-semibold">Status</span></a>
                    <Link to="/discover" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">group</span><span className="text-sm font-semibold">Contacts</span></Link>
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">settings</span><span className="text-sm font-semibold">Settings</span></Link>
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-[960px] mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-4xl font-black">Status Updates</h2><p className="text-[#617c89] mt-1">See what your friends are up to</p></div>
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">add_circle</span><span>Add Status</span>
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-10">
                        <h3 className="text-xl font-bold mb-2">Your Current Status</h3>
                        <p className="text-[#617c89] text-sm mb-4">Shared for 24 hours</p>
                        <span className="px-4 py-2 bg-background-light rounded-lg text-sm italic">"{myStatus}"</span>
                    </div>
                    <h3 className="text-xl font-bold mb-4">Recent Updates</h3>
                    <div className="space-y-2">
                        {statuses.map((s) => (
                            <div key={s.id} className="flex items-center justify-between bg-white dark:bg-gray-900 px-6 py-4 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className={`size-14 rounded-full ${s.expired ? 'border-gray-300' : 'border-primary'} border-2 bg-primary/20 flex items-center justify-center text-primary font-bold`}>{s.name[0]}</div>
                                    <div><p className="font-bold">{s.name}</p><p className="text-[#617c89] text-sm">{s.content}</p></div>
                                </div>
                                <div className="text-right"><p className={`text-xs font-bold uppercase ${s.expired ? 'text-gray-400' : 'text-primary'}`}>{s.expired ? 'Expired' : `Ends in ${s.expiresIn}`}</p><p className="text-gray-400 text-[10px]">{s.timeAgo}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                {showModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-background-dark w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6"><h4 className="text-xl font-bold">Set Status</h4><button onClick={() => setShowModal(false)} className="p-1 text-gray-400"><span className="material-symbols-outlined">close</span></button></div>
                                <textarea value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full bg-background-light dark:bg-gray-800 border-none rounded-xl p-4 text-sm resize-none" placeholder="Share your mind..." rows="3" />
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 rounded-xl">Cancel</button>
                                <button onClick={handlePostStatus} className="flex-[2] py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25">Post Status</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
