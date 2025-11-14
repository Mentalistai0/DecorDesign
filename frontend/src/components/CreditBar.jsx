import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './CreditBar.css'

function Progress({ label, used = 0, total = 0, compact = false }) {
  const pct = useMemo(() => {
    if (!total || total <= 0) return 0
    const available = Math.max(total - used, 0)
    return Math.round((available / total) * 100)
  }, [used, total])

  return (
    <div className={`cb-row ${compact ? 'cb-compact' : ''}`}>
      {!compact && <div className="cb-label">{label}</div>}
      <div className="cb-track" aria-label={`${label} credits`}>
        <div className="cb-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="cb-count">{Math.max(total - used, 0)} / {total || 0}</div>
    </div>
  )
}

export default function CreditBar({ variant = 'full' }) {
  const { credits } = useAuth()
  const compact = variant === 'compact'

  const image = credits?.image || { total: 0, used: 0 }
  const video = credits?.video || { total: 0, used: 0 }

  return (
    <div className={`creditbar ${compact ? 'creditbar-compact' : ''}`}>
      <Progress label="Image" used={image.used} total={image.total} compact={compact} />
      <Progress label="Video" used={video.used} total={video.total} compact={compact} />
    </div>
  )
}

