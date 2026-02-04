import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'think_chat_secret_key_2024'

export function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' })
    }
}

export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}
