import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext } from 'react'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Discover from './pages/Discover'
import RandomChat from './pages/RandomChat'
import Status from './pages/Status'
import Settings from './pages/Settings'
import { chatSim } from './utils/chatSimulation'

// Auth Context
export const AuthContext = createContext(null)

function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Initialize demo users
        chatSim.initDemoUsers()
        
        // Check for existing session
        const currentUser = chatSim.getCurrentUser()
        if (currentUser) {
            setUser(currentUser)
        }
        setLoading(false)
    }, [])

    const login = (userData, token) => {
        chatSim.setCurrentUser({ ...userData, token })
        setUser({ ...userData, token })
    }

    const logout = () => {
        chatSim.logout()
        setUser(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-pulse">
                    <span className="material-symbols-outlined text-primary text-5xl">cloud</span>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                    <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
                    <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
                    <Route path="/chat/:id" element={user ? <Chat /> : <Navigate to="/login" />} />
                    <Route path="/discover" element={user ? <Discover /> : <Navigate to="/login" />} />
                    <Route path="/random" element={user ? <RandomChat /> : <Navigate to="/login" />} />
                    <Route path="/status" element={user ? <Status /> : <Navigate to="/login" />} />
                    <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthContext.Provider>
    )
}

export default App
