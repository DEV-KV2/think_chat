import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { chatSim } from '../utils/chatSimulation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = await chatSim.login(email, password)
            login(data.user, data.token)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col transition-colors duration-200">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 py-3 bg-white dark:bg-[#1a262e]">
                <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                    <div className="size-6 text-primary">
                        <span className="material-symbols-outlined text-2xl">cloud</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] font-display">think_chat</h2>
                </div>
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                    <span className="truncate">Help</span>
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-[440px] bg-white dark:bg-[#1a262e] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-8 pt-10 pb-4">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center pb-2 font-display">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal text-center px-4">Enter your details to access your conversations.</p>
                    </div>

                    <form className="px-8 py-6 space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal font-display">Email or Username</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input flex w-full min-w-0 flex-1 rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101c22] h-14 placeholder:text-slate-400 dark:placeholder:text-slate-600 px-4 text-base font-normal leading-normal transition-all"
                                placeholder="e.g. alex@example.com"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-slate-900 dark:text-white text-sm font-semibold leading-normal font-display">Password</label>
                                <a className="text-primary text-sm font-medium hover:underline" href="#">Forgot?</a>
                            </div>
                            <div className="relative flex w-full items-stretch rounded-lg group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="form-input flex w-full min-w-0 flex-1 rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101c22] h-14 placeholder:text-slate-400 dark:placeholder:text-slate-600 px-4 text-base font-normal leading-normal pr-12 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1"
                                >
                                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2 px-1 py-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary dark:bg-[#101c22]"
                            />
                            <label className="text-sm text-slate-600 dark:text-slate-400 font-medium" htmlFor="remember">Keep me signed in</label>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#0e8bcc] transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <span className="truncate">{loading ? 'Signing in...' : 'Sign In'}</span>
                        </button>
                    </form>

                    <div className="px-8 pb-10 pt-2 text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                            Don't have an account?
                            <Link to="/signup" className="text-primary font-bold hover:underline ml-1">Create new account</Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Background Decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl"></div>
            </div>

            <footer className="p-6 text-center text-slate-400 dark:text-slate-600 text-xs">
                © 2024 think_chat Inc. All rights reserved.
            </footer>
        </div>
    )
}
