import { useEffect, useMemo, useRef, useState } from 'react'

export default function Timer({ durationSec, onElapsed, running = true, persistKey }) {
  const [remaining, setRemaining] = useState(durationSec)
  const startedAtRef = useRef(Date.now())

  useEffect(() => {
    let restored = null
    if (persistKey) {
      try {
        const raw = localStorage.getItem(persistKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (typeof parsed?.remaining === 'number' && parsed.remaining >= 0 && parsed.remaining <= durationSec) {
            restored = parsed.remaining
          }
        }
      } catch {}
    }
    const baseRemaining = typeof restored === 'number' ? restored : durationSec
    setRemaining(baseRemaining)
    const elapsedFromRemaining = durationSec - baseRemaining
    startedAtRef.current = Date.now() - Math.max(0, elapsedFromRemaining) * 1000
  }, [durationSec, persistKey])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
      const left = Math.max(0, durationSec - elapsed)
      setRemaining(left)
      if (persistKey) {
        try { localStorage.setItem(persistKey, JSON.stringify({ remaining: left, savedAt: Date.now() })) } catch {}
      }
      if (left === 0) {
        clearInterval(id)
        onElapsed?.()
      }
    }, 250)
    return () => clearInterval(id)
  }, [durationSec, running, onElapsed, persistKey])

  const mmss = useMemo(() => {
    const m = Math.floor(remaining / 60)
    const s = remaining % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [remaining])

  const progress = useMemo(() => 100 - (remaining / durationSec) * 100, [remaining, durationSec])

  return (
    <div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 text-sm text-gray-700">Time left: <span className="font-mono font-semibold">{mmss}</span></div>
    </div>
  )
}
