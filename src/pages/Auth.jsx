// pages/Auth.jsx — Login, Register, ForgotPassword
import { useState, useEffect } from 'react'
import { Ic, Spin } from '../components/UI.jsx'

// ── Login ─────────────────────────────────────────────────────────────────────
export function Login({ go, initRole, db, setUser, toast }) {
  const [role, setRole]     = useState(initRole || 'candidate')
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')

  useEffect(() => { if (initRole) setRole(initRole) }, [initRole])

  const DEMOS = {
    candidate: { email: 'rahul@demo.com',       password: 'demo123'   },
    hr:        { email: 'hr@techcorp.com',       password: 'admin123'  },
  }

  const fill = () => setForm(DEMOS[role] || DEMOS.candidate)

  const submit = () => {
    setErr('')
    if (!form.email.trim() || !form.password.trim()) { setErr('Please fill both fields.'); return }
    setLoading(true)
    setTimeout(() => {
      const found = db.users.find(u =>
        u.email.trim().toLowerCase() === form.email.trim().toLowerCase() &&
        u.password === form.password &&
        u.role === role
      )
      if (found) {
        setUser(found)
        toast(`Welcome back, ${found.name}! 👋`)
        if (role === 'hr')   go('h-dash')
        else                  go('c-dash')
      } else {
        const any = db.users.find(u => u.email.trim().toLowerCase() === form.email.trim().toLowerCase())
        if (any && any.role !== role) setErr(`This email belongs to a "${any.role}" account. Switch role above.`)
        else if (any)                 setErr('Wrong password. Please try again.')
        else                          setErr('Email not found. Please register first.')
      }
      setLoading(false)
    }, 700)
  }

  const ROLES = [
    { v: 'candidate', l: '👤 Candidate', h: 'Job seeker',  grad: 'linear-gradient(135deg,#3B82F6,#2563EB)' },
    { v: 'hr',        l: '🏢 HR Admin',  h: 'Recruiter',   grad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
  ]

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} className="grid-bg">
      <div style={{ width:'100%', maxWidth:470 }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ic n="spark" s={18} c="white"/>
            </div>
            <span style={{ fontWeight:800, fontSize:20 }}>FairRank <span style={{ color:'var(--blue)' }}>AI</span></span>
          </div>
          <div style={{ fontWeight:700, fontSize:24, letterSpacing:'-.02em' }}>Welcome back</div>
          <div style={{ color:'var(--sub)', fontSize:14, marginTop:4 }}>Sign in to your account</div>
        </div>

        <div className="glass" style={{ borderRadius:20, padding:30 }}>
          {/* Role tabs */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--sub)', marginBottom:7, letterSpacing:'.05em', textTransform:'uppercase' }}>Login as</div>
            <div style={{ display:'flex', background:'rgba(0,0,0,.04)', borderRadius:12, padding:4, gap:3 }}>
              {ROLES.map(({ v, l, h, grad }) => (
                <button key={v} onClick={() => { setRole(v); setErr(''); setForm({ email:'', password:'' }) }}
                  style={{ flex:1, padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontWeight:700, fontSize:12, transition:'all .2s',
                    background: role===v ? grad : 'transparent',
                    color: role===v ? 'white' : 'var(--sub)',
                    boxShadow: role===v ? '0 4px 14px rgba(59,130,246,.2)' : 'none' }}>
                  {l}
                  <div style={{ fontSize:10, fontWeight:400, opacity:.75, marginTop:1 }}>{h}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Demo hint */}
          <div style={{ background:'rgba(59,130,246,.07)', border:'1px solid rgba(59,130,246,.18)', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--blue)', marginBottom:2 }}>Demo ({role})</div>
              <div style={{ fontSize:11, color:'var(--sub)', fontFamily:'var(--mono)' }}>
                {DEMOS[role]?.email} / {DEMOS[role]?.password}
              </div>
            </div>
            <button onClick={fill} className="btn" style={{ fontSize:11, padding:'6px 12px', background:'rgba(59,130,246,.15)', color:'var(--blue)', border:'1px solid rgba(59,130,246,.25)' }}>Fill →</button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {[
              { k:'email',    l:'Email',    ic:'mail', t:'email',    ph: DEMOS[role]?.email    },
              { k:'password', l:'Password', ic:'lock', t:'password', ph: DEMOS[role]?.password },
            ].map(({ k, l, ic, t, ph }) => (
              <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--sub)', letterSpacing:'.05em', textTransform:'uppercase' }}>{l}</label>
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n={ic} s={14}/></div>
                  <input type={k==='password' && showPw ? 'text' : t} placeholder={ph} value={form[k]}
                    onChange={e => { setForm(p => ({ ...p, [k]: e.target.value })); setErr('') }}
                    style={{ paddingLeft:36, paddingRight: k==='password' ? 40 : 14, paddingTop:10, paddingBottom:10, borderRadius:10, width:'100%' }}
                    onKeyDown={e => e.key==='Enter' && submit()} />
                  {k==='password' && (
                    <button onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer' }}>
                      <Ic n={showPw ? 'eyeoff' : 'eye'} s={14}/>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {err && <div className="err-box"><span>⚠</span> {err}</div>}

            {/* Forgot password link */}
            <div style={{ textAlign:'right', marginTop:-6 }}>
              <span style={{ color:'var(--blue)', fontSize:12, cursor:'pointer', fontWeight:600 }} onClick={() => go('forgot-password')}>
                Forgot password?
              </span>
            </div>

            <button className="btn" disabled={loading} onClick={submit}
              style={{ padding:'13px 0', width:'100%', justifyContent:'center', fontSize:14, marginTop:2,
                background: role==='hr' ? 'linear-gradient(135deg,#8B5CF6,#6D28D9)' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                color:'#fff', boxShadow:'0 4px 20px rgba(59,130,246,.25)' }}>
              {loading ? <Spin/> : <><Ic n="arr" s={15}/> Sign In as {role==='hr' ? 'HR Admin' : 'Candidate'}</>}
            </button>
          </div>

          <div style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--sub)' }}>
              No account?{' '}
              <span style={{ color:'var(--blue)', cursor:'pointer', fontWeight:600 }} onClick={() => go('register')}>Register here</span>
            </div>
        </div>

        <div style={{ textAlign:'center', marginTop:14 }}>
          <span style={{ color:'var(--blue)', cursor:'pointer', fontSize:13 }} onClick={() => go('landing')}>← Back to Home</span>
        </div>
      </div>
    </div>
  )
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export function ForgotPassword({ go, db, updateUserPassword, toast }) {
  const [step, setStep]       = useState(1) // 1=enter email, 2=enter code+new pw
  const [email, setEmail]     = useState('')
  const [code, setCode]       = useState('')
  const [genCode, setGenCode] = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  const sendCode = () => {
    setErr('')
    if (!email.trim()) { setErr('Please enter your email.'); return }
    const user = db.users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase())
    if (!user) { setErr('No account found with this email.'); return }
    setLoading(true)
    setTimeout(() => {
      const c = String(Math.floor(1000 + Math.random() * 9000))
      setGenCode(c)
      setStep(2)
      setLoading(false)
      toast(`Reset code generated! (See code below — in production this would be emailed)`, 'info')
    }, 800)
  }

  const resetPw = () => {
    setErr('')
    if (code !== genCode) { setErr('Invalid reset code. Please check and try again.'); return }
    if (newPw.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setErr("Passwords don't match."); return }
    setLoading(true)
    setTimeout(() => {
      updateUserPassword(email.trim().toLowerCase(), newPw)
      toast('Password reset successfully! Please log in with your new password.')
      go('login')
      setLoading(false)
    }, 700)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} className="grid-bg">
      <div style={{ width:'100%', maxWidth:440 }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ic n="lock" s={17} c="white"/>
            </div>
            <span style={{ fontWeight:800, fontSize:20 }}>FairRank <span style={{ color:'var(--blue)' }}>AI</span></span>
          </div>
          <div style={{ fontWeight:700, fontSize:24, letterSpacing:'-.02em' }}>Reset Password</div>
          <div style={{ color:'var(--sub)', fontSize:14, marginTop:4 }}>
            {step===1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:6, marginBottom:22, justifyContent:'center' }}>
          {[1,2].map(s => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12,
                background: step>=s ? 'var(--blue)' : 'rgba(255,255,255,.08)',
                color: step>=s ? 'white' : 'var(--muted)', transition:'all .3s' }}>{s}</div>
              {s<2 && <div style={{ width:40, height:2, background: step>s ? 'var(--blue)' : 'rgba(255,255,255,.1)', borderRadius:2, transition:'all .3s' }}/>}
            </div>
          ))}
        </div>

        <div className="glass" style={{ borderRadius:20, padding:30 }}>
          {step===1 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--sub)', letterSpacing:'.05em', textTransform:'uppercase' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n="mail" s={14}/></div>
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => { setEmail(e.target.value); setErr('') }}
                    style={{ paddingLeft:36, paddingTop:10, paddingBottom:10, borderRadius:10, width:'100%' }}
                    onKeyDown={e => e.key==='Enter' && sendCode()} />
                </div>
              </div>
              {err && <div className="err-box"><span>⚠</span> {err}</div>}
              <button className="btn btn-p" disabled={loading} onClick={sendCode} style={{ padding:'13px 0', width:'100%', justifyContent:'center', fontSize:14 }}>
                {loading ? <Spin/> : <><Ic n="send" s={14}/> Send Reset Code</>}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Show code (simulated email) */}
              <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#FCD34D', fontWeight:600, marginBottom:6 }}>📧 Reset Code (Simulated Email)</div>
                <div style={{ fontSize:32, fontWeight:800, fontFamily:'var(--mono)', color:'#F59E0B', letterSpacing:8 }}>{genCode}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>In production this would be sent to {email}</div>
              </div>

              {[
                { k:'code',      l:'Enter Reset Code', ic:'shield', t:'text',     ph:'4-digit code', val:code,      set:setCode      },
                { k:'newPw',     l:'New Password',     ic:'lock',   t:'password', ph:'Min 6 chars',  val:newPw,     set:setNewPw     },
                { k:'confirmPw', l:'Confirm Password', ic:'lock',   t:'password', ph:'Repeat password', val:confirmPw, set:setConfirmPw },
              ].map(({ k, l, ic, t, ph, val, set }) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--sub)', letterSpacing:'.05em', textTransform:'uppercase' }}>{l}</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n={ic} s={14}/></div>
                    <input type={t==='password' && showPw ? 'text' : t} placeholder={ph} value={val}
                      onChange={e => { set(e.target.value); setErr('') }}
                      style={{ paddingLeft:36, paddingTop:10, paddingBottom:10, borderRadius:10, width:'100%' }}
                      onKeyDown={e => e.key==='Enter' && resetPw()} />
                  </div>
                </div>
              ))}

              <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => setShowPw(!showPw)}>
                <div style={{ width:15, height:15, border:'1px solid var(--bord)', borderRadius:3, background:showPw?'var(--blue)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>
                  {showPw && <Ic n="check" s={10} c="white"/>}
                </div>
                <span style={{ fontSize:12, color:'var(--sub)' }}>Show passwords</span>
              </div>

              {err && <div className="err-box"><span>⚠</span> {err}</div>}

              <button className="btn btn-p" disabled={loading} onClick={resetPw} style={{ padding:'13px 0', width:'100%', justifyContent:'center', fontSize:14 }}>
                {loading ? <Spin/> : <><Ic n="lock" s={14}/> Reset Password</>}
              </button>

              <button className="btn btn-g" onClick={() => setStep(1)} style={{ padding:'10px 0', width:'100%', justifyContent:'center', fontSize:13 }}>
                ← Back
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:14 }}>
          <span style={{ color:'var(--blue)', cursor:'pointer', fontSize:13 }} onClick={() => go('login')}>← Back to Login</span>
        </div>
      </div>
    </div>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────
