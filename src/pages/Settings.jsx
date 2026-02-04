import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'

export default function Settings() {
    const { user, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const [theme, setTheme] = useState('dark')
    const [displayName, setDisplayName] = useState(user?.displayName || '')
    const [bio, setBio] = useState(user?.bio || '')

    const handleLogout = () => { logout(); navigate('/login') }

    const handleSave = async () => {
        // TODO: Implement save logic
        alert('Settings saved!')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-[#111618] dark:text-white">
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark flex flex-col p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white"><span className="material-symbols-outlined">cloud</span></div>
                    <div><h1 className="text-base font-bold">think_chat</h1><p className="text-[#617c89] text-xs">Settings</p></div>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                    <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">chat_bubble</span><span className="text-sm font-semibold">Chats</span></Link>
                    <Link to="/status" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">schedule</span><span className="text-sm font-semibold">Status</span></Link>
                    <Link to="/discover" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100"><span className="material-symbols-outlined">group</span><span className="text-sm font-semibold">Contacts</span></Link>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary"><span className="material-symbols-outlined filled">settings</span><span className="text-sm font-semibold">Settings</span></a>
                </nav>
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 mt-auto">
                    <span className="material-symbols-outlined">logout</span><span className="text-sm font-semibold">Log out</span>
                </button>
            </aside>
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-[800px] mx-auto">
                    <h2 className="text-4xl font-black mb-8">Settings</h2>

                    {/* Profile Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
                        <h3 className="text-lg font-bold mb-6">Profile Information</h3>
                        <div className="flex items-center gap-6 mb-6">
                            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">{displayName[0] || 'U'}</div>
                            <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all">Change Avatar</button>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-semibold mb-2">Display Name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full h-12 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-primary/50" /></div>
                            <div><label className="block text-sm font-semibold mb-2">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full h-24 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent resize-none focus:ring-2 focus:ring-primary/50" placeholder="Tell others about yourself..." /></div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
                        <h3 className="text-lg font-bold mb-6">Appearance</h3>
                        <div className="flex gap-4">
                            <button onClick={() => { setTheme('light'); document.documentElement.classList.remove('dark') }} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <span className="material-symbols-outlined text-2xl mb-2">light_mode</span><p className="text-sm font-bold">Light</p>
                            </button>
                            <button onClick={() => { setTheme('dark'); document.documentElement.classList.add('dark') }} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <span className="material-symbols-outlined text-2xl mb-2">dark_mode</span><p className="text-sm font-bold">Dark</p>
                            </button>
                            <button onClick={() => setTheme('system')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <span className="material-symbols-outlined text-2xl mb-2">devices</span><p className="text-sm font-bold">System</p>
                            </button>
                        </div>
                    </div>

                    {/* Privacy Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
                        <h3 className="text-lg font-bold mb-6">Privacy & Safety</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                                <div><p className="font-semibold">Show Online Status</p><p className="text-sm text-[#617c89]">Let others see when you're online</p></div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                                <div><p className="font-semibold">Read Receipts</p><p className="text-sm text-[#617c89]">Show when you've read messages</p></div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div><p className="font-semibold">Allow Random Chat</p><p className="text-sm text-[#617c89]">Let strangers find you in random chat</p></div>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-primary focus:ring-primary" />
                            </div>
                        </div>
                    </div>

                    <button onClick={handleSave} className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save Changes</button>
                </div>
            </main>
        </div>
    )
}
