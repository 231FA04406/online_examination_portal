import jwt from 'jsonwebtoken'

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'devsecret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function requireAuth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const secret = process.env.JWT_SECRET || 'devsecret'
      const decoded = jwt.verify(token, secret)
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      req.user = decoded
      next()
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}