export function Register({ go, db, addUser, setUser, toast }) {
  const [form, setForm]     = useState({ name:'', phone:'', email:'', password:'', confirm:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')

  const submit = () => {
    setErr('')
    if (!form.name.trim()||!form.phone.trim()||!form.email.trim()||!form.password.trim()) { setErr('All fields are required.'); return }
    if (form.password !== form.confirm) { setErr("Passwords don't match."); return }
    if (form.password.length < 6) { setErr('Password must be 6+ characters.'); return }
    if (db.users.find(u => u.email.trim().toLowerCase() === form.email.trim().toLowerCase())) { setErr('Email already registered.'); return }
    setLoading(true)
    setTimeout(() => {
      const avatar = form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
      const nu = { id:`u_${Date.now()}`, name:form.name.trim(), phone:form.phone.trim(), email:form.email.trim(), password:form.password, role:'candidate', avatar, registeredAt:new Date().toISOString() }
      addUser(nu); setUser(nu)
      toast(`Welcome, ${nu.name}! 🎉`)
      go('c-dash')
      setLoading(false)
    }, 800)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} className="grid-bg">
      <div style={{ width:'100%', maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}><Ic n="spark" s={17} c="white"/></div>
            <span style={{ fontWeight:800, fontSize:20 }}>FairRank <span style={{ color:'var(--blue)' }}>AI</span></span>
          </div>
          <div style={{ fontWeight:700, fontSize:24, letterSpacing:'-.02em' }}>Create Account</div>
          <div style={{ color:'var(--sub)', fontSize:14, marginTop:4 }}>Free forever · No credit card needed</div>
        </div>

        <div className="glass" style={{ borderRadius:20, padding:30 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
            {[
              { k:'name',    l:'Full Name',        ic:'user',  ph:'Rahul Sharma',    t:'text',     full:false },
              { k:'phone',   l:'Phone',            ic:'phone', ph:'9876543210',       t:'tel',      full:false },
              { k:'email',   l:'Email',            ic:'mail',  ph:'rahul@email.com',  t:'email',    full:true  },
              { k:'password', l:'Password',        ic:'lock',  ph:'Min 6 characters', t:'password', full:false },
              { k:'confirm', l:'Confirm Password', ic:'lock',  ph:'Repeat password',  t:'password', full:false },
            ].map(({ k, l, ic, ph, t, full }) => (
              <div key={k} style={{ display:'flex', flexDirection:'column', gap:5, gridColumn:full?'1/-1':'auto' }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--sub)', letterSpacing:'.05em', textTransform:'uppercase' }}>{l}</label>
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }}><Ic n={ic} s={13}/></div>
                  <input type={(k==='password'||k==='confirm')&&showPw?'text':t} placeholder={ph} value={form[k]}
                    onChange={e => { setForm(p => ({ ...p, [k]:e.target.value })); setErr('') }}
                    style={{ paddingLeft:33, paddingTop:10, paddingBottom:10, borderRadius:10, width:'100%', fontSize:13 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, marginBottom:14, cursor:'pointer' }} onClick={() => setShowPw(!showPw)}>
            <div style={{ width:15, height:15, border:'1px solid var(--bord)', borderRadius:3, background:showPw?'var(--blue)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>
              {showPw && <Ic n="check" s={10} c="white"/>}
            </div>
            <span style={{ fontSize:12, color:'var(--sub)' }}>Show passwords</span>
          </div>

          {err && <div className="err-box" style={{ marginBottom:14 }}><span>⚠</span> {err}</div>}

          <button className="btn btn-p" disabled={loading} onClick={submit} style={{ padding:'13px 0', width:'100%', justifyContent:'center', fontSize:14 }}>
            {loading ? <Spin/> : <><Ic n="user" s={14}/> Create Account &amp; Sign In</>}
          </button>
          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--sub)' }}>
            Already registered? <span style={{ color:'var(--blue)', cursor:'pointer', fontWeight:600 }} onClick={() => go('login')}>Sign in</span>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:14 }}>
          <span style={{ color:'var(--blue)', cursor:'pointer', fontSize:13 }} onClick={() => go('landing')}>← Back to Home</span>
        </div>
      </div>
    </div>
  )
}
