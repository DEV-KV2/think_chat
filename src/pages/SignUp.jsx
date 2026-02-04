import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import { chatSim } from '../utils/chatSimulation'

export default function SignUp() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        displayName: '',
    })
    const [usernameAvailable, setUsernameAvailable] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useContext(AuthContext)
    const navigate = useNavigate()

    const totalSteps = 3
    const progress = (step / totalSteps) * 100

    const checkUsername = async (username) => {
        if (username.length < 3) {
            setUsernameAvailable(null)
            return
        }
        
        // Check against existing users in simulation
        const users = chatSim.getUsers()
        const available = !users.some(u => u.username === username)
        setUsernameAvailable(available)
    }

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = await chatSim.register(
                formData.email,
                formData.password,
                formData.username,
                formData.displayName
            )
            
            login(data.user, data.token)
            navigate('/')
        } catch (err) {
            setError(err.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            {/* Top Navigation Bar */}
            <header className="w-full bg-white dark:bg-background-dark border-b border-solid border-[#f0f3f4] dark:border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#111618] dark:text-white">
                    <div className="size-8 text-primary">
                        <span className="material-symbols-outlined text-3xl">cloud</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">think_chat</h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:block text-sm text-[#617c89]">Already have an account?</span>
                    <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold leading-normal">
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                </div>

                <div className="max-w-[480px] w-full bg-white dark:bg-background-dark/50 backdrop-blur-sm shadow-xl rounded-xl border border-[#dbe2e6] dark:border-gray-800 overflow-hidden relative z-10">
                    {/* Progress Bar Section */}
                    <div className="flex flex-col gap-3 p-6 pb-0">
                        <div className="flex gap-6 justify-between">
                            <p className="text-[#111618] dark:text-gray-200 text-sm font-medium leading-normal">Step {step} of {totalSteps}</p>
                            <p className="text-[#111618] dark:text-gray-200 text-sm font-normal leading-normal">{Math.round(progress)}%</p>
                        </div>
                        <div className="rounded-full bg-[#dbe2e6] dark:bg-gray-700 overflow-hidden">
                            <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {/* Step 1: Email & Password */}
                        {step === 1 && (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-[#111618] dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-2">Create Account</h1>
                                    <p className="text-[#617c89] dark:text-gray-400 text-base font-normal leading-normal">
                                        Enter your email and create a password.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111618] dark:text-gray-200 text-sm font-semibold leading-normal pb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="form-input flex w-full rounded-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-gray-900 h-14 placeholder:text-[#617c89] px-4 text-base"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111618] dark:text-gray-200 text-sm font-semibold leading-normal pb-1">Password</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="form-input flex w-full rounded-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-gray-900 h-14 placeholder:text-[#617c89] px-4 text-base"
                                            placeholder="Minimum 8 characters"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Username */}
                        {step === 2 && (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-[#111618] dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-2">Choose Username</h1>
                                    <p className="text-[#617c89] dark:text-gray-400 text-base font-normal leading-normal">
                                        This is how friends will find you on the platform.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111618] dark:text-gray-200 text-sm font-semibold leading-normal pb-1">Username</label>
                                        <div className="relative flex w-full items-stretch group">
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, username: e.target.value })
                                                    checkUsername(e.target.value)
                                                }}
                                                className="form-input flex w-full rounded-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-gray-900 h-14 placeholder:text-[#617c89] px-4 text-base"
                                                placeholder="e.g., skywalker_99"
                                                required
                                            />
                                            {usernameAvailable !== null && (
                                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center ${usernameAvailable ? 'text-success-green' : 'text-red-500'}`}>
                                                    <span className="material-symbols-outlined filled">{usernameAvailable ? 'check_circle' : 'cancel'}</span>
                                                </div>
                                            )}
                                        </div>
                                        {usernameAvailable !== null && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-medium ${usernameAvailable ? 'text-success-green' : 'text-red-500'}`}>
                                                    {usernameAvailable ? 'Username is available!' : 'Username is taken'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Helpful Info Box */}
                                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-lg flex gap-3">
                                        <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                                        <p className="text-[#617c89] dark:text-gray-300 text-sm font-normal leading-relaxed">
                                            Username can be changed later <span className="font-medium text-[#111618] dark:text-white">(cooldown applies)</span>. Make sure it represents you well!
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 3: Display Name */}
                        {step === 3 && (
                            <>
                                <div className="text-center mb-8">
                                    <h1 className="text-[#111618] dark:text-white tracking-tight text-[32px] font-bold leading-tight pb-2">Your Display Name</h1>
                                    <p className="text-[#617c89] dark:text-gray-400 text-base font-normal leading-normal">
                                        This is the name others will see in conversations.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[#111618] dark:text-gray-200 text-sm font-semibold leading-normal pb-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="form-input flex w-full rounded-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-gray-900 h-14 placeholder:text-[#617c89] px-4 text-base"
                                            placeholder="e.g., Alex Rivers"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 mt-8">
                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-6 bg-primary text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                                >
                                    <span>Continue</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-6 bg-primary text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                                </button>
                            )}
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-transparent text-[#617c89] dark:text-gray-400 text-sm font-semibold leading-normal hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <span>Go back</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center">
                <p className="text-[#617c89] text-xs font-normal">
                    © 2024 think_chat. All rights reserved. <br className="sm:hidden" />
                    <a className="underline ml-1" href="#">Privacy Policy</a> • <a className="underline ml-1" href="#">Terms of Service</a>
                </p>
            </footer>
        </div>
    )
}
