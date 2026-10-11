// components/UI.jsx — Shared visual components

// ── Icon system ───────────────────────────────────────────────────────────────
const IC = {
  home:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  user:    'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  users:   'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  spark:   'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  brief:   'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2',
  chart:   'M18 20V10 M12 20V4 M6 20v-6',
  file:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  plus:    'M12 5v14 M5 12h14',
  check:   'M20 6L9 17l-5-5',
  x:       'M18 6L6 18 M6 6l12 12',
  logout:  'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeoff:  'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94 M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24 M1 1l22 22',
  send:    'M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z',
  star:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  down:    'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  bell:    'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  mail:    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  phone:   'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  lock:    'M19 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
  build:   'M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18 M2 22h20 M14 22v-4a2 2 0 00-4 0v4',
  arr:     'M5 12h14 M12 5l7 7-7 7',
  up:      'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  award:   'M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  layers:  'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  menu:    'M3 12h18 M3 6h18 M3 18h18',
  chevL:   'M15 18l-6-6 6-6',
  chevR:   'M9 18l6-6-6-6',
}

export function Ic({ n, s = 16, c = 'currentColor', style }) {
  const d = IC[n]
  if (!d) return null
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} />
      ))}
    </svg>
  )
}

// ── Score Ring ────────────────────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 96 }) {
  const r   = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const col  = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'
  const fs   = Math.round(size * 0.22)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="8"
        strokeDasharray={`${fill} ${circ - fill}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition:'stroke-dasharray 1s ease' }}/>
      <text x="50%" y="50%" textAnchor="middle" dy=".35em"
        fill={col} fontSize={fs} fontWeight="800" fontFamily="var(--mono)">
        {score}%
      </text>
    </svg>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spin({ size = 14 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,.15)`,
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
      flexShrink: 0,
    }}/>
  )
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
export function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0a1628', border: '1px solid rgba(255,255,255,.12)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,.5)',
    }}>
      {label && <div style={{ color:'var(--sub)', marginBottom:6, fontWeight:600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text)', fontWeight: 600, lineHeight: 1.8 }}>
          {p.name}: <span style={{ color:'#fff' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Toast Notification ────────────────────────────────────────────────────────
export function Toast({ notif }) {
  if (!notif) return null
  const icons   = { success: '✓', error: '✕', info: 'ℹ' }
  const classes = { success: 'toast-success', error: 'toast-error', info: 'toast-info' }
  return (
    <div className={`toast-item ${classes[notif.type] || 'toast-info'} pi`}
      style={{ position:'fixed', top:20, right:20, zIndex:9999, backdropFilter:'blur(20px)' }}>
      <span style={{ fontSize:15 }}>{icons[notif.type] || 'ℹ'}</span>
      <span>{notif.msg}</span>
    </div>
  )
}

export const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']
