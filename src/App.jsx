// App.jsx — FairRank AI v5 Enhanced
// New features: Dark/Light mode, localStorage persistence, interview scheduling,
// skill gap roadmap, AI interview questions, export PDF, audit log, mobile responsive
import { useState, useEffect, useRef } from 'react'
import { Toast } from './components/UI.jsx'
import { INIT_DB, saveDB } from './db.js'
import { fileToBase64, getFileMime, getFileIcon, analyzeWithFile, analyzeWithText } from './api.js'
import { Ic, ScoreRing, Spin, ChartTip, COLORS } from './components/UI.jsx'
import Landing from './pages/Landing.jsx'
import { Login, Register, ForgotPassword } from './pages/Auth.jsx'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ── Theme helper ─────────────────────────────────────────────────
function getInitTheme() {
  try { return localStorage.getItem('fairrank_theme') || 'light' } catch(e) { return 'light' }
}

// ── Skeleton Components ──────────────────────────────────────────
function SkeletonCard({ height = 120, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, borderRadius: 14, marginBottom: 12 }} />
}
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--bord)', marginBottom: 8 }}>
      <div className="skeleton skel-avatar" />
      <div style={{ flex: 1 }}>
        <div className="skeleton skel-title" style={{ width: '60%', marginBottom: 6 }} />
        <div className="skeleton skel-text" style={{ width: '40%' }} />
      </div>
      <div className="skeleton skel-btn" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDb]             = useState(INIT_DB)
  const [user, setUser]         = useState(null)
  const [page, setPage]         = useState('landing')
  const [loginRole, setLoginRole] = useState('candidate')
  const [notif, setNotif]       = useState(null)
  const [theme, setTheme]       = useState(getInitTheme)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('fairrank_theme', theme) } catch(e) {}
  }, [theme])

  // Auto-save DB changes to localStorage
  useEffect(() => { saveDB(db) }, [db])

  const toast = (msg, type = 'success') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 4000) }
  const go    = p  => { setPage(p); window.scrollTo(0, 0) }
  const logout = () => { setUser(null); setPage('landing'); toast('Logged out', 'info') }
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const addUser         = u  => setDb(p => ({ ...p, users: [...p.users, u] }))
  const addJob          = j  => setDb(p => ({ ...p, jobs: [...p.jobs, j] }))
  const addApp          = a  => setDb(p => ({ ...p, applications: [...p.applications, a] }))
  const addMsg          = m  => setDb(p => ({ ...p, messages: [...p.messages, m] }))
  const markRead        = id => setDb(p => ({ ...p, messages: p.messages.map(m => m.id === id ? { ...m, read: true } : m) }))
  const updateUserPw    = (email, pw) => setDb(p => ({ ...p, users: p.users.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: pw } : u) }))
  const updateAppStatus = (id, st, actorName) => {
    setDb(p => {
      const app = p.applications.find(a => a.id === id)
      const newLog = {
        id: `log_${Date.now()}`,
        actorId: user?.id || 'system',
        actorName: actorName || user?.name || 'System',
        action: 'Status Updated',
        detail: `${app?.candidateName || 'Candidate'} → ${st} for ${app?.jobTitle || 'job'}`,
        timestamp: new Date().toISOString()
      }
      return {
        ...p,
        applications: p.applications.map(a => a.id === id ? { ...a, status: st } : a),
        auditLog: [...(p.auditLog || []), newLog]
      }
    })
  }
  const addInterview = iv => setDb(p => ({ ...p, interviews: [...(p.interviews || []), iv] }))
  const updateInterview = (id, status) => setDb(p => ({ ...p, interviews: (p.interviews || []).map(iv => iv.id === id ? { ...iv, status } : iv) }))

  const myApps    = user ? db.applications.filter(a => a.candidateId === user.id) : []
  const myJobs    = user?.role === 'hr' ? db.jobs.filter(j => j.hrId === user.id) : []
  const myJobApps = user?.role === 'hr' ? db.applications.filter(a => myJobs.some(j => j.id === a.jobId)) : []
  const unread    = user ? db.messages.filter(m => m.toId === user.id && !m.read).length : 0
  const myInterviews = user ? (db.interviews || []).filter(iv => iv.candidateId === user.id || iv.hrId === user.id) : []

  const isC = user?.role === 'candidate'
  const isH = user?.role === 'hr'
  const isA = user?.role === 'admin'
  const cPages = ['c-dash', 'c-analyze', 'c-build', 'c-jobs', 'c-apps', 'c-msgs', 'c-interviews', 'c-profile']
  const hPages = ['h-dash', 'h-cands', 'h-jobs', 'h-post', 'h-msgs', 'h-ga', 'h-interviews', 'h-audit']

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Toast notif={notif} />
      {page === 'landing'         && <Landing go={go} setLoginRole={setLoginRole} />}
      {page === 'login'           && <Login go={go} initRole={loginRole} db={db} setUser={setUser} toast={toast} />}
      {page === 'register'        && <Register go={go} db={db} addUser={addUser} setUser={setUser} toast={toast} />}
      {page === 'forgot-password' && <ForgotPassword go={go} db={db} updateUserPassword={updateUserPw} toast={toast} />}

      {isC && cPages.includes(page) && (
        <Shell user={user} page={page} go={go} logout={logout} unread={unread}
          accent="#3B82F6" grad="linear-gradient(135deg,#3B82F6,#8B5CF6)" label="Candidate Portal" icon="spark"
          actClass="act" theme={theme} toggleTheme={toggleTheme}
          nav={[
            { id: 'c-dash',       ic: 'home',   l: 'Dashboard' },
            { id: 'c-analyze',    ic: 'spark',  l: 'Resume Scorer' },
            { id: 'c-profile',    ic: 'user',   l: 'Profile → Resume' },
            { id: 'c-build',      ic: 'file',   l: 'Resume Builder' },
            { id: 'c-jobs',       ic: 'brief',  l: 'Job Board' },
            { id: 'c-apps',       ic: 'chart',  l: 'My Applications' },
            { id: 'c-interviews', ic: 'phone',  l: 'Interviews', badge: myInterviews.filter(iv => iv.candidateId === user.id && iv.status === 'pending').length || 0 },
            { id: 'c-msgs',       ic: 'mail',   l: 'Messages', badge: unread },
          ]}>
          {page === 'c-dash'       && <CDash user={user} go={go} myApps={myApps} jobs={db.jobs} />}
          {page === 'c-analyze'    && <CAnalyze user={user} jobs={db.jobs} toast={toast} addApp={addApp} />}
          {page === 'c-profile'    && <CProfileResume user={user} toast={toast} />}
          {page === 'c-build'      && <CBuilder user={user} toast={toast} />}
          {page === 'c-jobs'       && <CJobs jobs={db.jobs} user={user} myApps={myApps} addApp={addApp} toast={toast} />}
          {page === 'c-apps'       && <CApps myApps={myApps} jobs={db.jobs} />}
          {page === 'c-interviews' && <InterviewsPage user={user} interviews={db.interviews || []} updateInterview={updateInterview} toast={toast} />}
          {page === 'c-msgs'       && <Messaging user={user} db={db} addMsg={addMsg} markRead={markRead} toast={toast} accent="#3B82F6" />}
        </Shell>
      )}

      {isH && hPages.includes(page) && (
        <Shell user={user} page={page} go={go} logout={logout} unread={unread}
          accent="#8B5CF6" grad="linear-gradient(135deg,#8B5CF6,#6D28D9)" label={user.company} icon="build"
          actClass="act-hr" theme={theme} toggleTheme={toggleTheme}
          nav={[
            { id: 'h-dash',       ic: 'layers', l: 'Dashboard' },
            { id: 'h-cands',      ic: 'users',  l: 'Candidates' },
            { id: 'h-jobs',       ic: 'brief',  l: 'My Jobs' },
            { id: 'h-post',       ic: 'plus',   l: 'Post New Job' },
            { id: 'h-ga',         ic: 'spark',  l: 'GA Optimizer' },
            { id: 'h-interviews', ic: 'phone',  l: 'Interviews' },
            { id: 'h-audit',      ic: 'shield', l: 'Audit Log' },
            { id: 'h-msgs',       ic: 'mail',   l: 'Messages', badge: unread },
          ]}>
          {page === 'h-dash'       && <HDash db={db} user={user} go={go} myJobs={myJobs} myJobApps={myJobApps} />}
          {page === 'h-cands'      && <HCands db={db} user={user} myJobs={myJobs} myJobApps={myJobApps} toast={toast} updateAppStatus={updateAppStatus} addInterview={addInterview} addMsg={addMsg} />}
          {page === 'h-jobs'       && <HJobs db={db} user={user} myJobs={myJobs} myJobApps={myJobApps} go={go} />}
          {page === 'h-post'       && <HPostJob user={user} addJob={addJob} go={go} toast={toast} />}
          {page === 'h-ga'         && <GAOptimizer db={db} myJobApps={myJobApps} toast={toast} />}
          {page === 'h-interviews' && <InterviewsPage user={user} interviews={db.interviews || []} updateInterview={updateInterview} toast={toast} />}
          {page === 'h-audit'      && <AuditLog auditLog={db.auditLog || []} />}
          {page === 'h-msgs'       && <Messaging user={user} db={db} addMsg={addMsg} markRead={markRead} toast={toast} accent="#8B5CF6" />}
        </Shell>
      )}

      {isA && (
        <Shell user={user} page={page} go={go} logout={logout} unread={0}
          accent="#F59E0B" grad="linear-gradient(135deg,#F59E0B,#D97706)" label="Super Admin" icon="shield"
          actClass="act-adm" theme={theme} toggleTheme={toggleTheme}
          nav={[
            { id: 'a-dash',  ic: 'layers', l: 'Overview' },
            { id: 'a-users', ic: 'users',  l: 'All Users' },
            { id: 'a-jobs',  ic: 'brief',  l: 'All Jobs' },
            { id: 'a-apps',  ic: 'chart',  l: 'All Applications' },
            { id: 'a-msgs',  ic: 'mail',   l: 'All Messages' },
            { id: 'a-audit', ic: 'shield', l: 'Audit Log' },
          ]}>
          <div style={{ padding: 32 }}>
            <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Admin Portal</div>
            <div style={{ color: 'var(--sub)', fontSize: 14 }}>Platform overview — {db.users.length} users · {db.jobs.length} jobs · {db.applications.length} applications</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 24 }}>
              {[
                { l: 'Total Users', v: db.users.filter(u => u.role !== 'admin').length, c: '#3B82F6' },
                { l: 'HR Accounts', v: db.users.filter(u => u.role === 'hr').length, c: '#8B5CF6' },
                { l: 'Candidates', v: db.users.filter(u => u.role === 'candidate').length, c: '#10B981' },
                { l: 'Applications', v: db.applications.length, c: '#F59E0B' },
              ].map(({ l, v, c }) => (
                <div key={l} className="statcard">
                  <div style={{ fontWeight: 800, fontSize: 28, color: c, fontFamily: 'var(--mono)' }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <AuditLog auditLog={db.auditLog || []} />
            </div>
          </div>
        </Shell>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// SHELL
// ─────────────────────────────────────────────────────────────────
function Shell({ user, page, go, logout, unread, accent, grad, label, icon, actClass, nav, children, theme, toggleTheme }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <div className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic n={icon} s={14} c="white" />
          </div>
          <span className="sidebar-logo-text">FairRank <span style={{ color: accent }}>AI</span></span>
        </div>
        <div className="sidebar-sub">{label}</div>

        <div className="sidebar-nav">
          {nav.map(({ id, ic, l, badge }) => (
            <button key={id} className={`nav-item${page === id ? ' ' + actClass : ''}`}
              style={page === id ? { color: accent, background: `${accent}18`, borderColor: `${accent}30` } : {}}
              onClick={() => { go(id); setMobileOpen(false) }}
              title={collapsed ? l : undefined}>
              <Ic n={ic} s={15} c={page === id ? accent : 'var(--sub)'} />
              <span className="nav-label">{l}</span>
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px', borderTop: '1px solid var(--bord)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            <Ic n={collapsed ? 'chevR' : 'chevL'} s={15} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', overflow: 'hidden' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{user.avatar}</div>
            <div className="sidebar-logo-text" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
          <button className="nav-item" onClick={logout} title={collapsed ? 'Logout' : undefined}>
            <Ic n="logout" s={14} /><span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="content">
        <div className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
            <Ic n="menu" s={18} />
          </button>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="topbar-title">{label}</div>
          <div className="topbar-user">
            {/* Theme toggle */}
            <div className={`theme-toggle${theme === 'light' ? ' light' : ''}`} onClick={toggleTheme} title="Toggle theme">
              <div className="theme-toggle-knob">{theme === 'light' ? '☀️' : '🌙'}</div>
            </div>
            {unread > 0 && <span className="topbar-badge">{unread}</span>}
            <div className="topbar-avatar" style={{ background: grad, color: 'white' }}>{user.avatar}</div>
          </div>
        </div>
        <div className="content-inner page-enter">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// LABEL helper
// ─────────────────────────────────────────────────────────────────
function Lbl({ children }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', letterSpacing: '.05em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{children}</label>
}

// ─────────────────────────────────────────────────────────────────
// PAGE HEADER helpers
// ─────────────────────────────────────────────────────────────────
function PageHdr({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h2>
        {sub && <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 4 }}>{sub}</div>}
      </div>
      {children && <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MESSAGING
// ─────────────────────────────────────────────────────────────────
function Messaging({ user, db, addMsg, markRead, toast, accent }) {
  const opp = user.role === 'candidate' ? 'hr' : 'candidate'
  const [sel, setSel] = useState(null)
  const [compose, setCompose] = useState(false)
  const [toUser, setToUser] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const thread = [...db.messages].filter(m => m.fromId === user.id || m.toId === user.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const contacts = db.users.filter(u => u.role === opp)

  const viewMsg = m => { setSel(m); if (m.toId === user.id && !m.read) markRead(m.id) }
  const send = () => {
    if (!toUser) { toast('Select a recipient', 'error'); return }
    if (!subject.trim() || !body.trim()) { toast('Fill subject and message', 'error'); return }
    setSending(true)
    const r = db.users.find(u => u.id === toUser)
    setTimeout(() => {
      addMsg({ id: `msg_${Date.now()}`, fromId: user.id, fromName: user.name, fromRole: user.role, toId: r.id, toName: r.name, toRole: r.role, subject: subject.trim(), body: body.trim(), timestamp: new Date().toISOString(), read: false })
      toast(`Message sent to ${r.name} ✓`)
      setCompose(false); setToUser(''); setSubject(''); setBody('')
      setSending(false)
    }, 600)
  }

  return (
    <div style={{ padding: '0 0 20px' }}>
      <PageHdr title="Messages" sub={`${thread.filter(m => m.toId === user.id && !m.read).length} unread · Chat with your ${opp === 'hr' ? 'HR contacts' : 'candidates'}`}>
        <button className="btn" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }} onClick={() => { setCompose(true); setSel(null) }}>
          <Ic n="plus" s={13} /> Compose
        </button>
      </PageHdr>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18 }} className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '72vh', overflowY: 'auto' }}>
          {thread.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}><div style={{ fontSize: 36, marginBottom: 12 }}>💬</div><div>No messages yet.</div></div>}
          {thread.map(m => {
            const isFrom = m.fromId === user.id, other = isFrom ? m.toName : m.fromName, unr = m.toId === user.id && !m.read
            return (
              <div key={m.id} onClick={() => viewMsg(m)} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${sel?.id === m.id ? accent + '50' : 'var(--bord)'}`, background: sel?.id === m.id ? `${accent}10` : unr ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)', cursor: 'pointer', transition: 'all .15s', position: 'relative' }}>
                {unr && <div style={{ position: 'absolute', top: 13, right: 13, width: 7, height: 7, borderRadius: '50%', background: accent }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ fontWeight: unr ? 700 : 600, fontSize: 13 }}>{other}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{new Date(m.timestamp).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: unr ? 600 : 500, fontSize: 12, color: unr ? 'var(--text)' : 'var(--sub)', marginBottom: 2 }}>{m.subject}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.body}</div>
                {isFrom && <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3, display: 'block' }}>You sent</span>}
              </div>
            )
          })}
        </div>
        {compose ? (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="mail" s={16} c={accent} /> New Message</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><Lbl>To</Lbl><select value={toUser} onChange={e => setToUser(e.target.value)} style={{ width: '100%', padding: '10px 14px' }}><option value="">Select {opp === 'hr' ? 'HR contact' : 'candidate'}...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}</select></div>
              <div><Lbl>Subject</Lbl><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Interview query..." style={{ width: '100%', padding: '10px 14px' }} /></div>
              <div><Lbl>Message</Lbl><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." rows={8} style={{ width: '100%', padding: '12px 14px', resize: 'vertical', lineHeight: 1.7 }} /></div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn btn-g" onClick={() => setCompose(false)}>Cancel</button>
                <button className="btn" disabled={sending} style={{ flex: 1, background: `linear-gradient(135deg,${accent},${accent}cc)`, color: '#fff' }} onClick={send}>{sending ? <Spin /> : <><Ic n="send" s={13} /> Send Message</>}</button>
              </div>
            </div>
          </div>
        ) : sel ? (
          <div className="card">
            <div style={{ borderBottom: '1px solid var(--bord)', paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{sel.subject}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--sub)' }}>
                <span><strong style={{ color: 'var(--text)' }}>From:</strong> {sel.fromName} ({sel.fromRole})</span>
                <span><strong style={{ color: 'var(--text)' }}>To:</strong> {sel.toName}</span>
                <span>{new Date(sel.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-wrap', minHeight: 140 }}>{sel.body}</div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--bord)' }}>
              <button className="btn" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
                onClick={() => { setToUser(sel.fromId === user.id ? sel.toId : sel.fromId); setSubject(`Re: ${sel.subject}`); setBody(''); setCompose(true); setSel(null) }}>
                <Ic n="arr" s={13} /> Reply
              </button>
            </div>
          </div>
        ) : (
          <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 10, background: 'rgba(255,255,255,.02)', borderRadius: 16, border: '1px dashed var(--bord)' }}>
            <Ic n="mail" s={36} c="var(--muted)" /><div style={{ fontSize: 14 }}>Select a message or compose</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// INTERVIEW SCHEDULING PAGE
// ─────────────────────────────────────────────────────────────────
function InterviewsPage({ user, interviews, updateInterview, toast }) {
  const [showSchedule, setShowSchedule] = useState(false)
  const isHR = user.role === 'hr'
  const myIVs = interviews.filter(iv => isHR ? iv.hrId === user.id : iv.candidateId === user.id)

  const statusColor = { pending: '#F59E0B', accepted: '#10B981', declined: '#EF4444', completed: '#8B5CF6' }

  return (
    <div style={{ padding: '0 0 20px' }}>
      <PageHdr title="Interview Schedule" sub={`${myIVs.length} interview${myIVs.length !== 1 ? 's' : ''} · ${isHR ? 'Schedule with candidates' : 'Your upcoming interviews'}`} />
      {myIVs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Interviews Yet</div>
          <div style={{ color: 'var(--sub)', fontSize: 14 }}>
            {isHR ? 'Schedule interviews from the Candidates page.' : 'Interviews scheduled by HR will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myIVs.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).map(iv => (
            <div key={iv.id} className={`interview-slot ${iv.status}`}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${statusColor[iv.status]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {iv.status === 'accepted' ? '✅' : iv.status === 'declined' ? '❌' : iv.status === 'completed' ? '🎉' : '📅'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{iv.jobTitle}</div>
                <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
                  {isHR ? `With: ${iv.candidateName}` : `With: ${iv.hrName} @ ${iv.company}`}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, fontWeight: 600 }}>
                  📅 {new Date(iv.scheduledAt).toLocaleString()} · {iv.duration} min · {iv.mode}
                </div>
                {iv.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{iv.notes}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: `${statusColor[iv.status]}20`, color: statusColor[iv.status], textTransform: 'capitalize' }}>{iv.status}</span>
                {!isHR && iv.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-green" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => { updateInterview(iv.id, 'accepted'); toast('Interview accepted!') }}>Accept</button>
                    <button className="btn" style={{ fontSize: 11, padding: '5px 12px', background: 'rgba(239,68,68,.1)', color: '#F87171', border: '1px solid rgba(239,68,68,.2)' }} onClick={() => { updateInterview(iv.id, 'declined'); toast('Interview declined', 'info') }}>Decline</button>
                  </div>
                )}
                {isHR && iv.status === 'accepted' && (
                  <button className="btn" style={{ fontSize: 11, padding: '5px 12px', background: 'rgba(139,92,246,.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,.2)' }} onClick={() => { updateInterview(iv.id, 'completed'); toast('Marked as completed') }}>Mark Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────
function AuditLog({ auditLog }) {
  const sorted = [...auditLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return (
    <div>
      <PageHdr title="Audit Log" sub={`${sorted.length} recorded actions — full transparency trail`} />
      <div className="card">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
            <div>No actions logged yet.</div>
          </div>
        ) : sorted.map((log, i) => (
          <div key={log.id} className="audit-row" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="audit-dot" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{log.action}</div>
              <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{log.detail}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>{log.actorName}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{new Date(log.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// SKILL GAP ROADMAP MODAL
// ─────────────────────────────────────────────────────────────────
function SkillRoadmapModal({ missingSkills, onClose }) {
  const COURSES = {
    'Python': { icon: '🐍', courses: [{ name: 'Python for Everybody – Coursera', url: 'https://coursera.org/specializations/python' }, { name: 'Automate the Boring Stuff – Free', url: 'https://automatetheboringstuff.com' }] },
    'SQL': { icon: '🗄️', courses: [{ name: 'SQL for Data Science – Coursera', url: 'https://coursera.org/learn/sql-for-data-science' }, { name: 'Mode SQL Tutorial – Free', url: 'https://mode.com/sql-tutorial' }] },
    'Machine Learning': { icon: '🤖', courses: [{ name: 'ML Specialization – Andrew Ng (Coursera)', url: 'https://coursera.org/specializations/machine-learning-introduction' }, { name: 'Fast.ai Practical Deep Learning', url: 'https://fast.ai' }] },
    'TensorFlow': { icon: '⚡', courses: [{ name: 'TensorFlow Developer Certificate', url: 'https://coursera.org/professional-certificates/tensorflow-in-practice' }, { name: 'Official TensorFlow Tutorials', url: 'https://tensorflow.org/tutorials' }] },
    'AWS': { icon: '☁️', courses: [{ name: 'AWS Certified Cloud Practitioner', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner' }, { name: 'AWS Free Tier Hands-on', url: 'https://aws.amazon.com/free' }] },
    'Docker': { icon: '🐳', courses: [{ name: 'Docker for Beginners – YouTube', url: 'https://youtube.com/watch?v=fqMOX6JJhGo' }, { name: 'Play with Docker Labs', url: 'https://labs.play-with-docker.com' }] },
    'React': { icon: '⚛️', courses: [{ name: 'React Official Docs', url: 'https://react.dev/learn' }, { name: 'Full Stack Open – Free', url: 'https://fullstackopen.com/en' }] },
    'Data Structures': { icon: '🌲', courses: [{ name: 'DSA – GeeksForGeeks', url: 'https://geeksforgeeks.org/data-structures' }, { name: 'LeetCode Practice', url: 'https://leetcode.com' }] },
    'default': { icon: '📚', courses: [{ name: 'Search on Coursera', url: 'https://coursera.org' }, { name: 'YouTube tutorials', url: 'https://youtube.com' }] },
  }
  const getCourse = skill => {
    const key = Object.keys(COURSES).find(k => skill.toLowerCase().includes(k.toLowerCase()))
    return COURSES[key] || COURSES['default']
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>📈 Skill Gap Learning Roadmap</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>Curated resources for your missing skills</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Ic n="x" s={20} /></button>
        </div>
        <div className="modal-body">
          {missingSkills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--sub)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>No Skill Gaps!</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>You matched all the required skills for this role.</div>
            </div>
          ) : missingSkills.map(skill => {
            const { icon, courses } = getCourse(skill)
            return (
              <div key={skill} className="roadmap-item">
                <div className="roadmap-icon" style={{ background: 'rgba(239,68,68,.12)' }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{skill}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Recommended resources:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {courses.map((c, i) => (
                      <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="roadmap-link">
                        <Ic n="arr" s={12} /> {c.name}
                      </a>
                    ))}
                  </div>
                </div>
                <span className="tag tr" style={{ fontSize: 10, alignSelf: 'flex-start' }}>Missing</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// ALGORITHMIC RECOURSE ENGINE
// Finds the MINIMUM REALISTIC changes that cross the shortlist threshold.
// This is the core novelty — no ATS in the world does this.
// ─────────────────────────────────────────────────────────────────

const RECOURSE_THRESHOLD = 85   // shortlist threshold % — strong candidates bar

// Skill effort/resource database
const SKILL_RECOURSE_DB = {
  'aws':              { effort:'2–3 weeks', icon:'☁️',  resource:'AWS Cloud Practitioner – aws.amazon.com/certification', url:'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
  'docker':           { effort:'1–2 weeks', icon:'🐳',  resource:'Play with Docker Labs – free hands-on', url:'https://labs.play-with-docker.com' },
  'kubernetes':       { effort:'3–4 weeks', icon:'⚙️',  resource:'Kubernetes Official Tutorial – k8s.io', url:'https://kubernetes.io/docs/tutorials/' },
  'python':           { effort:'3–4 weeks', icon:'🐍',  resource:'Python for Everybody – Coursera', url:'https://coursera.org/specializations/python' },
  'tensorflow':       { effort:'4–6 weeks', icon:'⚡',  resource:'TensorFlow Developer Certificate – Coursera', url:'https://coursera.org/professional-certificates/tensorflow-in-practice' },
  'pytorch':          { effort:'4–6 weeks', icon:'🔥',  resource:'Deep Learning with PyTorch – fast.ai', url:'https://fast.ai' },
  'machine learning': { effort:'8–12 weeks',icon:'🤖',  resource:'ML Specialization – Andrew Ng (Coursera)', url:'https://coursera.org/specializations/machine-learning-introduction' },
  'nlp':              { effort:'6–8 weeks', icon:'💬',  resource:'NLP Specialization – Coursera', url:'https://coursera.org/specializations/natural-language-processing' },
  'sql':              { effort:'1–2 weeks', icon:'🗄️',  resource:'SQL for Data Science – Coursera (free audit)', url:'https://coursera.org/learn/sql-for-data-science' },
  'spark':            { effort:'3–4 weeks', icon:'✨',  resource:'Apache Spark with Python – Udemy', url:'https://udemy.com/course/taming-big-data-with-apache-spark-hands-on/' },
  'kafka':            { effort:'2–3 weeks', icon:'📡',  resource:'Apache Kafka for Beginners – Udemy', url:'https://udemy.com/course/apache-kafka/' },
  'react':            { effort:'3–4 weeks', icon:'⚛️',  resource:'React Official Docs + Full Stack Open', url:'https://react.dev/learn' },
  'flask':            { effort:'1 week',    icon:'🌶️',  resource:'Flask Mega-Tutorial – miguelgrinberg.com', url:'https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world' },
  'fastapi':          { effort:'1 week',    icon:'🚀',  resource:'FastAPI Official Tutorial – fastapi.tiangolo.com', url:'https://fastapi.tiangolo.com/tutorial/' },
  'git':              { effort:'3–5 days',  icon:'🔀',  resource:'Git & GitHub – freeCodeCamp (YouTube)', url:'https://youtube.com/watch?v=RGOj5yH7evk' },
  'linux':            { effort:'1–2 weeks', icon:'🐧',  resource:'Linux Command Line – The Odin Project', url:'https://theodinproject.com/paths/foundations/courses/foundations' },
  'scikit-learn':     { effort:'2–3 weeks', icon:'🔬',  resource:'Scikit-learn Official Tutorials', url:'https://scikit-learn.org/stable/tutorial/' },
  'pandas':           { effort:'1–2 weeks', icon:'🐼',  resource:'Pandas Documentation + Kaggle Course', url:'https://kaggle.com/learn/pandas' },
  'power bi':         { effort:'2–3 weeks', icon:'📊',  resource:'Microsoft Power BI Learning Path', url:'https://learn.microsoft.com/en-us/training/powerplatform/power-bi' },
  'tableau':          { effort:'2–3 weeks', icon:'📈',  resource:'Tableau Public Free Training', url:'https://public.tableau.com/en-us/s/resources' },
  'default':          { effort:'2–4 weeks', icon:'📚',  resource:'Search on Coursera or YouTube', url:'https://coursera.org' },
}

// Tech skill weights — same as server scorer
const TECH_WEIGHTS = {
  'python':10,'javascript':10,'typescript':10,'java':10,'c++':9,'golang':9,
  'react':9,'angular':9,'vue':9,'nodejs':9,'django':9,'flask':8,'fastapi':8,'spring':8,
  'tensorflow':10,'pytorch':10,'keras':9,'scikit-learn':9,'scikit':9,
  'machine learning':10,'deep learning':10,'nlp':10,'computer vision':10,
  'data science':9,'data analysis':9,'statistics':8,
  'sql':9,'mysql':8,'postgresql':8,'mongodb':8,'redis':7,'nosql':8,
  'dbms':9,'database':8,'oracle':8,
  'pandas':8,'numpy':8,'spark':9,'hadoop':8,'kafka':8,'airflow':8,
  'tableau':8,'power bi':8,'excel':7,
  'aws':9,'azure':9,'gcp':9,'docker':9,'kubernetes':9,
  'cloud':8,'devops':8,'linux':7,'git':7,
  'rest api':8,'api':7,'feature engineering':9,
}

function computeRecourse(result, weights) {
  const score     = result?.matchScore || 0
  const dimScores = result?.dimensionScores || {}
  const missing   = result?.missingSkills   || []
  const gap       = RECOURSE_THRESHOLD - score

  if (gap <= 0) return null   // already above threshold

  const w = weights || { skills:0.40, experience:0.30, education:0.15, potential:0.15 }

  // Estimate total JD weight (denominator) from matched + missing skills
  const matched      = result?.matchedKeywords || []
  const allJDSkills  = [...matched.map(k=>k.split(' (via')[0].toLowerCase()), ...missing.map(k=>k.toLowerCase())]
  const totalJDWeight= allJDSkills.reduce((s,sk) => {
    const wt = Object.entries(TECH_WEIGHTS).find(([k]) => sk.includes(k) || k.includes(sk))
    return s + (wt?.[1] || 5)
  }, 0) || 100

  const paths = []

  // ── PATH TYPE 1: Add a missing skill ─────────────────────────────
  for (const skill of missing) {
    const sk     = skill.toLowerCase()
    const wt     = Object.entries(TECH_WEIGHTS).find(([k]) => sk.includes(k) || k.includes(sk))
    const swt    = wt?.[1] || 5
    // Impact on skills score: adding this skill raises skills% proportionally
    const skillsImpact = (swt / totalJDWeight) * 100
    // Impact on final score via skills weight
    const finalImpact  = skillsImpact * w.skills
    const newScore     = Math.min(97, score + finalImpact)
    const db           = Object.entries(SKILL_RECOURSE_DB).find(([k]) => sk.includes(k) || k.includes(sk))
    const info         = db?.[1] || SKILL_RECOURSE_DB['default']
    paths.push({
      type:        'skill',
      action:      `Add ${skill} to your skillset`,
      detail:      `This skill appears in the JD with weight ${swt}/10. Adding it raises your Skills score by ~${skillsImpact.toFixed(0)}%.`,
      impact:      finalImpact,
      newScore:    Math.round(newScore),
      effort:      info.effort,
      icon:        info.icon,
      resource:    info.resource,
      url:         info.url,
      clears:      newScore >= RECOURSE_THRESHOLD,
      dimension:   'Skills',
    })
  }

  // ── PATH TYPE 2: Experience boost ────────────────────────────────
  const expScore = dimScores.experience || 50
  if (expScore < 90) {
    // 1 year more experience → ~8% boost in experience dimension
    const expImpact   = 8 * w.experience
    const newScore    = Math.min(97, score + expImpact)
    paths.push({
      type:       'experience',
      action:     'Gain 6–12 more months of relevant experience',
      detail:     `Your experience score is ${expScore}%. Continuing in your current role for 6–12 months raises experience score by ~8%.`,
      impact:     expImpact,
      newScore:   Math.round(newScore),
      effort:     '6–12 months',
      icon:       '💼',
      resource:   'Continue at current role / take on more responsibilities',
      url:        null,
      clears:     newScore >= RECOURSE_THRESHOLD,
      dimension:  'Experience',
    })
  }

  // ── PATH TYPE 3: Education / Certification ────────────────────────
  const eduScore = dimScores.education || 50
  if (eduScore < 85) {
    const certImpact  = 9 * w.education
    const newScore    = Math.min(97, score + certImpact)
    paths.push({
      type:       'education',
      action:     'Earn an industry certification',
      detail:     `Your education score is ${eduScore}%. A relevant certification (AWS, Google, Microsoft, Coursera) adds ~9% to education score.`,
      impact:     certImpact,
      newScore:   Math.round(newScore),
      effort:     '2–6 weeks',
      icon:       '🎓',
      resource:   'AWS Cloud Practitioner / Google Data Analytics / Microsoft Azure Fundamentals',
      url:        'https://coursera.org/professional-certificates',
      clears:     newScore >= RECOURSE_THRESHOLD,
      dimension:  'Education',
    })
  }

  // ── PATH TYPE 4: Combination (fastest two skills) ─────────────────
  const skillPaths = paths.filter(p => p.type === 'skill').sort((a,b) => b.impact - a.impact)
  if (skillPaths.length >= 2) {
    const p1 = skillPaths[0], p2 = skillPaths[1]
    const combinedImpact = p1.impact + p2.impact
    const newScore       = Math.min(97, score + combinedImpact)
    if (!paths.some(p => p.type === 'skill' && p.clears)) {
      paths.push({
        type:       'combination',
        action:     `Learn ${skillPaths[0].action.replace('Add ','').replace(' to your skillset','')} + ${skillPaths[1].action.replace('Add ','').replace(' to your skillset','')}`,
        detail:     `Combining these two skills together closes the gap. Neither alone is enough, but both together push you above the shortlist threshold.`,
        impact:     combinedImpact,
        newScore:   Math.round(newScore),
        effort:     `${p1.effort} + ${p2.effort}`,
        icon:       '🎯',
        resource:   `${p1.resource}  |  ${p2.resource}`,
        url:        p1.url,
        clears:     newScore >= RECOURSE_THRESHOLD,
        dimension:  'Skills (combined)',
      })
    }
  }

  // Sort: paths that clear threshold first, then by impact desc
  paths.sort((a,b) => {
    if (a.clears && !b.clears) return -1
    if (!a.clears && b.clears) return 1
    return b.impact - a.impact
  })

  return {
    currentScore: score,
    threshold:    RECOURSE_THRESHOLD,
    gap:          Math.max(0, gap),
    paths:        paths.slice(0, 4),
  }
}

// ── RecourseModal UI component ────────────────────────────────────
function RecourseModal({ result, weights, candidateName, onClose }) {
  const recourse = computeRecourse(result, weights)

  if (!recourse) return null

  const effortColor = effort => {
    if (!effort) return '#6B7280'
    if (effort.includes('day') || effort === '1 week') return '#10B981'
    if (effort.includes('week')) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>🔑 Algorithmic Recourse Engine</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>
              Minimum changes needed to cross the shortlist threshold
              {candidateName ? ` — ${candidateName}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer' }}>
            <Ic n="x" s={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Score gap visualiser */}
          <div style={{ background:'rgba(128,128,128,.06)', borderRadius:12, padding:'16px 18px', marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:13, color:'var(--sub)', fontWeight:600 }}>Current Score</div>
              <div style={{ fontSize:13, color:'var(--sub)', fontWeight:600 }}>Shortlist Threshold</div>
            </div>
            <div style={{ position:'relative', height:10, background:'rgba(128,128,128,.12)', borderRadius:5, marginBottom:8 }}>
              {/* current score bar */}
              <div style={{ position:'absolute', left:0, top:0, height:'100%',
                width:`${recourse.currentScore}%`,
                background: recourse.currentScore >= RECOURSE_THRESHOLD
                  ? 'linear-gradient(90deg,#10B981,#34D399)'
                  : 'linear-gradient(90deg,#EF4444,#F87171)',
                borderRadius:5, transition:'width 1s ease' }} />
              {/* threshold marker */}
              <div style={{ position:'absolute', top:'-4px', left:`${RECOURSE_THRESHOLD}%`,
                width:3, height:18, background:'#F59E0B', borderRadius:2, transform:'translateX(-50%)' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:800, fontSize:24, fontFamily:'var(--mono)',
                color: recourse.currentScore >= RECOURSE_THRESHOLD ? '#10B981' : '#EF4444' }}>
                {recourse.currentScore}%
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#F59E0B', fontWeight:700 }}>
                  Gap: {recourse.gap.toFixed(1)} points needed
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:24, fontFamily:'var(--mono)', color:'#F59E0B' }}>
                {RECOURSE_THRESHOLD}%
              </div>
            </div>
          </div>

          {/* Recourse paths */}
          <div style={{ fontSize:13, fontWeight:700, color:'var(--sub)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.04em' }}>
            {recourse.paths.filter(p=>p.clears).length > 0
              ? `${recourse.paths.filter(p=>p.clears).length} Path${recourse.paths.filter(p=>p.clears).length>1?'s':''} to Cross the Threshold`
              : 'Best Paths to Improve Score'}
          </div>

          {recourse.paths.map((path, idx) => (
            <div key={idx} style={{
              border: `1px solid ${path.clears ? 'rgba(16,185,129,.3)' : 'rgba(128,128,128,.2)'}`,
              borderRadius:12, padding:'14px 16px', marginBottom:10,
              background: path.clears ? 'rgba(16,185,129,.05)' : 'rgba(128,128,128,.03)',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                {/* Rank + icon */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                  <div style={{ width:32, height:32, borderRadius:8,
                    background: path.clears ? 'rgba(16,185,129,.15)' : 'rgba(128,128,128,.1)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                    {path.icon}
                  </div>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>
                    Path {idx+1}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{path.action}</div>
                    {path.clears && (
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100,
                        background:'rgba(16,185,129,.15)', color:'#10B981', fontWeight:700, flexShrink:0 }}>
                        ✓ CLEARS THRESHOLD
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8, lineHeight:1.6 }}>
                    {path.detail}
                  </div>

                  {/* Stats row */}
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
                    <div style={{ fontSize:11, padding:'3px 10px', borderRadius:6,
                      background:'rgba(59,130,246,.1)', color:'#60A5FA', fontWeight:600 }}>
                      📊 +{path.impact.toFixed(1)}pts → {path.newScore}%
                    </div>
                    <div style={{ fontSize:11, padding:'3px 10px', borderRadius:6,
                      background:`${effortColor(path.effort)}18`, color:effortColor(path.effort), fontWeight:600 }}>
                      ⏱ {path.effort}
                    </div>
                    <div style={{ fontSize:11, padding:'3px 10px', borderRadius:6,
                      background:'rgba(139,92,246,.1)', color:'#A78BFA', fontWeight:600 }}>
                      🎯 {path.dimension}
                    </div>
                  </div>

                  {/* Resource link */}
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    📚 {path.url
                      ? <a href={path.url} target="_blank" rel="noopener noreferrer"
                          style={{ color:'#60A5FA', textDecoration:'none', fontWeight:600 }}>
                          {path.resource}
                        </a>
                      : <span style={{ fontStyle:'italic' }}>{path.resource}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Academic footnote */}
          <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8,
            background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.15)' }}>
            <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.7 }}>
              <strong style={{ color:'#A78BFA' }}>About Algorithmic Recourse:</strong> This feature implements
              counterfactual explanations with minimum perturbation (Wachter et al., 2017) — finding the smallest
              realistic change to a candidate's profile that crosses the shortlist threshold. Required under
              EU AI Act 2024 Article 86 (Right to Explanation) for high-stakes AI decisions.
              No commercial ATS implements this.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// INTERVIEW QUESTION GENERATOR MODAL
// ─────────────────────────────────────────────────────────────────
function InterviewQModal({ candidate, job, onClose, onSchedule }) {
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scheduleMode, setScheduleMode] = useState(false)
  const [form, setForm] = useState({ date: '', time: '', duration: '45', mode: 'Video Call', notes: '' })

  const generate = async () => {
    setLoading(true)
    try {
      const prompt = `Generate 8 specific interview questions for a ${job?.title || 'role'} position. 
Candidate matched keywords: ${candidate.matchedKeywords?.join(', ') || 'various skills'}.
Missing skills: ${candidate.missingSkills?.join(', ') || 'none'}.
Score: ${candidate.matchScore}%.
Return ONLY a JSON array of strings, no markdown, no preamble.
Example: ["Q1?","Q2?","Q3?"]`
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      setQuestions(parsed)
    } catch (e) {
      setQuestions([
        `Tell me about your experience with ${candidate.matchedKeywords?.[0] || 'your key skills'}.`,
        `How have you applied ${candidate.matchedKeywords?.[1] || 'your technical skills'} in past projects?`,
        `Describe a challenging project where you demonstrated ${candidate.matchedKeywords?.[2] || 'problem solving'}.`,
        `How would you approach learning ${candidate.missingSkills?.[0] || 'new technologies'}?`,
        'Where do you see yourself in 3 years?',
        'Describe your ideal work environment and team.',
        'What is your greatest professional achievement?',
        'Why are you interested in this specific role?',
      ])
    }
    setLoading(false)
  }

  useEffect(() => { generate() }, [])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>🎯 AI Interview Questions</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>For {candidate.candidateName} · {job?.title || 'Role'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Ic n="x" s={20} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ color: 'var(--sub)', fontSize: 14 }}>Generating tailored questions with AI…</div>
            </div>
          ) : questions && !scheduleMode ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {questions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--card2)', border: '1px solid var(--bord)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(139,92,246,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--purple)', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{q}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn btn-g" onClick={generate} style={{ fontSize: 12 }}>🔄 Regenerate</button>
                <button className="btn btn-hr" onClick={() => setScheduleMode(true)} style={{ flex: 1 }}>
                  <Ic n="phone" s={13} /> Schedule Interview
                </button>
              </div>
            </>
          ) : scheduleMode ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📅 Schedule Interview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><Lbl>Date</Lbl><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%', padding: '10px 14px' }} /></div>
                <div><Lbl>Time</Lbl><input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} style={{ width: '100%', padding: '10px 14px' }} /></div>
                <div><Lbl>Duration (minutes)</Lbl><select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} style={{ width: '100%', padding: '10px 14px' }}>
                  {['30', '45', '60', '90'].map(d => <option key={d}>{d}</option>)}
                </select></div>
                <div><Lbl>Mode</Lbl><select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))} style={{ width: '100%', padding: '10px 14px' }}>
                  {['Video Call', 'Phone Call', 'In Person', 'WhatsApp'].map(m => <option key={m}>{m}</option>)}
                </select></div>
                <div style={{ gridColumn: '1/-1' }}><Lbl>Notes (optional)</Lbl><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Join via Google Meet link..." style={{ width: '100%', padding: '10px 14px', minHeight: 60, resize: 'vertical' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                <button className="btn btn-g" onClick={() => setScheduleMode(false)}>← Back</button>
                <button className="btn btn-hr" style={{ flex: 1 }} onClick={() => {
                  if (!form.date || !form.time) { alert('Please select date and time'); return }
                  onSchedule({ ...form, questions })
                }}>
                  <Ic n="send" s={13} /> Send Interview Invite
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// EXPORT PDF helper
// ─────────────────────────────────────────────────────────────────
function exportToPDF(title, data) {
  const html = `
    <html><head><title>${title}</title>
    <style>body{font-family:sans-serif;padding:24px;color:#111;} h1{font-size:22px;margin-bottom:4px;} 
    .sub{color:#555;font-size:13px;margin-bottom:24px;} table{width:100%;border-collapse:collapse;font-size:12px;}
    th{background:#f1f5f9;padding:10px 14px;text-align:left;font-weight:700;border-bottom:2px solid #e2e8f0;}
    td{padding:10px 14px;border-bottom:1px solid #f0f0f0;} .score{font-weight:700;font-family:monospace;}
    .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;}
    .green{background:#dcfce7;color:#166534;} .blue{background:#dbeafe;color:#1e3a5f;} .yellow{background:#fef9c3;color:#854d0e;}
    </style></head>
    <body>
    <h1>${title}</h1>
    <div class="sub">Generated by FairRank AI · ${new Date().toLocaleString()}</div>
    <table>
      <tr><th>#</th><th>Candidate</th><th>Job</th><th>Score</th><th>Recommendation</th><th>Status</th><th>Applied</th></tr>
      ${data.map((a, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${a.candidateName || '—'}</td>
          <td>${a.jobTitle || '—'} @ ${a.company || '—'}</td>
          <td class="score">${a.matchScore || 0}%</td>
          <td><span class="badge ${a.matchScore >= 80 ? 'green' : a.matchScore >= 60 ? 'blue' : 'yellow'}">${a.recommendation || '—'}</span></td>
          <td>${a.status || '—'}</td>
          <td>${a.appliedAt || '—'}</td>
        </tr>`).join('')}
    </table>
    </body></html>`
  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.print()
}

// ─────────────────────────────────────────────────────────────────
// HR DASHBOARD
// ─────────────────────────────────────────────────────────────────
function HDash({ db, user, go, myJobs, myJobApps }) {
  const avg = myJobApps.length ? Math.round(myJobApps.reduce((s, a) => s + (a.matchScore || 0), 0) / myJobApps.length) : 0
  const sl = myJobApps.filter(a => a.status === 'shortlisted').length
  const perJob = myJobs.map(j => ({
    name: j.title.split(' ').slice(0, 2).join(' '),
    apps: myJobApps.filter(a => a.jobId === j.id).length,
    avg: (() => { const a = myJobApps.filter(x => x.jobId === j.id); return a.length ? Math.round(a.reduce((s, x) => s + (x.matchScore || 0), 0) / a.length) : 0 })()
  }))
  const statusPie = [
    { name: 'Pending', value: myJobApps.filter(a => a.status === 'pending').length, color: '#F59E0B' },
    { name: 'Reviewed', value: myJobApps.filter(a => a.status === 'reviewed').length, color: '#3B82F6' },
    { name: 'Shortlisted', value: myJobApps.filter(a => a.status === 'shortlisted').length, color: '#10B981' },
  ].filter(d => d.value > 0)
  const scoreHist = [
    { r: '90-100', n: myJobApps.filter(a => (a.matchScore || 0) >= 90).length },
    { r: '80-89', n: myJobApps.filter(a => (a.matchScore || 0) >= 80 && (a.matchScore || 0) < 90).length },
    { r: '70-79', n: myJobApps.filter(a => (a.matchScore || 0) >= 70 && (a.matchScore || 0) < 80).length },
    { r: '<70', n: myJobApps.filter(a => (a.matchScore || 0) < 70).length },
  ]
  const recPie = [
    { name: 'Strong Rec', value: myJobApps.filter(a => a.recommendation === 'Strong Recommend').length, color: '#10B981' },
    { name: 'Recommend', value: myJobApps.filter(a => a.recommendation === 'Recommend').length, color: '#3B82F6' },
    { name: 'Consider', value: myJobApps.filter(a => a.recommendation === 'Consider').length, color: '#F59E0B' },
    { name: 'No', value: myJobApps.filter(a => a.recommendation === 'Not Recommended').length, color: '#EF4444' },
  ].filter(d => d.value > 0)
  const timeline = [
    { w: 'Wk1', apps: 3, sl: 1 }, { w: 'Wk2', apps: 5, sl: 2 },
    { w: 'Wk3', apps: Math.min(7, myJobApps.length), sl: Math.min(3, sl) },
    { w: 'Wk4', apps: myJobApps.length, sl }
  ]

  return (
    <div className="fu">
      <PageHdr title="HR Analytics Dashboard" sub={`${user.company} · Real-time recruitment intelligence`}>
        <button className="btn btn-g" onClick={() => go('h-msgs')}><Ic n="mail" s={14} /> Messages</button>
        <button className="btn btn-g" style={{ color: 'var(--green)', borderColor: 'rgba(16,185,129,.3)' }} onClick={() => exportToPDF(`${user.company} — Candidate Rankings`, myJobApps)}><Ic n="down" s={14} /> Export PDF</button>
        <button className="btn btn-hr" onClick={() => go('h-post')}><Ic n="plus" s={14} /> Post New Job</button>
      </PageHdr>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Jobs Posted', v: myJobs.length, ic: 'brief', col: '#3B82F6' },
          { l: 'Total Applicants', v: myJobApps.length, ic: 'users', col: '#8B5CF6' },
          { l: 'Shortlisted', v: sl, ic: 'award', col: '#10B981' },
          { l: 'Avg AI Score', v: `${avg}%`, ic: 'spark', col: '#F59E0B' },
          { l: 'File Resumes', v: myJobApps.filter(a => a.resumeFileName).length, ic: 'file', col: '#06B6D4' },
        ].map(({ l, v, ic, col }) => (
          <div key={l} className="statcard fu">
            <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 14px 0 60px', background: `${col}10` }} />
            <Ic n={ic} s={18} c={col} />
            <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--mono)', marginTop: 10, color: 'var(--text)' }}>{v}</div>
            <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }} className="chart-grid">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Applications & Avg Score per Job</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perJob} barGap={6} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="l" tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} />
              <Bar yAxisId="l" dataKey="apps" name="Applicants" fill="#3B82F6" radius={[5, 5, 0, 0]} />
              <Bar yAxisId="r" dataKey="avg" name="Avg Score" fill="#10B981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Pipeline Status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={statusPie} cx="50%" cy="44%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value">{statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
              <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, color: 'var(--sub)' }} /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }} className="chart-grid">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Score Histogram</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreHist} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="r" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="n" name="Candidates" radius={[7, 7, 0, 0]}>{scoreHist.map((_, i) => <Cell key={i} fill={['#10B981', '#3B82F6', '#8B5CF6', '#EF4444'][i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>AI Recommendations</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={recPie} cx="50%" cy="46%" outerRadius={80} paddingAngle={2} dataKey="value">{recPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
              <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Recruitment Timeline</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" />
              <XAxis dataKey="w" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} />
              <Line type="monotone" dataKey="apps" name="Total" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 5, fill: '#3B82F6' }} />
              <Line type="monotone" dataKey="sl" name="Shortlisted" stroke="#10B981" strokeWidth={2.5} dot={{ r: 5, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Top Candidates by AI Score</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-g" style={{ fontSize: 12 }} onClick={() => exportToPDF('Top Candidates', [...myJobApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 10))}>
              <Ic n="down" s={12} /> Export Top 10
            </button>
            <button className="btn btn-s" onClick={() => go('h-cands')} style={{ fontSize: 12 }}>View All <Ic n="arr" s={12} /></button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...myJobApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 6).map((app, i) => (
            <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(128,128,128,.04)', border: '1px solid var(--bord)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 11, fontWeight: 700, background: i === 0 ? '#F59E0B20' : 'rgba(128,128,128,.07)', color: i === 0 ? '#F59E0B' : 'var(--muted)', flexShrink: 0 }}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{app.candidateName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{app.jobTitle} · {app.appliedAt}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, height: 5, background: 'rgba(128,128,128,.1)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${app.matchScore || 0}%`, background: (app.matchScore || 0) >= 80 ? '#10B981' : '#F59E0B', borderRadius: 3 }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--mono)', color: (app.matchScore || 0) >= 80 ? '#10B981' : '#F59E0B', minWidth: 40 }}>{app.matchScore || 0}%</span>
                <span className={`tag ${app.recommendation === 'Strong Recommend' ? 'tg' : 'tb'}`} style={{ fontSize: 10 }}>{app.recommendation || app.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// HR CANDIDATES
// ─────────────────────────────────────────────────────────────────
function HCands({ db, user, myJobs, myJobApps, toast, updateAppStatus, addInterview, addMsg }) {
  const sorted = [...myJobApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  const [sel, setSel] = useState(sorted[0] || null)
  const [search, setSearch] = useState('')
  const [filt, setFilt] = useState('All')
  const [tab, setTab] = useState('score')
  const [ivModal, setIvModal] = useState(false)
  const [roadmapModal, setRoadmapModal] = useState(false)

  const filtered = sorted.filter(a => {
    const ms = !search || (a.candidateName || '').toLowerCase().includes(search.toLowerCase()) || (a.jobTitle || '').toLowerCase().includes(search.toLowerCase())
    const mf = filt === 'All' || a.status === filt || a.recommendation === filt
    return ms && mf
  })
  const radD = sel?.dimensionScores ? [
    { s: 'Skills', A: sel.dimensionScores.skills || 0 }, { s: 'Experience', A: sel.dimensionScores.experience || 0 },
    { s: 'Education', A: sel.dimensionScores.education || 0 }, { s: 'Potential', A: sel.dimensionScores.potential || 0 },
  ] : []
  const barD = sel?.dimensionScores ? [
    { n: 'Skills', v: sel.dimensionScores.skills || 0, f: '#3B82F6' }, { n: 'Experience', v: sel.dimensionScores.experience || 0, f: '#10B981' },
    { n: 'Education', v: sel.dimensionScores.education || 0, f: '#8B5CF6' }, { n: 'Potential', v: sel.dimensionScores.potential || 0, f: '#F59E0B' },
  ] : []

  const renderFile = app => {
    if (!app?.resumeFileData && !app?.resumeFileName) return (
      <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 10, background: 'rgba(128,128,128,.04)', borderRadius: 12, border: '1px dashed var(--bord)' }}>
        <Ic n="file" s={32} c="var(--muted)" />
        <div style={{ fontSize: 13 }}>Text-only resume</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>{app?.resumeText?.slice(0, 200)}...</div>
      </div>
    )
    const ft = app.resumeFileType || ''
    if (app.resumeFileData && ft.startsWith('image/')) return (
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--bord)' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(128,128,128,.04)', borderBottom: '1px solid var(--bord)', fontSize: 12, color: 'var(--sub)' }}>🖼 {app.resumeFileName}</div>
        <img src={`data:${ft};base64,${app.resumeFileData}`} alt="Resume" style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', background: '#fff' }} />
      </div>
    )
    if (app.resumeFileData && ft === 'application/pdf') return (
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--bord)' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(128,128,128,.04)', borderBottom: '1px solid var(--bord)', fontSize: 12, color: 'var(--sub)' }}>📄 {app.resumeFileName}</div>
        <iframe src={`data:application/pdf;base64,${app.resumeFileData}`} style={{ width: '100%', height: 400, border: 'none', background: 'white' }} title="PDF" />
      </div>
    )
    return (
      <div style={{ borderRadius: 12, border: '1px solid var(--bord)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'rgba(128,128,128,.04)', borderBottom: '1px solid var(--bord)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{getFileIcon(app.resumeFileName || '')}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{app.resumeFileName}</span>
          <span className="tag tc" style={{ fontSize: 10 }}>Uploaded</span>
        </div>
        <div style={{ padding: 16, fontSize: 12, color: 'var(--sub)', lineHeight: 1.7, maxHeight: 320, overflowY: 'auto' }}>{app.resumeText || 'No text.'}</div>
      </div>
    )
  }

  const handleSchedule = ({ date, time, duration, mode, notes, questions }) => {
    if (!sel) return
    const iv = {
      id: `iv_${Date.now()}`,
      hrId: user.id, hrName: user.name, company: user.company,
      candidateId: sel.candidateId, candidateName: sel.candidateName,
      jobId: sel.jobId, jobTitle: sel.jobTitle,
      scheduledAt: `${date}T${time}:00`,
      duration, mode, notes,
      questions: questions || [],
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    addInterview(iv)
    addMsg({
      id: `msg_${Date.now()}`, fromId: user.id, fromName: user.name, fromRole: 'hr',
      toId: sel.candidateId, toName: sel.candidateName, toRole: 'candidate',
      subject: `Interview Scheduled: ${sel.jobTitle}`,
      body: `Hi ${sel.candidateName},\n\nWe'd like to invite you for an interview for the ${sel.jobTitle} position at ${user.company}.\n\n📅 Date & Time: ${new Date(iv.scheduledAt).toLocaleString()}\n⏱ Duration: ${duration} minutes\n📱 Mode: ${mode}\n\n${notes ? `Notes: ${notes}\n\n` : ''}We look forward to speaking with you!\n\nBest regards,\n${user.name}`,
      timestamp: new Date().toISOString(), read: false
    })
    toast(`Interview scheduled with ${sel.candidateName}! 🎉`)
    setIvModal(false)
  }

  return (
    <div className="fu">
      {ivModal && sel && <InterviewQModal candidate={sel} job={myJobs.find(j => j.id === sel.jobId)} onClose={() => setIvModal(false)} onSchedule={handleSchedule} />}
      {roadmapModal && sel && <SkillRoadmapModal missingSkills={sel.missingSkills || []} onClose={() => setRoadmapModal(false)} />}

      <PageHdr title="Ranked Candidates" sub={`${sorted.length} total · Sorted by AI score`}>
        <button className="btn btn-g" style={{ fontSize: 12 }} onClick={() => exportToPDF(`${user.company} — Ranked Candidates`, filtered)}>
          <Ic n="down" s={13} /> Export PDF
        </button>
      </PageHdr>

      <div style={{ display: 'flex', gap: 9, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}><Ic n="search" s={13} /></div>
          <input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 33, paddingTop: 9, paddingBottom: 9, paddingRight: 14, width: 240 }} />
        </div>
        {['All', 'pending', 'reviewed', 'shortlisted', 'Strong Recommend'].map(f => (
          <button key={f} onClick={() => setFilt(f)} className="btn" style={{ fontSize: 11, padding: '8px 13px', background: filt === f ? 'rgba(139,92,246,.12)' : 'rgba(128,128,128,.06)', color: filt === f ? 'var(--purple)' : 'var(--sub)', border: filt === f ? '1px solid rgba(139,92,246,.25)' : '1px solid var(--bord)' }}>{f}</button>
        ))}
        <span className="tag tc" style={{ marginLeft: 'auto', fontSize: 11 }}>{filtered.length} results</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: '76vh', overflowY: 'auto', paddingRight: 4 }}>
          {filtered.map((app, i) => (
            <div key={app.id} onClick={() => { setSel(app); setTab('score') }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 13, background: sel?.id === app.id ? 'rgba(139,92,246,.08)' : 'rgba(128,128,128,.04)', border: `1px solid ${sel?.id === app.id ? 'rgba(139,92,246,.3)' : 'var(--bord)'}`, cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 10, fontWeight: 700, background: i === 0 ? '#F59E0B20' : 'rgba(128,128,128,.07)', color: i === 0 ? '#F59E0B' : 'var(--muted)' }}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.candidateName || `Candidate ${i + 1}`}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle} {app.resumeFileName ? `· ${getFileIcon(app.resumeFileName)}` : '· text'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--mono)', color: (app.matchScore || 0) >= 80 ? '#10B981' : '#F59E0B' }}>{app.matchScore || 0}%</div>
                <span className={`tag ${app.fairnessFlag ? 'tr' : 'tg'}`} style={{ fontSize: 9 }}>{app.fairnessFlag ? '⚠Flag' : '✓Fair'}</span>
                {(app.matchScore||0) < RECOURSE_THRESHOLD && (app.matchScore||0) >= RECOURSE_THRESHOLD - 25 && (
                  <span style={{ fontSize:9, padding:'2px 6px', borderRadius:100, background:'rgba(245,158,11,.15)', color:'#F59E0B', fontWeight:700, whiteSpace:'nowrap' }}>🔑 1 change away</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {sel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                <ScoreRing score={sel.matchScore || 0} size={100} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>{sel.candidateName}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    <span className={`tag ${sel.recommendation === 'Strong Recommend' ? 'tg' : 'tb'}`}>{sel.recommendation || 'Review'}</span>
                    <span className={`tag ${sel.fairnessFlag ? 'tr' : 'tg'}`}>{sel.fairnessFlag ? '⚠ Bias' : '✓ Fair'}</span>
                    {sel.resumeFileName && <span className="tag tc">{getFileIcon(sel.resumeFileName)} {sel.resumeFileName}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--sub)', fontStyle: 'italic', lineHeight: 1.65 }}>"{sel.aiRationale}"</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>🏢 {sel.jobTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)' }}>📅 {sel.appliedAt}</div>
                  <select value={sel.status} onChange={e => { updateAppStatus(sel.id, e.target.value, user.name); setSel(s => ({ ...s, status: e.target.value })); toast(`Status → "${e.target.value}"`) }}
                    style={{ padding: '7px 12px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid rgba(139,92,246,.35)', background: 'rgba(139,92,246,.1)', color: 'var(--purple)', cursor: 'pointer', outline: 'none' }}>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button className="btn btn-hr" style={{ fontSize: 12 }} onClick={() => setIvModal(true)}><Ic n="phone" s={13} /> Interview + AI Questions</button>
                {(sel.missingSkills?.length > 0) && <button className="btn btn-g" style={{ fontSize: 12 }} onClick={() => setRoadmapModal(true)}>📈 Skill Roadmap</button>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, background: 'rgba(128,128,128,.06)', borderRadius: 10, padding: 4 }}>
              {[['score', '📊 Score & Charts'], ['resume', '📄 Resume File'], ['fairness', '🛡 Fairness Audit']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13, transition: 'all .2s', background: tab === k ? 'var(--purple)' : 'transparent', color: tab === k ? 'white' : 'var(--sub)' }}>{l}</button>
              ))}
            </div>

            {tab === 'score' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="card">
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Dimension Scores</div>
                    <ResponsiveContainer width="100%" height={180}><BarChart data={barD} barSize={32}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} /><XAxis dataKey="n" tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTip />} /><Bar dataKey="v" name="Score" radius={[5, 5, 0, 0]}>{barD.map((e, i) => <Cell key={i} fill={e.f} />)}</Bar></BarChart></ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Competency Radar</div>
                    <ResponsiveContainer width="100%" height={180}><RadarChart data={radD}><PolarGrid stroke="rgba(128,128,128,.12)" /><PolarAngleAxis dataKey="s" tick={{ fill: 'var(--sub)', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 8 }} /><Radar dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  {sel.dimensionScores && Object.entries(sel.dimensionScores).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--sub)' }}>{k}</span>
                        <span style={{ fontWeight: 800, fontFamily: 'var(--mono)', color: v >= 80 ? '#10B981' : '#F59E0B' }}>{v}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(128,128,128,.1)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${v}%`, background: `hsl(${v * 1.2},65%,52%)`, borderRadius: 3, transition: 'width 1.2s ease' }} />
                      </div>
                    </div>
                  ))}
                  {sel.matchedKeywords?.length > 0 && <div style={{ marginTop: 14 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', marginBottom: 7, textTransform: 'uppercase' }}>✓ Matched Keywords</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{sel.matchedKeywords.map(k => <span key={k} className="tag tg" style={{ fontSize: 10 }}>{k}</span>)}</div></div>}
                  {sel.missingSkills?.length > 0 && <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', marginBottom: 7, textTransform: 'uppercase' }}>✕ Missing Skills</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{sel.missingSkills.map(k => <span key={k} className="tag tr" style={{ fontSize: 10 }}>{k}</span>)}</div></div>}
                  {/* ── ALGORITHMIC RECOURSE for borderline candidates ── */}
                  {sel.matchScore < RECOURSE_THRESHOLD && sel.matchScore >= RECOURSE_THRESHOLD - 25 && (() => {
                    const rec = computeRecourse(sel, null)
                    if (!rec || rec.paths.length === 0) return null
                    const bestPath = rec.paths.find(p => p.clears) || rec.paths[0]
                    return (
                      <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10,
                        background:'rgba(245,158,11,.07)', border:'1px solid rgba(245,158,11,.3)' }}>
                        <div style={{ fontWeight:700, fontSize:12, color:'#F59E0B', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                          🔑 One Change Away
                          <span style={{ fontSize:9, padding:'1px 7px', borderRadius:100,
                            background:'rgba(139,92,246,.15)', color:'#A78BFA', fontWeight:700 }}>RECOURSE ENGINE</span>
                        </div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>
                          Gap: <strong style={{color:'#F59E0B'}}>{rec.gap.toFixed(1)}pts</strong> below shortlist threshold ({RECOURSE_THRESHOLD}%).
                          Fastest path to shortlist:
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8,
                          background: bestPath.clears ? 'rgba(16,185,129,.08)' : 'rgba(128,128,128,.06)',
                          border:`1px solid ${bestPath.clears?'rgba(16,185,129,.2)':'rgba(128,128,128,.12)'}` }}>
                          <span style={{ fontSize:16 }}>{bestPath.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:11, fontWeight:700 }}>{bestPath.action}</div>
                            <div style={{ fontSize:10, color:'var(--muted)' }}>⏱ {bestPath.effort} · +{bestPath.impact.toFixed(1)}pts → {bestPath.newScore}%</div>
                          </div>
                          {bestPath.clears && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:100,
                            background:'rgba(16,185,129,.15)', color:'#10B981', fontWeight:700 }}>✓ Shortlisted</span>}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
            {tab === 'resume' && (
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="file" s={15} c="var(--purple)" /> Resume — {sel.candidateName}</div>
                {renderFile(sel)}
                {sel.resumeFileData && (
                  <button className="btn btn-g" style={{ marginTop: 12, fontSize: 12 }} onClick={() => { const a = document.createElement('a'); a.href = `data:${sel.resumeFileType};base64,${sel.resumeFileData}`; a.download = sel.resumeFileName || 'resume'; a.click() }}>
                    <Ic n="down" s={13} /> Download Resume
                  </button>
                )}
              </div>
            )}
            {tab === 'fairness' && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 11, background: sel.fairnessFlag ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{sel.fairnessFlag ? '⚠️' : '🛡️'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Fairness Audit Report</div>
                    <div style={{ color: sel.fairnessFlag ? '#F87171' : '#34D399', fontSize: 13 }}>{sel.fairnessFlag ? 'Potential bias detected' : 'No bias detected — fair evaluation'}</div>
                  </div>
                </div>
                {[
                  ['PII Anonymization', '✓', 'Names, contacts, demographics stripped before scoring'],
                  ['Name Bias Check', sel.fairnessFlag ? '⚠' : '✓', 'Candidate name not factored into score'],
                  ['Gender Neutrality', sel.fairnessFlag ? '⚠' : '✓', 'No gender-coded language in scoring'],
                  ['Age Guard', sel.fairnessFlag ? '⚠' : '✓', 'Age evaluated neutrally'],
                  ['Demographic Parity', sel.fairnessFlag ? '⚠' : '✓', sel.fairnessNote]
                ].map(([check, status, note]) => (
                  <div key={check} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--bord)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: status === '✓' ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><span style={{ fontSize: 10 }}>{status}</span></div>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{check}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{note}</div></div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: status === '✓' ? '#10B981' : '#EF4444' }}>{status === '✓' ? 'PASS' : 'FLAG'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// HR JOBS (unchanged from original)
// ─────────────────────────────────────────────────────────────────
function HJobs({ db, user, myJobs, myJobApps, go }) {
  return (
    <div className="fu">
      <PageHdr title="My Job Listings" sub={`${myJobs.length} active positions at ${user.company}`}>
        <button className="btn btn-hr" onClick={() => go('h-post')}><Ic n="plus" s={14} /> Post New Job</button>
      </PageHdr>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {myJobs.map(job => {
          const apps = myJobApps.filter(a => a.jobId === job.id)
          const topScore = apps.length ? Math.max(...apps.map(a => a.matchScore || 0)) : 0
          const sl = apps.filter(a => a.status === 'shortlisted').length
          return (
            <div key={job.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{job.title}</div><div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{job.category} · {job.type}</div></div>
                <span className="tag tg" style={{ fontSize: 10, alignSelf: 'flex-start' }}>Active</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 6 }}>📍 {job.location}</div>
              <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginBottom: 14 }}>💰 {job.salary}</div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                {[{ l: 'Applicants', v: apps.length, c: 'var(--blue)' }, { l: 'Top Score', v: `${topScore}%`, c: '#10B981' }, { l: 'Shortlisted', v: sl, c: '#F59E0B' }].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 22, color: c, fontFamily: 'var(--mono)' }}>{v}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{l}</div></div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>{job.skills.slice(0, 3).map(s => <span key={s} className="tag tb" style={{ fontSize: 10 }}>{s}</span>)}</div>
              <button className="btn btn-s" onClick={() => go('h-cands')} style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}>View Candidates <Ic n="arr" s={12} /></button>
            </div>
          )
        })}
        {myJobs.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <Ic n="brief" s={40} c="var(--muted)" />
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 16, marginBottom: 12 }}>No Jobs Posted Yet</div>
            <button className="btn btn-hr" onClick={() => go('h-post')}><Ic n="plus" s={14} /> Post Your First Job</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// HR POST JOB
// ─────────────────────────────────────────────────────────────────
function HPostJob({ user, addJob, go, toast }) {
  const [form, setForm] = useState({ title: '', category: 'Technology', location: '', type: 'Full-time', salary: '', description: '', skills: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const cats = ['Technology', 'AI/ML', 'Analytics', 'Finance', 'Security', 'Management', 'Design', 'Marketing', 'Healthcare', 'Other']
  const types = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid']
  const submit = () => {
    setErr('')
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) { setErr('Title, Location and Description are required.'); return }
    setLoading(true)
    setTimeout(() => {
      addJob({ id: `j_${Date.now()}`, hrId: user.id, title: form.title.trim(), company: user.company, category: form.category, location: form.location.trim(), type: form.type, salary: form.salary || 'Competitive', description: form.description.trim(), skills: form.skills.split(',').map(s => s.trim()).filter(Boolean), postedAt: new Date().toISOString().split('T')[0] })
      toast(`"${form.title}" published! 🎉`); go('h-jobs'); setLoading(false)
    }, 700)
  }
  return (
    <div className="fu" style={{ maxWidth: 820 }}>
      <PageHdr title="Post a New Job" sub="Candidates can find and apply from the Job Board">
        <button className="btn btn-g" onClick={() => go('h-jobs')}>← Back to Jobs</button>
      </PageHdr>
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[{ k: 'title', l: 'Job Title *', ph: 'Senior Software Engineer', full: true }, { k: 'location', l: 'Location *', ph: 'Hyderabad / Remote', full: false }, { k: 'salary', l: 'Salary Range', ph: '₹18-28 LPA', full: false }].map(({ k, l, ph, full }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : 'auto' }}>
              <Lbl>{l}</Lbl>
              <input placeholder={ph} value={form[k]} onChange={e => { setForm(p => ({ ...p, [k]: e.target.value })); setErr('') }} style={{ padding: '10px 14px', width: '100%' }} />
            </div>
          ))}
          {[{ k: 'category', l: 'Category', opts: cats }, { k: 'type', l: 'Job Type', opts: types }].map(({ k, l, opts }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Lbl>{l}</Lbl>
              <select value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ padding: '10px 14px', width: '100%' }}>{opts.map(o => <option key={o}>{o}</option>)}</select>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
            <Lbl>Job Description & Requirements *</Lbl>
            <textarea placeholder="Describe the role, responsibilities, and qualifications..." value={form.description} onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setErr('') }} style={{ padding: '12px 14px', minHeight: 200, resize: 'vertical', lineHeight: 1.7, fontSize: 13, width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1/-1' }}>
            <Lbl>Key Skills (comma-separated)</Lbl>
            <input placeholder="Python, ML, AWS, React..." value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} style={{ padding: '10px 14px', width: '100%' }} />
          </div>
        </div>
        {err && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#F87171', fontSize: 13 }}>⚠ {err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-g" onClick={() => go('h-jobs')}>Cancel</button>
          <button className="btn btn-hr" onClick={submit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <Spin /> : <><Ic n="send" s={14} /> Publish Job Listing</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// CANDIDATE DASHBOARD
// ─────────────────────────────────────────────────────────────────
function CDash({ user, go, myApps, jobs }) {
  const avg = myApps.length ? Math.round(myApps.reduce((s, a) => s + (a.matchScore || 0), 0) / myApps.length) : 0
  const sl = myApps.filter(a => a.status === 'shortlisted').length
  const trendData = myApps.slice(-8).map((a, i) => ({ name: `#${i + 1}`, score: a.matchScore || 0, job: (jobs.find(j => j.id === a.jobId)?.title || 'Job').split(' ').slice(0, 2).join(' ') }))

  return (
    <div className="fu">
      <PageHdr title={`Welcome back, ${user.name.split(' ')[0]}! 👋`} sub="Candidate Dashboard · Track your applications & AI scores">
        <button className="btn btn-p" onClick={() => go('c-analyze')}><Ic n="spark" s={14} /> Analyze Resume</button>
        <button className="btn btn-g" onClick={() => go('c-jobs')}><Ic n="brief" s={14} /> Browse Jobs</button>
      </PageHdr>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Applications', v: myApps.length, ic: 'send', col: '#3B82F6', s: 'Total sent' },
          { l: 'Avg AI Score', v: `${avg}%`, ic: 'spark', col: '#10B981', s: 'Match score' },
          { l: 'Shortlisted', v: sl, ic: 'award', col: '#F59E0B', s: 'By HR teams' },
          { l: 'Open Jobs', v: jobs.length, ic: 'brief', col: '#8B5CF6', s: 'Available now' },
        ].map(({ l, v, ic, col, s }) => (
          <div key={l} className="statcard fu">
            <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 14px 0 60px', background: `${col}10` }} />
            <Ic n={ic} s={18} c={col} />
            <div style={{ fontWeight: 800, fontSize: 28, fontFamily: 'var(--mono)', marginTop: 10 }}>{v}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{l}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }} className="chart-grid">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>AI Score Trend</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Match scores across your recent applications</div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs><linearGradient id="csg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" />
                <XAxis dataKey="job" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="score" stroke="#3B82F6" fill="url(#csg)" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 10 }}>
              <Ic n="chart" s={36} c="var(--muted)" />
              <div style={{ fontSize: 13 }}>Apply to jobs to see your score trend</div>
              <button className="btn btn-s" onClick={() => go('c-jobs')} style={{ fontSize: 12 }}>Browse Jobs →</button>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { ic: 'spark', l: 'Resume Scorer', s: 'PDF/PNG/JPG/DOC support', col: '#3B82F6', pg: 'c-analyze' },
              { ic: 'file', l: 'Resume Builder', s: '3 professional templates', col: '#10B981', pg: 'c-build' },
              { ic: 'brief', l: 'Browse Jobs', s: `${jobs.length} open roles`, col: '#8B5CF6', pg: 'c-jobs' },
              { ic: 'phone', l: 'My Interviews', s: 'View schedules & accept', col: '#F59E0B', pg: 'c-interviews' },
              { ic: 'mail', l: 'Messages', s: 'Chat with HR contacts', col: '#06B6D4', pg: 'c-msgs' },
            ].map(({ ic, l, s, col, pg }) => (
              <div key={l} onClick={() => go(pg)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: 'rgba(128,128,128,.04)', border: '1px solid var(--bord)', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,128,128,.09)'; e.currentTarget.style.borderColor = col + '40' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(128,128,128,.04)'; e.currentTarget.style.borderColor = 'var(--bord)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic n={ic} s={16} c={col} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{s}</div></div>
                <Ic n="arr" s={13} c="var(--muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Applications</div>
          <button className="btn btn-s" onClick={() => go('c-apps')} style={{ fontSize: 12 }}>View All →</button>
        </div>
        {myApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
            <Ic n="brief" s={32} c="var(--muted)" />
            <div style={{ marginTop: 12, fontSize: 13 }}>No applications yet. <span style={{ color: 'var(--blue)', cursor: 'pointer' }} onClick={() => go('c-jobs')}>Browse jobs →</span></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {myApps.slice(0, 6).map(app => {
              const sc = app.matchScore || 0
              return (
                <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(128,128,128,.04)', border: '1px solid var(--bord)' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{app.jobTitle || 'Application'}</div><div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{app.company} · {app.appliedAt}</div></div>
                  <span className={`tag ${sc >= 80 ? 'tg' : sc >= 60 ? 'to' : 'tr'}`} style={{ fontSize: 11 }}>{sc}%</span>
                  <span className={`tag ${app.status === 'shortlisted' ? 'tg' : app.status === 'reviewed' ? 'tb' : 'to'}`} style={{ fontSize: 10 }}>{app.status}</span>
                  {app.resumeFileName && <span className="tag tc" style={{ fontSize: 10 }}>{getFileIcon(app.resumeFileName)}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// CANDIDATE AI ANALYZER (with skill roadmap)
// ─────────────────────────────────────────────────────────────────
function CAnalyze({ user, jobs, toast, addApp }) {
  const [jdMode, setJdMode] = useState('paste'), [jd, setJd] = useState(''), [selJob, setSelJob] = useState('')
  const [inputMode, setInputMode] = useState('file'), [file, setFile] = useState(null), [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false), [result, setResult] = useState(null), [dragOver, setDragOver] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showRecourse, setShowRecourse] = useState(false)

  const ACCEPT = 'application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  const analyze = async () => {
    const jdFinal = jdMode === 'job' ? (jobs.find(j => j.id === selJob)?.description || '') : jd
    if (!jdFinal.trim()) { toast('Please provide a job description', 'error'); return }
    if (inputMode === 'file' && !file) { toast('Please upload a resume file', 'error'); return }
    if (inputMode === 'text' && !resumeText.trim()) { toast('Please paste your resume text', 'error'); return }
    setLoading(true); setResult(null)
    try {
      const r = inputMode === 'file' ? await analyzeWithFile(jdFinal, file, resumeText) : await analyzeWithText(jdFinal, resumeText)
      setResult(r); toast('Analysis complete! ✓')
    } catch (e) { toast('Analysis failed: ' + e.message, 'error') }
    finally { setLoading(false) }
  }
  const barD = result ? [{ name: 'Skills', v: result.dimensionScores?.skills || 0, f: '#3B82F6' }, { name: 'Experience', v: result.dimensionScores?.experience || 0, f: '#10B981' }, { name: 'Education', v: result.dimensionScores?.education || 0, f: '#8B5CF6' }, { name: 'Potential', v: result.dimensionScores?.potential || 0, f: '#F59E0B' }] : []
  const radD = result ? [{ s: 'Skills', A: result.dimensionScores?.skills || 0 }, { s: 'Experience', A: result.dimensionScores?.experience || 0 }, { s: 'Education', A: result.dimensionScores?.education || 0 }, { s: 'Potential', A: result.dimensionScores?.potential || 0 }] : []

  return (
    <div className="fu">
      {showRoadmap && result && <SkillRoadmapModal missingSkills={result.missingSkills || []} onClose={() => setShowRoadmap(false)} />}
      {showRecourse && result && <RecourseModal result={result} weights={null} onClose={() => setShowRecourse(false)} />}
      <PageHdr title="Resume Scorer" sub="Upload PDF/PNG/JPG/DOC or paste text · Bias-free scoring · Algorithmic Recourse" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }} className="two-col">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="brief" s={14} c="var(--blue)" /> Job Description</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 13 }}>
            {[['paste', 'Paste JD'], ['job', 'Select Job']].map(([m, l]) => (
              <button key={m} onClick={() => setJdMode(m)} className="btn" style={{ fontSize: 12, padding: '7px 13px', background: jdMode === m ? 'rgba(59,130,246,.12)' : 'rgba(128,128,128,.06)', color: jdMode === m ? 'var(--blue)' : 'var(--sub)', border: jdMode === m ? '1px solid rgba(59,130,246,.25)' : '1px solid var(--bord)' }}>{l}</button>
            ))}
          </div>
          {jdMode === 'job' ? (
            <>
              <select value={selJob} onChange={e => setSelJob(e.target.value)} style={{ width: '100%', padding: '10px 14px', marginBottom: 10 }}>
                <option value="">-- Select a posted job --</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} @ {j.company}</option>)}
              </select>
              {selJob && <div style={{ padding: 12, borderRadius: 10, background: 'rgba(128,128,128,.04)', fontSize: 12, color: 'var(--sub)', lineHeight: 1.7, maxHeight: 160, overflowY: 'auto' }}>{jobs.find(j => j.id === selJob)?.description}</div>}
            </>
          ) : (
            <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job description here..." style={{ width: '100%', minHeight: 220, padding: 14, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
          )}
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="file" s={14} c="var(--green)" /> Resume Input</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {[['file', '📎 File'], ['text', '📝 Text']].map(([m, l]) => (
              <button key={m} onClick={() => setInputMode(m)} className="btn" style={{ fontSize: 12, padding: '7px 13px', background: inputMode === m ? 'rgba(16,185,129,.12)' : 'rgba(128,128,128,.06)', color: inputMode === m ? '#34D399' : 'var(--sub)', border: inputMode === m ? '1px solid rgba(16,185,129,.25)' : '1px solid var(--bord)' }}>{l}</button>
            ))}
          </div>
          {inputMode === 'file' ? (
            <>
              <div className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                onClick={() => document.getElementById('analyzeFileInput')?.click()}>
                <input id="analyzeFileInput" type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                <div style={{ fontSize: 30, marginBottom: 10 }}>📎</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{file ? 'Change File' : 'Drop your resume here'}</div>
                <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 8 }}>or click to browse</div>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>{['PDF', 'PNG', 'JPG', 'DOC', 'DOCX'].map(t => <span key={t} className="tag tb" style={{ fontSize: 10 }}>{t}</span>)}</div>
              </div>
              {file && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(128,128,128,.05)', border: '1px solid var(--bord)' }}>
                <span style={{ fontSize: 20 }}>{getFileIcon(file.name)}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{(file.size / 1024).toFixed(1)} KB</div></div>
                <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}><Ic n="x" s={13} /></button>
              </div>}
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Optionally supplement with text..." style={{ width: '100%', minHeight: 60, padding: 10, marginTop: 10, resize: 'vertical', fontSize: 12, lineHeight: 1.6 }} />
            </>
          ) : (
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste resume — skills, experience, education..." style={{ width: '100%', minHeight: 280, padding: 14, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button className="btn btn-p" onClick={analyze} disabled={loading} style={{ padding: '13px 50px', fontSize: 15, gap: 10 }}>
          {loading ? <><Spin /> Analyzing...</> : <><Ic n="spark" s={16} /> Analyze Resume</>}
        </button>
      </div>
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={100} />)}
        </div>
      )}
      {result && !loading && (
        <div className="fu">
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <ScoreRing score={result.matchScore} size={110} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>Analysis Complete</div>
                  <span className={`tag ${result.matchScore >= 80 ? 'tg' : result.matchScore >= 60 ? 'to' : 'tr'}`}>{result.recommendationLevel}</span>
                  <span className={`tag ${result.fairnessFlag ? 'tr' : 'tg'}`}>{result.fairnessFlag ? '⚠ Bias Detected' : '✓ Fairness Pass'}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 10, fontStyle: 'italic' }}>"{result.aiRationale}"</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{result.topSkills?.map(s => <span key={s} className="tag tb" style={{ fontSize: 11 }}>{s}</span>)}</div>
              </div>
              {result.missingSkills?.length > 0 && (
                <button className="btn" style={{ background: 'rgba(239,68,68,.1)', color: '#b91c1c', border: '1px solid rgba(185,28,28,.25)' }} onClick={() => setShowRoadmap(true)}>
                  📈 View Skill Roadmap
                </button>
              )}
              <button className="btn" style={{ background:'rgba(245,158,11,.1)', color:'#b45309', border:'1px solid rgba(180,83,9,.3)', fontWeight:700 }}
                onClick={() => setShowRecourse(true)}>
                🔑 {result.matchScore < RECOURSE_THRESHOLD ? 'How to Get Shortlisted' : 'Score Breakdown & Recourse'}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Dimension Scores</div>
              <ResponsiveContainer width="100%" height={200}><BarChart data={barD} barSize={36}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} /><XAxis dataKey="name" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTip />} /><Bar dataKey="v" name="Score" radius={[6, 6, 0, 0]}>{barD.map((e, i) => <Cell key={i} fill={e.f} />)}</Bar></BarChart></ResponsiveContainer>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Competency Radar</div>
              <ResponsiveContainer width="100%" height={200}><RadarChart data={radD}><PolarGrid stroke="rgba(128,128,128,.12)" /><PolarAngleAxis dataKey="s" tick={{ fill: 'var(--sub)', fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 9 }} /><Radar dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, color: '#10B981', marginBottom: 4 }}>✓ Matched Keywords</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 11 }}>🟢 Exact · 🔵 Semantic match</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.matchedKeywords?.map(k => {
                  const isSemantic = k.toLowerCase().includes('(via ')
                  return <span key={k} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 600, background: isSemantic ? 'rgba(59,130,246,.13)' : 'rgba(16,185,129,.13)', color: isSemantic ? '#60A5FA' : '#34D399', border: `1px solid ${isSemantic ? 'rgba(59,130,246,.3)' : 'rgba(16,185,129,.3)'}` }}>{isSemantic ? '🔵' : '🟢'} {k}</span>
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#EF4444', marginBottom: 11 }}>✕ Skill Gaps</div>
                {result.missingSkills?.length > 0
                  ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{result.missingSkills.map(k => <span key={k} className="tag tr" style={{ fontSize: 11 }}>{k}</span>)}</div>
                  : <div style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>🎉 No critical gaps found!</div>}
              </div>
              <div className="card" style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#F59E0B', marginBottom: 8 }}>💡 AI Feedback</div>
                <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.7 }}>{result.overallFeedback}</div>
              </div>
            </div>

          {/* ── ALGORITHMIC RECOURSE INLINE PANEL — always visible ── */}
          {(() => {
            const isAbove = result.matchScore >= RECOURSE_THRESHOLD
            if (isAbove) {
              return (
                <div className="card" style={{ marginTop:16, border:'1px solid rgba(6,95,70,.25)', background:'rgba(6,95,70,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                    <div style={{ fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                      🏆 Algorithmic Recourse Engine
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(6,95,70,.15)', color:'#065f46', fontWeight:700 }}>ABOVE THRESHOLD</span>
                    </div>
                    <button className="btn" style={{ background:'rgba(6,95,70,.12)', color:'#065f46', border:'1px solid rgba(6,95,70,.3)', fontSize:12 }}
                      onClick={() => setShowRecourse(true)}>View Full Report →</button>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12, lineHeight:1.6 }}>
                    You scored <strong style={{color:'#065f46'}}>{result.matchScore}%</strong> — above the shortlist threshold of <strong style={{color:'#065f46'}}>{RECOURSE_THRESHOLD}%</strong>.
                    You are <strong style={{color:'#065f46'}}>already shortlisted</strong>. Here's what's keeping your score strong:
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { icon:'✅', label:`Skills: ${result.dimensionScores?.skills||result.matchScore}%`, sub:'Strong technical alignment with JD requirements', col:'#1e40af' },
                      { icon:'✅', label:`Experience: ${result.dimensionScores?.experience||result.matchScore}%`, sub:'Relevant work history meets JD requirements', col:'#065f46' },
                      { icon:'✅', label:`Education: ${result.dimensionScores?.education||result.matchScore}%`, sub:'Qualifications align with role requirements', col:'#6d28d9' },
                      { icon:'✅', label:`Potential: ${result.dimensionScores?.potential||result.matchScore}%`, sub:'Growth indicators and project portfolio strong', col:'#b45309' },
                    ].map((item,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10,
                        border:`1px solid ${item.col}22`, background:`${item.col}07` }}>
                        <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:12,color:item.col}}>{item.label}</div>
                          <div style={{fontSize:10.5,color:'var(--muted)',lineHeight:1.4}}>{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, padding:'8px 12px', borderRadius:8, background:'rgba(109,40,217,.07)', border:'1px solid rgba(109,40,217,.18)', fontSize:11, color:'#5b21b6', lineHeight:1.6 }}>
                    <strong>Algorithmic Recourse (Wachter et al. 2017):</strong> Score exceeds threshold — no recourse action required. This engine activates for scores below {RECOURSE_THRESHOLD}% to show exact minimum changes needed. EU AI Act 2024 Article 86 compliant.
                  </div>
                </div>
              )
            }
            const rec = computeRecourse(result, null)
            if (!rec || rec.paths.length === 0) return null
            const top3 = rec.paths.slice(0,3)
            return (
              <div className="card" style={{ marginTop:16, border:'1px solid rgba(180,83,9,.3)', background:'rgba(180,83,9,.04)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, display:'flex', alignItems:'center', gap:8 }}>
                      🔑 Algorithmic Recourse Engine
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(109,40,217,.15)', color:'#5b21b6', fontWeight:700 }}>NOVEL FEATURE</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                      You scored <strong style={{color:'#b91c1c'}}>{rec.currentScore}%</strong> — shortlist threshold is <strong style={{color:'#b45309'}}>{rec.threshold}%</strong>.
                      Gap: <strong style={{color:'#b45309'}}>{rec.gap.toFixed(1)} points</strong>. Minimum changes to get shortlisted:
                    </div>
                  </div>
                  <button className="btn" style={{ background:'rgba(180,83,9,.1)', color:'#b45309', border:'1px solid rgba(180,83,9,.3)', fontSize:12 }}
                    onClick={() => setShowRecourse(true)}>View Full Report →</button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {top3.map((path, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10,
                      border:`1px solid ${path.clears?'rgba(6,95,70,.25)':'rgba(128,128,128,.15)'}`,
                      background: path.clears?'rgba(6,95,70,.05)':'rgba(128,128,128,.03)' }}>
                      <div style={{ fontSize:20, flexShrink:0 }}>{path.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:2 }}>{path.action}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>⏱ {path.effort} · 📊 +{path.impact.toFixed(1)}pts → {path.newScore}%</div>
                      </div>
                      {path.clears
                        ? <span style={{ fontSize:10, padding:'3px 10px', borderRadius:100, background:'rgba(6,95,70,.15)', color:'#065f46', fontWeight:700, flexShrink:0 }}>✓ Gets You In</span>
                        : <span style={{ fontSize:10, padding:'3px 10px', borderRadius:100, background:'rgba(128,128,128,.1)', color:'var(--muted)', fontWeight:600, flexShrink:0 }}>Partial</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// RESUME BUILDER — generates a clean standalone HTML file for PDF
// ─────────────────────────────────────────────────────────────────

function buildResumeHTML(form, col) {
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const skillTags = form.skills
    ? form.skills.split(',').map(s => s.trim()).filter(Boolean)
        .map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')
    : ''
  const section = (label, content, isSkills = false) => !content ? '' : `
    <div class="section">
      <div class="section-head">${esc(label)}</div>
      ${isSkills ? `<div class="skills-wrap">${skillTags}</div>` : `<div class="section-body">${esc(content)}</div>`}
    </div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(form.name) || 'Resume'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:15mm 18mm}
  body{
    font-family:'Segoe UI',Calibri,Arial,sans-serif;
    background:#fff;color:#1a1a2e;font-size:13px;line-height:1.6;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
  }
  .page{max-width:210mm;margin:0 auto;background:#fff;}
  .header{background:${col};padding:30px 36px 24px;color:#fff;}
  .header h1{font-size:26px;font-weight:700;letter-spacing:-.3px;margin-bottom:6px;}
  .header-contact{display:flex;flex-wrap:wrap;gap:20px;font-size:12px;opacity:.92;}
  .header-contact span{display:flex;align-items:center;gap:5px;}
  .body{padding:22px 36px 30px;}
  .section{margin-bottom:18px;}
  .section-head{
    font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
    color:${col};border-bottom:2px solid ${col};padding-bottom:4px;margin-bottom:10px;
  }
  .section-body{font-size:12.5px;line-height:1.78;color:#2d3748;white-space:pre-line;}
  .skills-wrap{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px;}
  .skill-tag{
    display:inline-block;padding:3px 12px;border-radius:100px;
    background:${col}18;color:${col};font-size:11px;font-weight:600;
    border:1px solid ${col}35;
  }
  .print-bar{
    text-align:center;padding:20px;background:#f8fafc;
    border-top:1px solid #e2e8f0;margin-top:10px;
  }
  .print-btn{
    padding:12px 36px;background:${col};color:#fff;border:none;
    border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;
    font-family:inherit;transition:opacity .2s;
  }
  .print-btn:hover{opacity:.9}
  .print-hint{margin-top:10px;font-size:12px;color:#6b7280;}
  @media print{
    .print-bar{display:none!important;}
    body{margin:0;}
    .page{max-width:100%;}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${esc(form.name) || 'Your Name'}</h1>
    <div class="header-contact">
      ${form.email ? `<span>✉ ${esc(form.email)}</span>` : ''}
      ${form.phone ? `<span>📱 ${esc(form.phone)}</span>` : ''}
      ${form.address ? `<span>📍 ${esc(form.address)}</span>` : ''}
    </div>
  </div>
  <div class="body">
    ${section('Professional Summary', form.summary)}
    ${section('Technical Skills', form.skills, true)}
    ${section('Work Experience', form.experience)}
    ${section('Education', form.education)}
    ${section('Certifications', form.certifications)}
    ${section('Projects', form.projects)}
  </div>
</div>
<div class="print-bar">
  <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  <p class="print-hint">In the print dialog → set Destination to <strong>"Save as PDF"</strong> → click Save</p>
</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────
// PROFILE → RESUME  (LinkedIn / Naukri / any profile URL)
// Pastes profile text → AI extracts info → builds PDF resume
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// PROFILE IMPORT → RESUME
// Beautiful UI matching LinkedIn/Naukri import design
// ─────────────────────────────────────────────────────────────────
function CProfileResume({ user, toast }) {
  const [platform,   setPlatform] = useState('linkedin')
  const [profileTxt, setProfile]  = useState('')
  const [step,       setStep]     = useState(1)   // 1=input 2=extracting 3=result
  const [form,       setForm]     = useState(null)
  const [tmpl,       setTmpl]     = useState('modern')
  const [editMode,   setEditMode] = useState(false)

  const TMPLS = [
    { id:'modern', name:'Modern Blue', col:'#1e40af' },
    { id:'exec',   name:'Executive',   col:'#1a3a2a' },
    { id:'green',  name:'Creative',    col:'#065f46' },
  ]

  const PLATFORMS = [
    { id:'linkedin', label:'LinkedIn',   icon:'💼', color:'#0a66c2', bg:'rgba(10,102,194,.1)',  border:'rgba(10,102,194,.3)',
      steps:['Open your LinkedIn profile in a browser','Press Ctrl+A to select all content on the page','Press Ctrl+C to copy everything','Click in the text box on the right and press Ctrl+V to paste','Click "Extract & Generate Resume" — done!'],
      ph:`Paste your full LinkedIn profile text here...\n\nGo to your LinkedIn profile → Ctrl+A (select all) → Ctrl+C (copy) → Ctrl+V (paste here).\n\nWe extract: Name · Headline · Contact · Experience · Education · Skills · Certifications · Projects` },
    { id:'naukri',   label:'Naukri',    icon:'🟠', color:'#ff7555', bg:'rgba(255,117,85,.1)',  border:'rgba(255,117,85,.3)',
      steps:['Open naukri.com and sign in to your account','Click your profile picture → "View & Update Profile"','Press Ctrl+A to select all, then Ctrl+C to copy','Paste below using Ctrl+V','Click "Extract & Generate Resume" — done!'],
      ph:`Paste your Naukri profile text here...\n\nOpen your Naukri profile → select all text → copy → paste here.\n\nWe extract: Name · Email · Phone · Experience · Education · Key Skills · Certifications` },
    { id:'indeed',   label:'Indeed',    icon:'🔵', color:'#2557a7', bg:'rgba(37,87,167,.1)',   border:'rgba(37,87,167,.3)',
      steps:['Open indeed.com and go to your resume page','Click "View your Indeed Resume"','Press Ctrl+A then Ctrl+C to copy all text','Paste below using Ctrl+V','Click "Extract & Generate Resume" — done!'],
      ph:`Paste your Indeed resume text here...\n\nOpen your Indeed profile → copy all visible text → paste here.\n\nWe extract: Name · Contact · Work History · Education · Skills` },
    { id:'any',      label:'Any Profile', icon:'🌐', color:'#6d28d9', bg:'rgba(109,40,217,.1)', border:'rgba(109,40,217,.3)',
      steps:['Open any professional profile page','Select all visible text with Ctrl+A','Copy with Ctrl+C','Paste below with Ctrl+V','Click "Extract & Generate Resume" — done!'],
      ph:`Paste any professional profile text here...\n\nWorks with GitHub, Portfolio, StackOverflow, or any professional page.\n\nWe extract whatever information is available in the text.` },
  ]

  const plat    = PLATFORMS.find(p => p.id === platform)
  const wordCnt = profileTxt.trim().split(/\s+/).filter(Boolean).length
  const ready   = wordCnt >= 30

  const extractProfile = async () => {
    if (!ready) { toast('Paste more profile text first','error'); return }
    setStep(2)
    try {
      const prompt = `You are an expert resume parser. Extract ALL professional information from this ${plat.label} profile text.
Return ONLY valid JSON — no markdown, no explanation:
{
  "name": "full name",
  "email": "email address or empty string",
  "phone": "phone with country code or empty string",
  "address": "city, state, country or empty string",
  "role": "current job title or most recent role",
  "summary": "write a compelling 3-sentence professional summary based on the profile content",
  "skills": "comma-separated list of all technical and soft skills found",
  "experience": "format each job as:\nJob Title at Company Name (Start Date – End Date)\n• responsibility 1\n• responsibility 2\n\nNext job on new section",
  "education": "Degree — Field of Study, Institution Name, Graduation Year (one per line)",
  "certifications": "Certification Name, Issuer (Year) — one per line",
  "projects": "Project Name — description with tech stack — outcome (one per line)",
  "linkedin": "linkedin url if found or empty string",
  "github": "github url if found or empty string"
}

PROFILE TEXT TO PARSE:
${profileTxt.slice(0, 7000)}`

      const res  = await fetch('/api/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[{role:'user',content:[{type:'text',text:prompt}]}],
          _jd:'', _resumeText:profileTxt, _fileB64:null, _fileMime:null, _fileName:null
        })
      })
      const data  = await res.json()
      const raw   = (data.content||[]).map(b=>b.text||'').join('').trim()
      const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()
      const m     = clean.match(/\{[\s\S]*\}/)
      const parsed= JSON.parse(m ? m[0] : clean)

      if (!parsed.name)  parsed.name  = user.name  || ''
      if (!parsed.email) parsed.email = user.email || ''
      if (!parsed.phone) parsed.phone = user.phone || ''

      setForm(parsed)
      setStep(3)
      toast(`✅ ${plat.label} profile extracted — review and download!`)
    } catch(e) {
      toast('Extraction failed — paste more complete text and retry','error')
      setStep(1)
    }
  }

  const downloadResume = (tplId) => {
    const t   = TMPLS.find(x => x.id === tplId)
    const html= buildResumeHTML(form, t.col)
    const w   = window.open('','_blank')
    if (!w) { toast('Allow popups and retry','error'); return }
    w.document.open(); w.document.write(html); w.document.close()
    toast(`✅ ${t.name} resume opened — Print → Save as PDF`)
  }

  // ── STEP 1: MAIN INPUT UI ─────────────────────────────────────
  if (step === 1) return (
    <div className="page fu">
      {/* Header */}
      <div className="page-header" style={{marginBottom:20}}>
        <div>
          <div className="page-title">Profile Import → Resume</div>
          <div className="page-sub">
            Paste your LinkedIn / Naukri / Indeed profile → AI extracts all info → Download interview-ready PDF resume instantly
          </div>
        </div>
      </div>

      {/* Platform tabs */}
      <div style={{display:'flex',gap:8,marginBottom:22,flexWrap:'wrap'}}>
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={()=>setPlatform(p.id)}
            style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',
              borderRadius:10,border:`1.5px solid ${platform===p.id?p.color:' rgba(110,90,60,.18)'}`,
              background:platform===p.id?p.bg:'rgba(255,255,255,.7)',
              color:platform===p.id?p.color:'var(--sub)',
              fontWeight:platform===p.id?700:500,fontSize:13,cursor:'pointer',transition:'all .2s',
              fontFamily:'var(--font)'}}>
            <span style={{fontSize:16}}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.3fr',gap:20,alignItems:'start'}}>

        {/* Left — How to import */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card" style={{
            border:`1.5px solid ${plat.border}`,
            background:`${plat.bg}`,
          }}>
            {/* Icon + title */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{width:42,height:42,borderRadius:11,
                background:`${plat.color}22`,border:`1.5px solid ${plat.border}`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                📥
              </div>
              <div style={{fontWeight:800,fontSize:16,color:'var(--text)'}}>
                How to import from {plat.label}
              </div>
            </div>

            {/* Steps */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {plat.steps.map((s,i) => (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,
                    background:plat.color,color:'#fff',display:'flex',
                    alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:800,marginTop:1}}>
                    {i+1}
                  </div>
                  <div style={{fontSize:13.5,color:'var(--text)',lineHeight:1.55,paddingTop:2}}>
                    {s}
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy notice */}
            <div style={{marginTop:18,padding:'10px 14px',borderRadius:10,
              background:'rgba(6,95,70,.08)',border:'1px solid rgba(6,95,70,.2)',
              display:'flex',alignItems:'flex-start',gap:9}}>
              <span style={{fontSize:16,flexShrink:0}}>🔒</span>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:'#065f46'}}>100% Private</div>
                <div style={{fontSize:12,color:'#064e3b',marginTop:2,lineHeight:1.5}}>
                  Your profile text is processed by AI to extract info. Nothing is stored permanently.
                </div>
              </div>
            </div>
          </div>

          {/* What we extract */}
          <div className="card">
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontSize:16}}>✅</span>
              <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>What we extract</div>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {['Name','Email','Phone','Location','Headline','Summary',
                'Experience','Education','Skills (50+)','Certifications','Projects'].map(tag => (
                <span key={tag} style={{display:'flex',alignItems:'center',gap:4,
                  padding:'4px 11px',borderRadius:100,fontSize:12,fontWeight:600,
                  background:plat.bg,color:plat.color,border:`1px solid ${plat.border}`}}>
                  <span style={{fontSize:10}}>✓</span>{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Demo button */}
          <button onClick={()=>{
            setProfile(`Aryan Sharma\nSenior Machine Learning Engineer at Google India\nBengaluru, Karnataka, India\naryan.sharma@email.com | +91-98765-43210\n\nAbout\nSenior Machine Learning Engineer with 7+ years of experience building production-grade ML systems. Deep expertise in Python, TensorFlow, PyTorch, NLP, and deploying models on AWS. Led end-to-end ML pipelines for large-scale NLP and computer vision applications. AWS Certified Machine Learning Specialty.\n\nExperience\nSenior ML Engineer · Google India\nJan 2021 – Present · 3 yrs · Bengaluru\n• Led NLP-based document classification using BERT — 94% accuracy on 50M+ docs/day\n• Built end-to-end ML pipeline on AWS SageMaker: feature engineering, training, A/B testing, deployment\n• Reduced model inference latency by 62% via quantization and ONNX on AWS Lambda\n• Mentored 4 junior engineers; drove MLflow adoption across 3 product teams\n• Stack: Python, TensorFlow, NLP, AWS, FastAPI, Docker, Kubernetes, Spark\n\nML Engineer · Flipkart\nJul 2018 – Dec 2020 · 2.5 yrs · Bengaluru\n• Designed recommendation engine using collaborative filtering — CTR increased 18%\n• Feature engineering pipeline with Scikit-learn processing 200+ features for purchase-intent model\n• Flask-based model APIs handling 10K+ requests/second at 99.9% uptime\n\nData Science Engineer · Wipro AI Labs\nJun 2016 – Jun 2018 · 2 yrs · Hyderabad\n• NLP sentiment analysis for social media analytics using Python and NLTK\n• ML models for predictive maintenance, deployed on Azure ML\n\nEducation\nM.Tech — Computer Science (Machine Learning)\nIIT Bombay · 2014 – 2016 · CGPA: 9.1/10\n\nB.Tech — Computer Science\nBITS Pilani · 2010 – 2014 · CGPA: 8.8/10\n\nSkills\nPython, SQL, Scala, Java, TensorFlow, PyTorch, Keras, Scikit-learn, NLP, OpenCV, BERT, GPT, Transformers, Pandas, NumPy, Spark, Kafka, Airflow, Feature Engineering, FastAPI, Flask, Docker, Kubernetes, AWS SageMaker, AWS Lambda, AWS S3, EC2, GCP, Azure ML, MLflow, Git, CI/CD, Linux\n\nCertifications\nAWS Certified Machine Learning – Specialty (2022)\nGoogle Professional ML Engineer (2021)\nDeep Learning Specialization — Coursera / Andrew Ng (2019)\nTensorFlow Developer Certificate (2020)\n\nProjects\nReal-time NLP Fraud Detection System — Python, TensorFlow, FastAPI, AWS — 98.7% precision at 50K TPS\nLarge-scale Recommendation Engine — PyTorch, Spark, Kafka — served 100M+ users daily at Flipkart\nMultilingual Sentiment Analysis — Transformer BERT fine-tuning across 12 languages`)
          }} style={{padding:'10px 18px',borderRadius:10,cursor:'pointer',fontWeight:600,
            fontSize:13,background:`${plat.bg}`,border:`1.5px solid ${plat.border}`,
            color:plat.color,textAlign:'left',display:'flex',alignItems:'center',gap:8,
            fontFamily:'var(--font)'}}>
            📋 Load Demo Profile (Aryan Sharma — ML Engineer)
          </button>
        </div>

        {/* Right — Paste area */}
        <div className="card" style={{
          border:'1.5px solid rgba(110,90,60,.18)',
          background:'rgba(255,255,255,.92)',
          display:'flex',flexDirection:'column',gap:0,
          padding:0,overflow:'hidden',
        }}>
          {/* Card header */}
          <div style={{padding:'16px 20px',borderBottom:'1.5px solid rgba(110,90,60,.1)',
            display:'flex',alignItems:'center',gap:10,
            background:'rgba(250,248,243,.8)'}}>
            <span style={{fontSize:18}}>📋</span>
            <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>
              Paste your {plat.label} profile text
            </div>
          </div>

          {/* Instruction strip */}
          <div style={{padding:'10px 20px',background:`${plat.bg}`,
            borderBottom:`1px solid ${plat.border}`,
            fontSize:12,color:plat.color,fontWeight:500,
            display:'flex',alignItems:'center',gap:7}}>
            <span>💡</span>
            On {plat.label} → open your profile page → press Ctrl+A → Ctrl+C → paste below
          </div>

          {/* Textarea */}
          <textarea value={profileTxt} onChange={e=>setProfile(e.target.value)}
            placeholder={plat.ph}
            style={{width:'100%',minHeight:340,padding:'16px 20px',
              fontSize:13,lineHeight:1.75,resize:'vertical',
              border:'none',outline:'none',
              background:'transparent',color:'var(--text)',
              fontFamily:'var(--mono)',
              borderBottom:'1.5px solid rgba(110,90,60,.1)'}}/>

          {/* Word count footer */}
          <div style={{padding:'10px 20px 14px',
            display:'flex',alignItems:'center',justifyContent:'space-between',
            background:'rgba(250,248,243,.6)'}}>
            <div style={{fontSize:12,color:ready?'#065f46':'var(--muted)',fontWeight:500}}>
              {wordCnt > 0
                ? ready
                  ? <span style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>
                      {wordCnt} words pasted — ready to extract!
                    </span>
                  : <span style={{color:'#b45309'}}>{wordCnt} words — paste more text for better results</span>
                : <span>0 words pasted</span>}
            </div>
            {profileTxt && (
              <button onClick={()=>setProfile('')}
                style={{fontSize:11,padding:'4px 10px',borderRadius:7,cursor:'pointer',
                  background:'rgba(0,0,0,.05)',border:'1px solid var(--bord)',
                  color:'var(--muted)',fontFamily:'var(--font)'}}>
                Clear
              </button>
            )}
          </div>

          {/* Extract button */}
          <div style={{padding:'0 20px 20px'}}>
            <button onClick={extractProfile} disabled={!ready}
              style={{width:'100%',padding:'14px 24px',borderRadius:12,border:'none',
                cursor:ready?'pointer':'not-allowed',fontWeight:700,fontSize:15,
                fontFamily:'var(--font)',display:'flex',alignItems:'center',
                justifyContent:'center',gap:10,transition:'all .3s',
                background:ready
                  ? `linear-gradient(135deg,${plat.color},${plat.color}cc)`
                  : 'rgba(110,90,60,.12)',
                color:ready?'#fff':'var(--muted)',
                boxShadow:ready?`0 6px 24px ${plat.color}35`:'none'}}>
              <span style={{fontSize:18}}>✦</span>
              Extract & Generate Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── STEP 2: EXTRACTING ────────────────────────────────────────
  if (step === 2) return (
    <div className="page fu" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:400}}>
      <div style={{textAlign:'center',maxWidth:480,padding:'40px 20px'}}>
        <div style={{fontSize:56,marginBottom:18,animation:'spin 1.8s linear infinite',display:'inline-block'}}>⚙️</div>
        <div style={{fontWeight:800,fontSize:22,marginBottom:10,color:'var(--text)'}}>
          Extracting your {plat.label} Profile...
        </div>
        <div style={{color:'var(--muted)',fontSize:14,lineHeight:1.8,marginBottom:28}}>
          AI is reading your profile and extracting name, contact, skills, experience, education, certifications and projects.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:340,margin:'0 auto'}}>
          {['Parsing profile text...','Identifying skills & technologies...','Extracting work history & achievements...','Writing professional summary...','Preparing resume templates...'].map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',
              borderRadius:9,background:plat.bg,border:`1px solid ${plat.border}`}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:plat.color,flexShrink:0,
                animation:'pulse 1.5s ease-in-out infinite',animationDelay:`${i*.2}s`}}/>
              <div style={{fontSize:12,color:plat.color,fontWeight:500}}>{t}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
    </div>
  )

  // ── STEP 3: RESULT ────────────────────────────────────────────
  if (step === 3 && form) return (
    <div className="page fu">
      <div className="page-header" style={{marginBottom:20}}>
        <div>
          <div className="page-title">Resume Ready! 🎉</div>
          <div className="page-sub">
            {Object.values(form).filter(v=>v&&v.length>1).length} fields extracted from your {plat.label} profile — edit if needed, then download
          </div>
        </div>
        <button className="btn btn-g" style={{fontSize:12}}
          onClick={()=>{setStep(1);setForm(null);setProfile('')}}>
          ← Import Another
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.1fr',gap:22,alignItems:'start'}}>

        {/* Left — extracted fields */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Extracted summary card */}
          <div className="card" style={{border:`1.5px solid ${plat.border}`,background:plat.bg}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>✅</span>
                <div style={{fontWeight:700,fontSize:15,color:plat.color}}>
                  Extracted from {plat.label}
                </div>
              </div>
              <button onClick={()=>setEditMode(e=>!e)} className="btn btn-g" style={{fontSize:11,padding:'5px 12px'}}>
                {editMode?'👁 View':'✏️ Edit'}
              </button>
            </div>

            {!editMode ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                {[
                  {icon:'👤',l:'Name',     v:form.name},
                  {icon:'✉️',l:'Email',    v:form.email},
                  {icon:'📱',l:'Phone',    v:form.phone},
                  {icon:'📍',l:'Location', v:form.address},
                  {icon:'💼',l:'Role',     v:form.role},
                  {icon:'🔧',l:'Skills',   v:(form.skills||'').split(',').slice(0,5).join(', ')+(((form.skills||'').split(',').length>5)?'...':'')},
                ].filter(({v})=>v&&v.length>0).map(({icon,l,v})=>(
                  <div key={l} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'8px 10px',
                    borderRadius:9,background:'rgba(255,255,255,.85)',border:'1px solid rgba(110,90,60,.1)'}}>
                    <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:9.5,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>{l}</div>
                      <div style={{fontSize:12,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[{k:'name',l:'Full Name'},{k:'role',l:'Job Title'},{k:'email',l:'Email'},{k:'phone',l:'Phone'},{k:'address',l:'Location'}].map(({k,l})=>(
                  <div key={k}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--sub)',marginBottom:3}}>{l}</div>
                    <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',fontSize:13}}/>
                  </div>
                ))}
                {[{k:'summary',l:'Professional Summary'},{k:'skills',l:'Skills (comma-separated)'},{k:'experience',l:'Work Experience'},{k:'education',l:'Education'},{k:'certifications',l:'Certifications'},{k:'projects',l:'Projects'}].map(({k,l})=>(
                  <div key={k}>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--sub)',marginBottom:3}}>{l}</div>
                    <textarea value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                      style={{width:'100%',padding:'8px 12px',fontSize:12,minHeight:k==='experience'?80:46,resize:'vertical',lineHeight:1.65}}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resume strength */}
          <div className="card">
            <div style={{fontWeight:700,fontSize:13,color:'#065f46',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <span>💡</span> Resume Strength Tips
            </div>
            {[
              {ok:(form.skills||'').split(',').filter(s=>s.trim()).length>=8, tip:`${(form.skills||'').split(',').filter(s=>s.trim()).length} skills found — ${(form.skills||'').split(',').filter(s=>s.trim()).length>=8?'excellent coverage!':'add more to score higher'}`},
              {ok:!!(form.summary&&form.summary.length>60),    tip:form.summary?.length>60?'Strong professional summary present ✓':'Summary is short — edit it above'},
              {ok:!!form.certifications,                       tip:form.certifications?'Certifications boost your score +9% ✓':'Add certifications for higher AI match score'},
              {ok:!!(form.experience||'').includes('•'),       tip:(form.experience||'').includes('•')?'Bullet points in experience — ATS friendly ✓':'Use • bullet points in experience section'},
            ].map(({ok,tip},i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'7px 10px',
                borderRadius:8,marginBottom:6,
                background:ok?'rgba(6,95,70,.07)':'rgba(180,83,9,.06)',
                border:`1px solid ${ok?'rgba(6,95,70,.18)':'rgba(180,83,9,.18)'}`}}>
                <span style={{fontSize:13,flexShrink:0}}>{ok?'✅':'💡'}</span>
                <div style={{fontSize:12,color:ok?'#064e3b':'#92400e',lineHeight:1.5}}>{tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — template + download */}
        <div>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:'var(--text)'}}>
            Choose Your Template & Download
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:18}}>
            {TMPLS.map(t => (
              <div key={t.id} onClick={()=>setTmpl(t.id)}
                style={{borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all .25s',
                  border:`2px solid ${tmpl===t.id?t.col+'60':'rgba(110,90,60,.15)'}`,
                  background:tmpl===t.id?`${t.col}07`:'rgba(255,255,255,.92)',
                  boxShadow:tmpl===t.id?`0 8px 28px ${t.col}22`:'0 2px 8px rgba(0,0,0,.05)',
                  transform:tmpl===t.id?'translateY(-2px)':'none'}}>
                {/* Mini preview — full paper */}
                <div style={{height:130,background:'#e8e4dc',overflow:'hidden',
                  display:'flex',justifyContent:'center',padding:'8px 0 0'}}>
                  <div style={{position:'relative',width:480*0.24,height:720*0.24,flexShrink:0}}>
                    <div style={{position:'absolute',top:0,left:0,transformOrigin:'top left',transform:'scale(0.24)',width:480}}>
                      {t.id==='modern' ? <MiniModern col={t.col} f={form}/>
                        : t.id==='exec' ? <MiniExec col={t.col} f={form}/>
                        : <MiniCreative col={t.col} f={form}/>}
                    </div>
                  </div>
                </div>
                <div style={{padding:'10px 16px 12px',display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:t.col,flexShrink:0}}/>
                  <div style={{fontWeight:700,fontSize:13,flex:1,color:'var(--text)'}}>{t.name}</div>
                  {tmpl===t.id && (
                    <span style={{fontSize:9,padding:'2px 8px',borderRadius:100,background:t.col,color:'#fff',fontWeight:700}}>Selected</span>
                  )}
                  <button onClick={e=>{e.stopPropagation();downloadResume(t.id)}}
                    className="btn" style={{fontSize:12,padding:'7px 16px',flexShrink:0,
                      background:`linear-gradient(135deg,${t.col},${t.col}dd)`,
                      color:'#fff',border:'none',boxShadow:`0 3px 12px ${t.col}30`}}>
                    ⬇ Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* How to save PDF */}
          <div style={{padding:'14px 16px',borderRadius:12,
            background:'rgba(30,64,175,.06)',border:'1px solid rgba(30,64,175,.15)'}}>
            <div style={{fontWeight:700,fontSize:12,color:'#1e40af',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              <span>📄</span> How to save as PDF
            </div>
            {['Click ⬇ Download on any template','Resume opens in a new browser tab','Press Ctrl+P (Print)','Set Destination → "Save as PDF"','Click Save — interview-ready! ✅'].map((s,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:4}}>
                <span style={{fontSize:10,color:'#1e40af',fontWeight:800,flexShrink:0,fontFamily:'var(--mono)'}}>{i+1}.</span>
                <span style={{fontSize:12,color:'#1e3a8a'}}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return null
}

function MiniModern({ col, f }) {
  const skills=(f.skills||'Python, React, AWS').split(',').slice(0,4).map(s=>s.trim()).filter(Boolean)
  return (
    <div style={{transform:'scale(.28)',transformOrigin:'top center',width:480,background:'#fff',fontFamily:'Arial,sans-serif',color:'#111',borderRadius:3,overflow:'hidden'}}>
      <div style={{background:col,padding:'16px 22px 12px',color:'#fff'}}>
        <div style={{fontWeight:800,fontSize:22}}>{f.name||'Your Name'}</div>
        <div style={{fontSize:10,marginTop:3,opacity:.82}}>{f.role||'Professional'}</div>
        <div style={{fontSize:9,marginTop:5,opacity:.72}}>{f.email||'email@domain.com'}</div>
      </div>
      <div style={{padding:'10px 22px'}}>
        {f.summary&&<div style={{fontSize:8.5,color:'#555',lineHeight:1.5,marginBottom:9}}>{f.summary.slice(0,100)}</div>}
        <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',color:col,borderBottom:`1.5px solid ${col}25`,paddingBottom:2,marginBottom:6,letterSpacing:'.08em'}}>Skills</div>
        <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
          {skills.map(s=><span key={s} style={{fontSize:7.5,padding:'2px 6px',borderRadius:100,background:`${col}15`,color:col,fontWeight:700}}>{s}</span>)}
        </div>
        {(f.experience||'').split('\n')[0] && <>
          <div style={{fontSize:8,fontWeight:700,textTransform:'uppercase',color:col,borderBottom:`1.5px solid ${col}25`,paddingBottom:2,marginBottom:5,marginTop:9,letterSpacing:'.08em'}}>Experience</div>
          <div style={{fontSize:8.5,fontWeight:700}}>{(f.experience||'').split('\n')[0].slice(0,40)}</div>
        </>}
      </div>
    </div>
  )
}
function MiniExec({ col, f }) {
  return (
    <div style={{transform:'scale(.28)',transformOrigin:'top center',width:480,background:'#fff',fontFamily:'Georgia,serif',color:'#111',borderRadius:3,overflow:'hidden'}}>
      <div style={{padding:'20px 28px 14px',borderBottom:`2.5px double ${col}`,textAlign:'center'}}>
        <div style={{fontWeight:700,fontSize:22,color:col,textTransform:'uppercase',letterSpacing:'.06em'}}>{f.name||'Your Name'}</div>
        <div style={{fontSize:9,color:'#666',marginTop:4,fontFamily:'Arial,sans-serif',textTransform:'uppercase',letterSpacing:'.1em'}}>{f.role||'Professional'}</div>
        <div style={{fontSize:8,color:'#999',marginTop:5,fontFamily:'Arial,sans-serif'}}>{f.email||'email@domain.com'}</div>
      </div>
      <div style={{padding:'10px 28px'}}>
        {f.summary&&<div style={{fontSize:8.5,color:'#444',lineHeight:1.6,fontStyle:'italic'}}>{f.summary.slice(0,120)}</div>}
      </div>
    </div>
  )
}
function MiniCreative({ col, f }) {
  const skills=(f.skills||'Python, React, AWS, SQL').split(',').slice(0,5).map(s=>s.trim()).filter(Boolean)
  return (
    <div style={{transform:'scale(.28)',transformOrigin:'top center',width:480,background:'#fff',fontFamily:'Arial,sans-serif',color:'#111',borderRadius:3,overflow:'hidden',display:'flex'}}>
      <div style={{width:160,background:col,padding:'18px 12px',color:'#fff',flexShrink:0}}>
        <div style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,.2)',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800}}>
          {(f.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={{fontSize:11,fontWeight:800,textAlign:'center',marginBottom:2}}>{(f.name||'Your Name').split(' ')[0]}</div>
        <div style={{fontSize:8,textAlign:'center',opacity:.8,marginBottom:9}}>{f.role||'Professional'}</div>
        {skills.map(s=><div key={s} style={{fontSize:7.5,opacity:.85,marginBottom:3}}>• {s}</div>)}
      </div>
      <div style={{flex:1,padding:'14px 12px'}}>
        {f.summary&&<div style={{fontSize:8.5,color:'#555',lineHeight:1.5,marginBottom:8}}>{f.summary.slice(0,100)}</div>}
        {(f.experience||'').split('\n')[0] && <>
          <div style={{fontSize:8,fontWeight:700,color:col,borderLeft:`2px solid ${col}`,paddingLeft:5,marginBottom:4}}>EXPERIENCE</div>
          <div style={{fontSize:8.5,fontWeight:700}}>{(f.experience||'').split('\n')[0].slice(0,35)}</div>
        </>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
function CBuilder({ user, toast }) {
  const [tmpl, setTmpl]           = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', email: user.email,
    address: 'Hyderabad, India', role: '', summary: '', skills: '',
    experience: '', education: '', certifications: '', projects: ''
  })

  const TMPLS = [
    { id:'modern', name:'Modern Blue',  col:'#1e40af', desc:'ATS-optimized. Best for tech & engineering roles.', tag:'Most Popular' },
    { id:'exec',   name:'Executive',    col:'#1a3a2a', desc:'Elegant serif. Best for senior & management roles.', tag:'Premium Look' },
    { id:'green',  name:'Creative',     col:'#065f46', desc:'Modern two-column. Best for design & creative roles.', tag:'Stands Out' },
  ]

  const downloadPDF = () => {
    const t = TMPLS.find(x => x.id === tmpl)
    const html = buildResumeHTML(form, t.col)
    const w = window.open('', '_blank')
    if (!w) { toast('Please allow popups in your browser, then try again', 'error'); return }
    w.document.open(); w.document.write(html); w.document.close()
    toast('Resume opened — click "Print / Save as PDF" ✓')
  }

  // ── Shared sample for template card previews ───────────────────
  const S = {
    name: user.name || 'Rahul Sharma', role: 'Software Engineer',
    email: user.email || 'rahul@email.com', phone: user.phone || '+91-98765-43210',
    address: 'Hyderabad, India',
    summary: 'Experienced engineer with 4+ years building scalable systems.',
    skills: ['Python','React','Node.js','AWS','Docker','SQL','Git'],
    expTitle: 'Senior Developer', expCo: 'TechCorp Solutions',
    bullets: ['Led development of AI-powered platform used by 10K+ users','Reduced API latency by 40% via caching and optimization'],
    edu: 'B.Tech — Computer Science', eduInst: 'JNTU Hyderabad · 2020',
    cert: 'AWS Cloud Practitioner (2023)',
    proj: 'AI Resume Screener — NLP pipeline with 94% accuracy',
  }

  // ── MODERN BLUE preview (classic single-column) ────────────────
  const PreviewModern = ({ col, f }) => (
    <div style={{ 
      width:540, background:'#fff', color:'#111', fontFamily:'Arial,sans-serif',
      borderRadius:4, overflow:'hidden', flexShrink:0,
      boxShadow:'0 2px 16px rgba(0,0,0,.13)' }}>
      {/* Header */}
      <div style={{ background:col, padding:'24px 30px 18px', color:'#fff' }}>
        <div style={{ fontWeight:800, fontSize:26, letterSpacing:'-.01em' }}>{f.name||S.name}</div>
        {(f.role||S.role) && <div style={{ fontSize:12, marginTop:3, opacity:.88, fontStyle:'italic' }}>{f.role||S.role}</div>}
        <div style={{ fontSize:10, marginTop:8, opacity:.78, display:'flex', gap:14, flexWrap:'wrap' }}>
          {(f.email||S.email) && <span>✉ {f.email||S.email}</span>}
          {(f.phone||S.phone) && <span>📱 {f.phone||S.phone}</span>}
          {(f.address||S.address) && <span>📍 {f.address||S.address}</span>}
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:'18px 30px 24px' }}>
        {/* Summary */}
        <Section col={col} title="Professional Summary">
          <div style={{ fontSize:10.5, lineHeight:1.65, color:'#374151' }}>{f.summary||S.summary}</div>
        </Section>
        {/* Skills */}
        <Section col={col} title="Technical Skills">
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {(f.skills ? f.skills.split(',').map(s=>s.trim()).filter(Boolean) : S.skills).map(s=>(
              <span key={s} style={{ fontSize:9, padding:'3px 9px', borderRadius:100,
                background:`${col}12`, color:col, fontWeight:700, border:`1px solid ${col}25` }}>{s}</span>
            ))}
          </div>
        </Section>
        {/* Experience */}
        <Section col={col} title="Work Experience">
          <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{f.experience?f.experience.split('\n')[0]:S.expTitle}</div>
          {!f.experience && <div style={{ fontSize:9.5, color:'#888', margin:'2px 0 6px' }}>{S.expCo} · 2021–Present</div>}
          {(f.experience ? f.experience.split('\n').slice(1) : S.bullets).map((b,i)=>(
            <div key={i} style={{ fontSize:10, color:'#444', marginBottom:3, lineHeight:1.55 }}>
              {b.startsWith('•')||b.startsWith('-') ? b : `• ${b}`}
            </div>
          ))}
        </Section>
        {/* Education */}
        <Section col={col} title="Education">
          <div style={{ fontSize:11, fontWeight:700 }}>{f.education||S.edu}</div>
          {!f.education && <div style={{ fontSize:10, color:'#777' }}>{S.eduInst}</div>}
        </Section>
        {/* Certifications */}
        {(f.certifications||S.cert) && (
          <Section col={col} title="Certifications">
            <div style={{ fontSize:10, color:'#444' }}>• {f.certifications||S.cert}</div>
          </Section>
        )}
        {/* Projects */}
        {(f.projects||S.proj) && (
          <Section col={col} title="Key Projects">
            <div style={{ fontSize:10, color:'#444' }}>• {f.projects||S.proj}</div>
          </Section>
        )}
      </div>
    </div>
  )

  // ── EXECUTIVE preview (centered serif header) ──────────────────
  const PreviewExec = ({ col, f }) => (
    <div style={{ 
      width:540, background:'#fff', color:'#111', fontFamily:'Georgia,serif',
      borderRadius:4, overflow:'hidden', flexShrink:0,
      boxShadow:'0 2px 16px rgba(0,0,0,.13)' }}>
      {/* Header */}
      <div style={{ padding:'28px 36px 18px', borderBottom:`3px double ${col}`, textAlign:'center' }}>
        <div style={{ fontWeight:700, fontSize:28, letterSpacing:'.05em', color:col, textTransform:'uppercase' }}>{f.name||S.name}</div>
        <div style={{ fontSize:11, color:'#555', marginTop:5, letterSpacing:'.1em', textTransform:'uppercase', fontFamily:'Arial,sans-serif' }}>{f.role||S.role}</div>
        <div style={{ fontSize:9.5, color:'#888', marginTop:8, display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', fontFamily:'Arial,sans-serif' }}>
          {[f.email||S.email, f.phone||S.phone, f.address||S.address].filter(Boolean).map((v,i)=>(
            <span key={i}>{i>0 && <span style={{margin:'0 6px',opacity:.4}}>|</span>}{v}</span>
          ))}
        </div>
      </div>
      <div style={{ padding:'16px 36px 24px' }}>
        {/* Summary */}
        <ExecSection col={col} title="Profile">
          <div style={{ fontSize:10.5, lineHeight:1.7, color:'#333', fontStyle:'italic' }}>{f.summary||S.summary}</div>
        </ExecSection>
        {/* Skills */}
        <ExecSection col={col} title="Core Competencies">
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {(f.skills?f.skills.split(',').map(s=>s.trim()).filter(Boolean):S.skills).map(s=>(
              <span key={s} style={{ fontSize:9.5, fontFamily:'Arial,sans-serif', color:`${col}`, fontWeight:700 }}>◆ {s}</span>
            ))}
          </div>
        </ExecSection>
        {/* Experience */}
        <ExecSection col={col} title="Professional Experience">
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, fontWeight:700 }}>
            <span>{f.experience?f.experience.split('\n')[0]:S.expTitle+' — '+S.expCo}</span>
            <span style={{ color:'#888', fontFamily:'Arial,sans-serif', fontWeight:400, fontSize:9.5 }}>2021–Present</span>
          </div>
          {(f.experience?f.experience.split('\n').slice(1):S.bullets).map((b,i)=>(
            <div key={i} style={{ fontSize:10, color:'#444', marginTop:4, fontFamily:'Arial,sans-serif' }}>• {b.replace(/^[•\-]\s*/,'')}</div>
          ))}
        </ExecSection>
        {/* Education */}
        <ExecSection col={col} title="Education">
          <div style={{ fontSize:10.5, fontWeight:700 }}>{f.education||S.edu}</div>
          {!f.education && <div style={{ fontSize:9.5, color:'#777', fontFamily:'Arial,sans-serif' }}>{S.eduInst}</div>}
        </ExecSection>
        {(f.certifications||S.cert) && (
          <ExecSection col={col} title="Certifications">
            <div style={{ fontSize:10, color:'#444', fontFamily:'Arial,sans-serif' }}>{f.certifications||S.cert}</div>
          </ExecSection>
        )}
      </div>
    </div>
  )

  // ── CREATIVE preview (two-column sidebar) ──────────────────────
  const PreviewCreative = ({ col, f }) => (
    <div style={{ 
      width:540, background:'#fff', color:'#111', fontFamily:'Arial,sans-serif',
      borderRadius:4, overflow:'hidden', display:'flex', flexShrink:0,
      boxShadow:'0 2px 16px rgba(0,0,0,.13)' }}>
      {/* Left sidebar */}
      <div style={{ width:186, background:col, padding:'24px 16px', color:'#fff', flexShrink:0 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,.2)',
          margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, fontWeight:800, border:'2px solid rgba(255,255,255,.35)' }}>
          {(f.name||S.name).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={{ fontSize:14, fontWeight:800, textAlign:'center', marginBottom:2, lineHeight:1.2 }}>{f.name||S.name}</div>
        <div style={{ fontSize:9, textAlign:'center', opacity:.8, marginBottom:14, letterSpacing:'.06em', textTransform:'uppercase' }}>{f.role||S.role}</div>
        <div style={{ height:1, background:'rgba(255,255,255,.25)', margin:'10px 0 12px' }}/>
        {[f.email||S.email, f.phone||S.phone, f.address||S.address].filter(Boolean).map((v,i)=>(
          <div key={i} style={{ fontSize:8.5, opacity:.85, marginBottom:5, wordBreak:'break-all' }}>{v}</div>
        ))}
        <div style={{ height:1, background:'rgba(255,255,255,.25)', margin:'12px 0 10px' }}/>
        <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10, opacity:.9 }}>Skills</div>
        {(f.skills?f.skills.split(',').map(s=>s.trim()).filter(Boolean):S.skills).map(s=>(
          <div key={s} style={{ marginBottom:6 }}>
            <div style={{ fontSize:9, marginBottom:3, display:'flex', justifyContent:'space-between' }}>
              <span>{s}</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,.2)', borderRadius:2 }}>
              <div style={{ height:'100%', width:`${[85,75,90,80,70,88,82][Math.abs(s.charCodeAt(0)*7)%7]}%`,
                background:'rgba(255,255,255,.72)', borderRadius:2 }}/>
            </div>
          </div>
        ))}
        {(f.certifications||S.cert) && <>
          <div style={{ height:1, background:'rgba(255,255,255,.25)', margin:'12px 0 10px' }}/>
          <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6, opacity:.9 }}>Certifications</div>
          <div style={{ fontSize:8.5, opacity:.82, lineHeight:1.5 }}>{f.certifications||S.cert}</div>
        </>}
      </div>
      {/* Right content */}
      <div style={{ flex:1, padding:'20px 18px 20px', overflow:'hidden' }}>
        <CreativeSection col={col} title="About Me">
          <div style={{ fontSize:10, color:'#444', lineHeight:1.65 }}>{f.summary||S.summary}</div>
        </CreativeSection>
        <CreativeSection col={col} title="Experience">
          <div style={{ fontSize:11, fontWeight:700, color:'#111' }}>{f.experience?f.experience.split('\n')[0]:S.expTitle}</div>
          {!f.experience && <div style={{ fontSize:9.5, color:'#888', margin:'2px 0 5px' }}>{S.expCo} · 2021–Present</div>}
          {(f.experience?f.experience.split('\n').slice(1):S.bullets).map((b,i)=>(
            <div key={i} style={{ fontSize:9.5, color:'#555', marginBottom:3 }}>▸ {b.replace(/^[•▸\-]\s*/,'')}</div>
          ))}
        </CreativeSection>
        <CreativeSection col={col} title="Education">
          <div style={{ fontSize:11, fontWeight:700 }}>{f.education||S.edu}</div>
          {!f.education && <div style={{ fontSize:9.5, color:'#888' }}>{S.eduInst}</div>}
        </CreativeSection>
        {(f.projects||S.proj) && (
          <CreativeSection col={col} title="Projects">
            <div style={{ fontSize:9.5, color:'#555' }}>▸ {f.projects||S.proj}</div>
          </CreativeSection>
        )}
      </div>
    </div>
  )

  // ── Helper section components ──────────────────────────────────
  function Section({ col, title, children }) {
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em',
          color:col, borderBottom:`2px solid ${col}30`, paddingBottom:3, marginBottom:7 }}>{title}</div>
        {children}
      </div>
    )
  }
  function ExecSection({ col, title, children }) {
    return (
      <div style={{ marginBottom:13 }}>
        <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em',
          color:col, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:.75, background:`${col}35` }}/>
          {title}
          <div style={{ flex:1, height:.75, background:`${col}35` }}/>
        </div>
        {children}
      </div>
    )
  }
  function CreativeSection({ col, title, children }) {
    return (
      <div style={{ marginBottom:13 }}>
        <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em',
          color:col, marginBottom:6, borderLeft:`3px solid ${col}`, paddingLeft:7 }}>{title}</div>
        {children}
      </div>
    )
  }

  // ── Template selection screen ──────────────────────────────────
  if (!tmpl) return (
    <div className="fu">
      <PageHdr title="Resume Builder" sub="Preview shows your exact final resume format — pick a template to start" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:24, maxWidth:980 }}>
        {TMPLS.map(t => {
          const Preview = t.id==='modern' ? PreviewModern : t.id==='exec' ? PreviewExec : PreviewCreative
          return (
            <div key={t.id} onClick={()=>setTmpl(t.id)}
              style={{ cursor:'pointer', borderRadius:18, overflow:'hidden',
                border:'1.5px solid var(--bord)', transition:'all .25s',
                background:'rgba(255,255,255,.9)',
                boxShadow:'0 2px 14px rgba(0,0,0,.06)' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.borderColor=t.col+'55';e.currentTarget.style.boxShadow=`0 14px 40px ${t.col}22`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.borderColor='var(--bord)';e.currentTarget.style.boxShadow='0 2px 14px rgba(0,0,0,.06)'}}>
              {/* Real resume preview window — full paper visible */}
              <div style={{ overflow:'hidden', position:'relative',
                background:'#e8e4dc', display:'flex', justifyContent:'center',
                padding:'14px 0 14px', borderBottom:'1.5px solid var(--bord)',
                minHeight: t.id==='green' ? 310 : 320 }}>
                {/* Wrapper clips to exact scaled height so full paper shows */}
                <div style={{ position:'relative', width:540*0.38, height:720*0.38, flexShrink:0 }}>
                  <div style={{ position:'absolute', top:0, left:0, transformOrigin:'top left', transform:'scale(0.38)', width:540 }}>
                    <Preview col={t.col} f={{}} />
                  </div>
                </div>
                <span style={{ position:'absolute', top:10, right:10, fontSize:9, padding:'3px 9px',
                  borderRadius:100, background:t.col, color:'#fff', fontWeight:700, letterSpacing:'.04em' }}>
                  {t.tag}
                </span>
              </div>
              {/* Card footer */}
              <div style={{ padding:'16px 20px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:t.col }}/>
                  <div style={{ fontWeight:800, fontSize:15, color:'var(--text)' }}>{t.name}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14, lineHeight:1.55 }}>{t.desc}</div>
                <button className="btn" style={{ fontSize:12, padding:'9px 0', width:'100%', justifyContent:'center',
                  background:`linear-gradient(135deg,${t.col},${t.col}dd)`, color:'#fff',
                  border:'none', boxShadow:`0 4px 16px ${t.col}30` }}>
                  Use This Template →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const t = TMPLS.find(x => x.id === tmpl)
  const Preview = t.id==='modern' ? PreviewModern : t.id==='exec' ? PreviewExec : PreviewCreative

  return (
    <div className="fu">
      <PageHdr title={`Resume Builder — ${t.name}`} sub="Fill form on left · Live preview updates as you type">
        <button className="btn btn-g" onClick={()=>setTmpl(null)} style={{ fontSize:12 }}>← Templates</button>
        <button className="btn btn-g hide-mobile" onClick={()=>setShowPreview(p=>!p)} style={{ fontSize:12 }}>📱 {showPreview?'Hide':'Show'} Preview</button>
        <button className="btn" onClick={downloadPDF} style={{ fontSize:12, background:`linear-gradient(135deg,${t.col},${t.col}dd)`, color:'#fff', border:'none', boxShadow:`0 4px 16px ${t.col}30` }}>
          <Ic n="down" s={13}/> Download PDF
        </button>
      </PageHdr>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22, alignItems:'start' }} className="builder-layout">
        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[{k:'name',l:'Full Name',ph:'Rahul Sharma'},{k:'role',l:'Job Title / Role',ph:'Software Engineer'},{k:'phone',l:'Phone',ph:'+91-9876543210'},{k:'email',l:'Email',ph:'rahul@email.com'},{k:'address',l:'Location',ph:'Hyderabad, India'}].map(({k,l,ph})=>(
            <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <Lbl>{l}</Lbl>
              <input placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{ padding:'10px 14px', width:'100%' }}/>
            </div>
          ))}
          {[{k:'summary',l:'Professional Summary',ph:'Experienced engineer with X years...'},{k:'skills',l:'Skills (comma-separated)',ph:'Python, React, AWS, Docker...'},{k:'experience',l:'Work Experience',ph:'Senior Engineer @ TechCorp (2021–Present)\n• Built scalable ML pipelines...\n\nDeveloper @ Startup (2019–2021)\n• Developed REST APIs...'},{k:'education',l:'Education',ph:'B.Tech Computer Science, JNTU 2020'},{k:'certifications',l:'Certifications',ph:'AWS Cloud Practitioner (2023)'},{k:'projects',l:'Key Projects',ph:'AI Resume Screener — Python, NLP — 94% accuracy'}].map(({k,l,ph})=>(
            <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <Lbl>{l}</Lbl>
              <textarea placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                style={{ padding:'10px 14px', minHeight:k==='experience'?110:60, resize:'vertical', lineHeight:1.65, fontSize:13, width:'100%' }}/>
            </div>
          ))}
        </div>
        {/* Live preview — full paper shown */}
        <div className={`builder-preview${showPreview?' show':''}`}
          style={{ position:'sticky', top:20, borderRadius:14,
            border:'1.5px solid var(--bord)', overflow:'auto',
            background:'#e8e4dc', padding:'20px 16px',
            boxShadow:'0 4px 24px rgba(0,0,0,.1)', maxHeight:'90vh' }}>
          <div style={{ position:'relative', width:540*0.50, height:720*0.50, margin:'0 auto' }}>
            <div style={{ position:'absolute', top:0, left:0, transformOrigin:'top left', transform:'scale(0.50)', width:540 }}>
              <Preview col={t.col} f={form}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// CANDIDATE JOB BOARD
// ─────────────────────────────────────────────────────────────────
function CJobs({ jobs, user, myApps, addApp, toast }) {
  const [search, setSearch] = useState(''), [cat, setCat] = useState('All'), [applying, setApplying] = useState(null)
  const [file, setFile] = useState(null), [resumeText, setResumeText] = useState(''), [loading, setLoading] = useState(null)
  const [dragOver, setDragOver] = useState(false), [lastResult, setLastResult] = useState(null)
  const ACCEPT = 'application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const cats = ['All', ...new Set(jobs.map(j => j.category))]
  const filtered = jobs.filter(j => (!search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())) && (cat === 'All' || j.category === cat))
  const applied = jid => myApps.some(a => a.jobId === jid)
  const getMyApp = jid => myApps.find(a => a.jobId === jid)

  const submitApp = async (job) => {
    if (!file && !resumeText.trim()) { toast('Upload a file or paste resume text', 'error'); return }
    setLoading(job.id); setLastResult(null)
    try {
      let b64 = null, ftype = null, fname = null
      if (file) { b64 = await fileToBase64(file); ftype = getFileMime(file); fname = file.name }
      const r = file ? await analyzeWithFile(job.description, file, resumeText) : await analyzeWithText(job.description, resumeText)
      addApp({ id: `app_${Date.now()}`, candidateId: user.id, jobId: job.id, candidateName: user.name, jobTitle: job.title, company: job.company, resumeText: resumeText || `File: ${fname}`, resumeFileName: fname, resumeFileData: b64, resumeFileType: ftype, matchScore: r.matchScore, dimensionScores: r.dimensionScores, matchedKeywords: r.matchedKeywords || [], missingSkills: r.missingSkills || [], strengths: r.strengths || [], concerns: r.concerns || [], aiRationale: r.aiRationale || '', overallFeedback: r.overallFeedback || '', recommendation: r.recommendationLevel, status: 'pending', appliedAt: new Date().toISOString().split('T')[0], fairnessFlag: r.fairnessFlag, fairnessNote: r.fairnessNote || 'No bias detected' })
      setLastResult({ jobTitle: job.title, score: r.matchScore, recommendation: r.recommendationLevel, status: 'success', missing: r.missingSkills || [] })
      toast(`Applied to ${job.title}! Score: ${r.matchScore}%`)
      setApplying(null); setFile(null); setResumeText('')
    } catch (e) {
      setLastResult({ jobTitle: job.title, status: 'error', msg: e.message })
      toast('Application failed: ' + e.message, 'error')
    } finally { setLoading(null) }
  }

  return (
    <div className="fu">
      <PageHdr title="Job Board" sub={`${jobs.length} open positions · Apply with file or text · AI-scored instantly`} />

      {lastResult && (
        <div style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden', border: `1px solid ${lastResult.status === 'success' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`, animation: 'popIn .3s ease' }}>
          {lastResult.status === 'success' ? (
            <div style={{ padding: '16px 22px', background: 'rgba(16,185,129,.08)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 24 }}>✅</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15, color: '#34D399' }}>Application Submitted!</div><div style={{ fontSize: 13, color: 'var(--sub)' }}>Your application for <strong style={{ color: 'var(--text)' }}>{lastResult.jobTitle}</strong> is AI-scored.</div></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 30, fontFamily: 'var(--mono)', color: lastResult.score >= 80 ? '#10B981' : '#F59E0B' }}>{lastResult.score}%</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Match Score</div></div>
                <span className={`tag ${lastResult.recommendation === 'Strong Recommend' ? 'tg' : 'tb'}`} style={{ fontSize: 12 }}>{lastResult.recommendation}</span>
              </div>
              <button onClick={() => setLastResult(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Ic n="x" s={16} /></button>
            </div>
          ) : (
            <div style={{ padding: '14px 22px', background: 'rgba(239,68,68,.08)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>❌</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: '#F87171' }}>Failed</div><div style={{ fontSize: 13, color: 'var(--sub)' }}>{lastResult.msg}</div></div>
              <button onClick={() => setLastResult(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Ic n="x" s={16} /></button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}><Ic n="search" s={13} /></div>
          <input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 33px' }} />
        </div>
        {cats.map(c => <button key={c} onClick={() => setCat(c)} className="btn" style={{ fontSize: 12, padding: '9px 14px', background: cat === c ? 'rgba(59,130,246,.12)' : 'rgba(128,128,128,.06)', color: cat === c ? 'var(--blue)' : 'var(--sub)', border: cat === c ? '1px solid rgba(59,130,246,.25)' : '1px solid var(--bord)' }}>{c}</button>)}
      </div>

      {applying && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-head">
              <div><div style={{ fontWeight: 700, fontSize: 18 }}>Apply to {applying.title}</div><div style={{ color: 'var(--sub)', fontSize: 13, marginTop: 3 }}>@ {applying.company} · AI scores instantly</div></div>
              <button onClick={() => { setApplying(null); setFile(null); setResumeText('') }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Ic n="x" s={18} /></button>
            </div>
            <div className="modal-body">
              <div className={`drop-zone${dragOver ? ' drag-over' : ''}`} style={{ marginBottom: 12 }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                onClick={() => document.getElementById('applyFileInput')?.click()}>
                <input id="applyFileInput" type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{file ? 'Change File' : 'Upload Resume'}</div>
                <div style={{ fontSize: 12, color: 'var(--sub)' }}>{file ? file.name : 'PDF, PNG, JPG, DOC, DOCX'}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 8 }}>— or paste resume text —</div>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste resume text here..." style={{ width: '100%', minHeight: 110, padding: 12, resize: 'vertical', lineHeight: 1.6, fontSize: 12, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="btn btn-g" onClick={() => { setApplying(null); setFile(null); setResumeText('') }}>Cancel</button>
                <button className="btn btn-p" onClick={() => submitApp(applying)} disabled={loading === applying.id} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading === applying.id ? <><Spin /> Analyzing...</> : <><Ic n="send" s={13} /> Submit Application</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
        {filtered.map(job => {
          const app = getMyApp(job.id)
          return (
            <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{job.title}</div><div style={{ fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>{job.company}</div></div>
                <span className="tag tc" style={{ fontSize: 10, flexShrink: 0 }}>{job.category}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--sub)' }}>
                <span>📍 {job.location}</span><span>💼 {job.type}</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>💰 {job.salary}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6 }}>{job.description.slice(0, 100)}...</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {job.skills.slice(0, 4).map(s => <span key={s} className="tag tb" style={{ fontSize: 10 }}>{s}</span>)}
                {job.skills.length > 4 && <span className="tag" style={{ fontSize: 10, color: 'var(--muted)', border: '1px solid var(--bord)', background: 'transparent' }}>+{job.skills.length - 4}</span>}
              </div>
              {applied(job.id) && app && (
                <div style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>Applied</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Status: <span style={{ fontWeight: 600, textTransform: 'capitalize', color: app.status === 'shortlisted' ? '#10B981' : app.status === 'reviewed' ? '#3B82F6' : '#F59E0B' }}>{app.status}</span></div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--mono)', color: (app.matchScore || 0) >= 80 ? '#10B981' : '#F59E0B' }}>{app.matchScore || 0}%</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>AI Score</div></div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                {applied(job.id) ? <button className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: 12, background: 'rgba(16,185,129,.08)', color: '#34D399', border: '1px solid rgba(16,185,129,.2)', cursor: 'default' }} disabled><Ic n="check" s={13} /> Applied</button> : <button className="btn btn-p" onClick={() => setApplying(job)} style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}><Ic n="send" s={13} /> Apply Now</button>}
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{job.postedAt}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MY APPLICATIONS
// ─────────────────────────────────────────────────────────────────
function CApps({ myApps, jobs }) {
  const [sel, setSel] = useState(myApps[0] || null)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const sorted = [...myApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  const distD = [{ r: '90-100%', n: myApps.filter(a => (a.matchScore || 0) >= 90).length }, { r: '75-89%', n: myApps.filter(a => (a.matchScore || 0) >= 75 && (a.matchScore || 0) < 90).length }, { r: '60-74%', n: myApps.filter(a => (a.matchScore || 0) >= 60 && (a.matchScore || 0) < 75).length }, { r: '<60%', n: myApps.filter(a => (a.matchScore || 0) < 60).length }]
  const statusD = [{ name: 'Pending', value: myApps.filter(a => a.status === 'pending').length, color: '#F59E0B' }, { name: 'Reviewed', value: myApps.filter(a => a.status === 'reviewed').length, color: '#3B82F6' }, { name: 'Shortlisted', value: myApps.filter(a => a.status === 'shortlisted').length, color: '#10B981' }].filter(d => d.value > 0)
  const trendD = myApps.slice().reverse().map((a, i) => ({ n: `#${i + 1}`, s: a.matchScore || 0 }))
  const radD = sel?.dimensionScores ? [{ s: 'Skills', A: sel.dimensionScores.skills || 0 }, { s: 'Experience', A: sel.dimensionScores.experience || 0 }, { s: 'Education', A: sel.dimensionScores.education || 0 }, { s: 'Potential', A: sel.dimensionScores.potential || 0 }] : []

  if (!myApps.length) return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>📊</div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>No Applications Yet</div>
      <div style={{ color: 'var(--sub)', fontSize: 14 }}>Apply to jobs to see your score analytics here</div>
    </div>
  )

  return (
    <div className="fu">
      {showRoadmap && sel && <SkillRoadmapModal missingSkills={sel.missingSkills || []} onClose={() => setShowRoadmap(false)} />}
      <PageHdr title="My Applications & Analytics" sub={`${myApps.length} applications · AI score breakdown`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }} className="chart-grid">
        <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Score Distribution</div>
          <ResponsiveContainer width="100%" height={175}><BarChart data={distD} barSize={28}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} /><XAxis dataKey="r" tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip content={<ChartTip />} /><Bar dataKey="n" name="Apps" radius={[5, 5, 0, 0]}>{distD.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar></BarChart></ResponsiveContainer>
        </div>
        <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Application Status</div>
          <ResponsiveContainer width="100%" height={175}><PieChart><Pie data={statusD} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">{statusD.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} /></PieChart></ResponsiveContainer>
        </div>
        <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Score Trend</div>
          <ResponsiveContainer width="100%" height={175}><LineChart data={trendD}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" /><XAxis dataKey="n" tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTip />} /><Line type="monotone" dataKey="s" name="Score" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 5 }} /></LineChart></ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>All Applications (Best First)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {sorted.map((app, i) => (
              <div key={app.id} onClick={() => setSel(app)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 11, background: sel?.id === app.id ? 'rgba(59,130,246,.08)' : 'rgba(128,128,128,.04)', border: `1px solid ${sel?.id === app.id ? 'rgba(59,130,246,.25)' : 'var(--bord)'}`, cursor: 'pointer', transition: 'all .15s' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: i < 3 ? ['#F59E0B20', 'rgba(200,200,200,.1)', 'rgba(120,80,40,.15)'][i] : 'rgba(128,128,128,.07)', color: i < 3 ? ['#F59E0B', '#94A3B8', '#B45309'][i] : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? 14 : 10, fontWeight: 700, flexShrink: 0 }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle || 'Job'}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{app.company} · {app.appliedAt}</div></div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: (app.matchScore || 0) >= 80 ? '#10B981' : '#F59E0B', fontFamily: 'var(--mono)' }}>{app.matchScore || 0}%</div>
                  <span className={`tag ${app.status === 'shortlisted' ? 'tg' : 'to'}`} style={{ fontSize: 10 }}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {sel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <ScoreRing score={sel.matchScore || 0} size={90} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{sel.jobTitle || 'Application'}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', margin: '3px 0 8px' }}>{sel.company} · {sel.appliedAt}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span className={`tag ${sel.recommendation === 'Strong Recommend' ? 'tg' : 'tb'}`} style={{ fontSize: 11 }}>{sel.recommendation}</span>
                    <span className={`tag ${sel.status === 'shortlisted' ? 'tg' : 'to'}`} style={{ fontSize: 10 }}>{sel.status}</span>
                  </div>
                </div>
              </div>
              {sel.dimensionScores && Object.entries(sel.dimensionScores).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ textTransform: 'capitalize', color: 'var(--sub)' }}>{k}</span><span style={{ fontWeight: 700, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{v}%</span></div>
                  <div style={{ height: 5, background: 'rgba(128,128,128,.1)', borderRadius: 3 }}><div style={{ height: '100%', width: `${v}%`, background: `hsl(${v * 1.2},70%,55%)`, borderRadius: 3, transition: 'width 1s ease' }} /></div>
                </div>
              ))}
              {sel.missingSkills?.length > 0 && <button className="btn btn-g" style={{ marginTop: 12, fontSize: 12, width: '100%' }} onClick={() => setShowRoadmap(true)}>📈 View Skill Gap Roadmap</button>}
            </div>
            {radD.length > 0 && <div className="card"><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Competency Radar</div><ResponsiveContainer width="100%" height={175}><RadarChart data={radD}><PolarGrid stroke="rgba(128,128,128,.1)" /><PolarAngleAxis dataKey="s" tick={{ fill: 'var(--sub)', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 8 }} /><Radar dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer></div>}
            <div className="card">
              {sel.matchedKeywords?.length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', marginBottom: 7, textTransform: 'uppercase' }}>✓ Matched</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{sel.matchedKeywords.map(k => <span key={k} className="tag tg" style={{ fontSize: 10 }}>{k}</span>)}</div></div>}
              {sel.missingSkills?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)', marginBottom: 7, textTransform: 'uppercase' }}>✕ Missing</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{sel.missingSkills.map(k => <span key={k} className="tag tr" style={{ fontSize: 10 }}>{k}</span>)}</div></div>}
              {sel.overallFeedback && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--sub)', lineHeight: 1.7, fontStyle: 'italic' }}>"{sel.overallFeedback}"</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// GA OPTIMIZER (kept from original — full component)
// ─────────────────────────────────────────────────────────────────
function GAOptimizer({ db, myJobApps, toast }) {
  const POP_SIZE = 20, GENERATIONS = 40, CROSSOVER_P = 0.8, MUTATION_P = 0.15, MUTATION_S = 0.06, ELITISM = 2, TOURNAMENT_K = 3
  const [running, setRunning] = useState(false), [generation, setGen] = useState(0), [history, setHistory] = useState([])
  const [bestWeights, setBestWts] = useState({ skills: 0.40, experience: 0.30, education: 0.15, potential: 0.15 })
  const [done, setDone] = useState(false), [appliedWts, setAppliedWts] = useState(null), [activeTab, setTab] = useState('candidates'), [selApp, setSelApp] = useState(null)
  const allApps = db.applications, allJobs = db.jobs
  const getJob = id => allJobs.find(j => j.id === id) || {}
  const statCol = { pending: '#F59E0B', reviewed: '#3B82F6', shortlisted: '#10B981', rejected: '#EF4444' }
  const recCol = { 'Strong Recommend': '#10B981', 'Recommend': '#3B82F6', 'Consider': '#F59E0B', 'Not Recommended': '#EF4444' }
  const totalApps = allApps.length, withScore = allApps.filter(a => a.matchScore != null).length
  const avgScore = withScore ? Math.round(allApps.filter(a => a.matchScore != null).reduce((s, a) => s + (a.matchScore || 0), 0) / withScore) : 0
  const shortlisted = allApps.filter(a => a.status === 'shortlisted').length, withResume = allApps.filter(a => a.resumeFileName).length
  const scoreDistData = [
    { range: '90-100', count: allApps.filter(a => (a.matchScore || 0) >= 90).length, color: '#10B981' },
    { range: '75-89', count: allApps.filter(a => (a.matchScore || 0) >= 75 && (a.matchScore || 0) < 90).length, color: '#3B82F6' },
    { range: '60-74', count: allApps.filter(a => (a.matchScore || 0) >= 60 && (a.matchScore || 0) < 75).length, color: '#8B5CF6' },
    { range: '40-59', count: allApps.filter(a => (a.matchScore || 0) >= 40 && (a.matchScore || 0) < 60).length, color: '#F59E0B' },
    { range: '<40', count: allApps.filter(a => (a.matchScore || 0) < 40).length, color: '#EF4444' },
  ]
  const statusPieData = [
    { name: 'Pending', value: allApps.filter(a => a.status === 'pending').length, color: '#F59E0B' },
    { name: 'Reviewed', value: allApps.filter(a => a.status === 'reviewed').length, color: '#3B82F6' },
    { name: 'Shortlisted', value: allApps.filter(a => a.status === 'shortlisted').length, color: '#10B981' },
  ].filter(d => d.value > 0)
  const trainData = allApps.filter(a => a.matchScore != null).map(a => ({
    scores: a.dimensionScores || { skills: a.matchScore, experience: a.matchScore, education: a.matchScore, potential: a.matchScore },
    target: a.recommendation === 'Strong Recommend' ? 95 : a.recommendation === 'Recommend' ? 80 : a.recommendation === 'Consider' ? 65 : 40,
  }))
  const fitness = chrom => {
    if (!trainData.length) return Math.random() * 0.3 + 0.5
    const [ws, we, wu, wp] = chrom
    const predicted = trainData.map(d => ws * (d.scores.skills || 70) + we * (d.scores.experience || 70) + wu * (d.scores.education || 70) + wp * (d.scores.potential || 70))
    const targets = trainData.map(d => d.target)
    const n = predicted.length, mp = predicted.reduce((s, v) => s + v, 0) / n, mt = targets.reduce((s, v) => s + v, 0) / n
    let num = 0, dp = 0, dt = 0
    for (let i = 0; i < n; i++) { num += (predicted[i] - mp) * (targets[i] - mt); dp += (predicted[i] - mp) ** 2; dt += (targets[i] - mt) ** 2 }
    return Math.max(0, (dp * dt > 0 ? num / Math.sqrt(dp * dt) : 0) + 1) / 2
  }
  const randChrom = () => { const r = [Math.random(), Math.random(), Math.random(), Math.random()], s = r.reduce((a, b) => a + b, 0); return r.map(v => v / s) }
  const tournament = (pop, fits) => { let b = Math.floor(Math.random() * pop.length); for (let i = 1; i < TOURNAMENT_K; i++) { const c = Math.floor(Math.random() * pop.length); if (fits[c] > fits[b]) b = c } return pop[b] }
  const crossover = (a, b) => { if (Math.random() > CROSSOVER_P) return [...a]; const c = a.map((v, i) => Math.random() < .5 ? v : b[i]), s = c.reduce((x, y) => x + y, 0); return c.map(v => v / s) }
  const mutate = chrom => { const c = chrom.map(v => Math.random() < MUTATION_P ? Math.max(.05, Math.min(.65, v + (Math.random() * 2 - 1) * MUTATION_S)) : v), s = c.reduce((a, b) => a + b, 0); return c.map(v => v / s) }
  const diversity = pop => { let d = 0, cnt = 0; for (let i = 0; i < pop.length; i++) for (let j = i + 1; j < pop.length; j++) { d += pop[i].reduce((s, v, k) => s + Math.abs(v - pop[j][k]), 0); cnt++ } return cnt > 0 ? d / cnt : 0 }
  const runGA = async () => {
    setRunning(true); setDone(false); setHistory([]); setGen(0); setTab('ga')
    let pop = Array.from({ length: POP_SIZE }, randChrom), fits = pop.map(fitness), hist = []
    for (let g = 0; g < GENERATIONS; g++) {
      const ranked = [...pop.map((c, i) => ({ c, f: fits[i] }))].sort((a, b) => b.f - a.f)
      const bw = ranked[0].c
      hist = [...hist, { gen: g + 1, best: parseFloat((ranked[0].f * 100).toFixed(2)), avg: parseFloat((fits.reduce((s, v) => s + v, 0) / fits.length * 100).toFixed(2)), diversity: parseFloat((diversity(pop) * 100).toFixed(2)) }]
      setHistory([...hist]); setGen(g + 1)
      setBestWts({ skills: bw[0], experience: bw[1], education: bw[2], potential: bw[3] })
      const newPop = ranked.slice(0, ELITISM).map(r => r.c)
      while (newPop.length < POP_SIZE) { const p1 = tournament(pop, fits), p2 = tournament(pop, fits); newPop.push(mutate(crossover(p1, p2))) }
      pop = newPop; fits = pop.map(fitness)
      await new Promise(r => setTimeout(r, 60))
    }
    setDone(true); setRunning(false); toast('✅ GA converged — optimal weights found!', 'success')
  }
  const applyWeights = () => { setAppliedWts({ ...bestWeights }); toast('✅ GA weights applied!', 'success') }
  const fmtPct = v => `${(v * 100).toFixed(1)}%`
  const WLABELS = ['Skills', 'Experience', 'Education', 'Potential'], WCOLS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']
  const wArr = [bestWeights.skills, bestWeights.experience, bestWeights.education, bestWeights.potential]
  const TAB_BTN = (id, label, icon) => (
    <button key={id} onClick={() => setTab(id)} className="btn" style={{ fontSize: 13, padding: '9px 18px', fontWeight: activeTab === id ? 700 : 500, background: activeTab === id ? 'rgba(139,92,246,.15)' : 'transparent', color: activeTab === id ? '#8B5CF6' : 'var(--sub)', border: activeTab === id ? '1px solid rgba(139,92,246,.4)' : '1px solid transparent' }}>{icon} {label}</button>
  )

  return (
    <div className="fu">
      <PageHdr title="GA Resume Optimizer" sub="View applied candidates & run Genetic Algorithm to optimize scoring weights">
        {done && <button className="btn" onClick={applyWeights} style={{ background: 'rgba(16,185,129,.12)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)', fontWeight: 700 }}>✅ Apply Weights</button>}
        <button className="btn btn-p" onClick={runGA} disabled={running} style={{ opacity: running ? .6 : 1 }}>
          {running ? <><Spin /> Gen {generation}/{GENERATIONS}…</> : done ? '🔄 Re-run GA' : '▶ Run GA Optimizer'}
        </button>
      </PageHdr>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
        {[{ l: 'Total Applicants', v: totalApps, ic: 'users', col: '#3B82F6' }, { l: 'Resumes Uploaded', v: withResume, ic: 'up', col: '#8B5CF6' }, { l: 'AI Scores Given', v: withScore, ic: 'spark', col: '#10B981' }, { l: 'Shortlisted', v: shortlisted, ic: 'check', col: '#F59E0B' }, { l: 'Avg AI Score', v: `${avgScore}%`, ic: 'chart', col: '#06B6D4' }].map(({ l, v, ic, col }) => (
          <div key={l} className="statcard fu" style={{ padding: '14px 16px' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 44, height: 44, borderRadius: '0 14px 0 44px', background: `${col}12` }} />
            <Ic n={ic} s={16} c={col} />
            <div style={{ fontWeight: 800, fontSize: 24, fontFamily: 'var(--mono)', marginTop: 6, color: col }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--bord)', paddingBottom: 10 }}>
        {TAB_BTN('candidates', 'Applied Candidates', '👥')}
        {TAB_BTN('analytics', 'Score Analytics', '📊')}
        {TAB_BTN('ga', 'GA Optimizer', '🧬')}
      </div>

      {activeTab === 'candidates' && (
        <div>
          {allApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', border: '1px dashed var(--bord)', borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Applications Yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selApp ? '1fr 1.5fr' : '1fr', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>{allApps.length} APPLICATIONS — sorted by AI score</div>
                {[...allApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).map((app, idx) => {
                  const job = getJob(app.jobId), score = app.matchScore || 0
                  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'
                  const isSelected = selApp?.id === app.id
                  return (
                    <div key={app.id} onClick={() => setSelApp(isSelected ? null : app)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 13, border: `1px solid ${isSelected ? '#8B5CF650' : 'var(--bord)'}`, background: isSelected ? 'rgba(139,92,246,.07)' : 'rgba(128,128,128,.04)', cursor: 'pointer', transition: 'all .15s' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(128,128,128,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: idx < 3 ? 14 : 11, fontWeight: 700, flexShrink: 0 }}>{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}</div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${scoreColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: scoreColor, flexShrink: 0 }}>{app.candidateName?.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{app.candidateName}</div>
                        <div style={{ fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title || 'Job'} @ {app.company}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{app.resumeFileName ? <span style={{ color: '#10B981' }}>📎 {app.resumeFileName}</span> : <span style={{ color: '#F59E0B' }}>📝 Text resume</span>}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 20, fontFamily: 'var(--mono)', color: scoreColor, lineHeight: 1 }}>{score > 0 ? `${score}%` : '—'}</div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: `${statCol[app.status] || '#64748B'}20`, color: statCol[app.status] || '#64748B', fontWeight: 600, textTransform: 'capitalize' }}>{app.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {selApp && (() => {
                const score = selApp.matchScore || 0, sc = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'
                const dims = selApp.dimensionScores || {}, dimData = [{ name: 'Skills', value: dims.skills || score, color: '#3B82F6' }, { name: 'Experience', value: dims.experience || score, color: '#8B5CF6' }, { name: 'Education', value: dims.education || score, color: '#10B981' }, { name: 'Potential', value: dims.potential || score, color: '#F59E0B' }]
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="card" style={{ border: `1px solid ${sc}30` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${sc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: sc }}>{selApp.candidateName?.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 17 }}>{selApp.candidateName}</div><div style={{ fontSize: 12, color: 'var(--sub)' }}>{getJob(selApp.jobId).title || 'Job'} @ {selApp.company}</div></div>
                        <ScoreRing score={score} size={64} />
                      </div>
                      {score > 0 && dimData.map(d => (
                        <div key={d.name} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}><span style={{ color: d.color, fontWeight: 700 }}>{d.name}</span><span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: d.color }}>{d.value}%</span></div>
                          <div style={{ height: 7, background: 'rgba(128,128,128,.1)', borderRadius: 4 }}><div style={{ height: '100%', width: `${d.value}%`, background: d.color, borderRadius: 4, transition: 'width .6s ease' }} /></div>
                        </div>
                      ))}
                    </div>
                    {selApp.matchedKeywords?.length > 0 && <div className="card"><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>✅ Matched Keywords</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{selApp.matchedKeywords.map(k => <span key={k} style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#10B981', fontWeight: 600 }}>{k}</span>)}</div></div>}
                    {selApp.overallFeedback && <div className="card"><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🤖 AI Feedback</div><div style={{ fontSize: 12.5, color: 'var(--sub)', lineHeight: 1.75 }}>{selApp.overallFeedback}</div></div>}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Score Distribution</div><ResponsiveContainer width="100%" height={220}><BarChart data={scoreDistData} barSize={38}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} /><XAxis dataKey="range" tick={{ fill: 'var(--sub)', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTip />} /><Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]}>{scoreDistData.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Application Status</div><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={statusPieData} cx="50%" cy="46%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">{statusPieData.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie><Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} /></PieChart></ResponsiveContainer></div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Applications per Job</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allJobs.map(job => {
                const apps = allApps.filter(a => a.jobId === job.id), avg = apps.length ? Math.round(apps.reduce((s, a) => s + (a.matchScore || 0), 0) / apps.length) : 0
                return (
                  <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 11, background: 'rgba(128,128,128,.04)', border: '1px solid var(--bord)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💼</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{job.title}</div><div style={{ fontSize: 11, color: 'var(--sub)' }}>{job.company} · {job.location}</div></div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--mono)', color: '#8B5CF6' }}>{apps.length}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>applicants</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--mono)', color: avg >= 80 ? '#10B981' : avg >= 60 ? '#3B82F6' : '#F59E0B' }}>{avg > 0 ? `${avg}%` : '—'}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>avg score</div></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ga' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 16 }}>
            {[{ icon: '🧬', label: 'Population', val: `${POP_SIZE} chromosomes`, col: '#3B82F6' }, { icon: '⚡', label: 'Generations', val: `${GENERATIONS} iterations`, col: '#8B5CF6' }, { icon: '🎯', label: 'Selection', val: 'Tournament k=3', col: '#10B981' }, { icon: '🔀', label: 'Crossover', val: `Uniform p=${CROSSOVER_P}`, col: '#F59E0B' }, { icon: '🔬', label: 'Mutation', val: `Gaussian σ=${MUTATION_S}`, col: '#06B6D4' }].map(({ icon, label, val, col }) => (
              <div key={label} className="statcard fu" style={{ padding: '14px 16px' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 44, height: 44, borderRadius: '0 14px 0 44px', background: `${col}12` }} />
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, fontFamily: 'var(--mono)', marginTop: 6, color: col }}>{val}</div>
                <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {!done && !running && (
            <div className="card" style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--bord)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🧬</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ready to Evolve</div>
              <div style={{ color: 'var(--sub)', fontSize: 13, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>Training on <strong style={{ color: 'var(--text)' }}>{trainData.length} real applications</strong>. The GA will discover optimal weights for fair candidate scoring.</div>
              <button className="btn btn-p" onClick={runGA} style={{ marginTop: 20, padding: '12px 28px', fontSize: 14 }}>▶ Start GA Optimization</button>
            </div>
          )}
          {(running || done) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Convergence — Gen {generation}/{GENERATIONS}</div><ResponsiveContainer width="100%" height={210}><LineChart data={history}><CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} /><XAxis dataKey="gen" tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: 'var(--sub)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTip />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--sub)' }} /><Line type="monotone" dataKey="best" stroke="#10B981" strokeWidth={2.5} dot={false} name="Best Fitness %" /><Line type="monotone" dataKey="avg" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="Avg Fitness %" /></LineChart></ResponsiveContainer></div>
                <div className="card"><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🏆 GA-Optimized Weights</div>
                  {WLABELS.map((l, i) => {
                    const def = [40, 30, 15, 15][i]
                    return (
                      <div key={l} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                          <span style={{ color: WCOLS[i], fontWeight: 700 }}>{l}</span>
                          <div style={{ display: 'flex', gap: 12 }}><span style={{ color: 'var(--muted)' }}>Default: {def}%</span><span style={{ color: WCOLS[i], fontWeight: 700 }}>GA: {fmtPct(wArr[i])}</span></div>
                        </div>
                        <div style={{ height: 7, background: 'rgba(128,128,128,.1)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${def / 70 * 100}%`, background: 'rgba(128,128,128,.2)', borderRadius: 4 }} />
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${wArr[i] / 0.7 * 100}%`, background: WCOLS[i], borderRadius: 4, transition: 'width .4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {appliedWts && (
                <div className="card" style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#10B981', marginBottom: 8 }}>✅ GA Weights Applied</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
                    {WLABELS.map((l, i) => <span key={l} style={{ background: `${WCOLS[i]}15`, border: `1px solid ${WCOLS[i]}30`, borderRadius: 8, padding: '5px 12px', color: WCOLS[i], fontWeight: 700 }}>{l}: {fmtPct([appliedWts.skills, appliedWts.experience, appliedWts.education, appliedWts.potential][i])}</span>)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
