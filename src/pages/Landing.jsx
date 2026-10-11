import { useState, useEffect, useRef } from 'react'

// ── Fanned resume cards SVG ────────────────────────────────────────
function FannedResumeCards() {
  const cards = [
    { rotate: -18, x: -120, y: 20,  z: 1, color: '#e8f0fe', accent: '#1e40af', name: 'Aryan Sharma',    role: 'ML Engineer',          score: 95, skills: ['Python','TensorFlow','AWS'] },
    { rotate: -8,  x: -55,  y: 8,   z: 2, color: '#f0fdf4', accent: '#065f46', name: 'Kavya Reddy',     role: 'Data Scientist',        score: 81, skills: ['Scikit-learn','SQL','Flask'] },
    { rotate: 0,   x: 0,    y: 0,   z: 5, color: '#fffbeb', accent: '#b45309', name: 'Rahul Mehta',     role: 'Frontend Developer',    score: 74, skills: ['React','TypeScript','CSS'] },
    { rotate: 9,   x: 55,   y: 8,   z: 2, color: '#fdf4ff', accent: '#7e22ce', name: 'Priya Nair',      role: 'DevOps Engineer',       score: 88, skills: ['Docker','K8s','CI/CD'] },
    { rotate: 18,  x: 118,  y: 20,  z: 1, color: '#fff1f2', accent: '#be123c', name: 'Vikram Singh',    role: 'Backend Developer',     score: 67, skills: ['Node.js','MongoDB','REST'] },
  ]

  return (
    <div style={{ position:'relative', width:520, height:320, margin:'0 auto', perspective: 1200 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: 180, height: 240,
          transform: `translate(-50%,-50%) translateX(${c.x}px) translateY(${c.y}px) rotate(${c.rotate}deg)`,
          zIndex: c.z,
          borderRadius: 14,
          background: c.color,
          border: `1.5px solid ${c.accent}22`,
          boxShadow: `0 ${4+c.z*2}px ${16+c.z*6}px rgba(0,0,0,.${8+c.z*2}), 0 1px 0 rgba(255,255,255,.9) inset`,
          padding: '14px 14px 10px',
          fontFamily: 'system-ui,sans-serif',
          transition: 'all .3s',
          overflow: 'hidden',
        }}>
          {/* Card header bar */}
          <div style={{ height:6, borderRadius:3, background:`linear-gradient(90deg,${c.accent},${c.accent}88)`, marginBottom:10 }}/>

          {/* Avatar + name */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%',
              background:`${c.accent}18`, border:`1.5px solid ${c.accent}40`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:800, color:c.accent, flexShrink:0 }}>
              {c.name.split(' ').map(w=>w[0]).join('')}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:11, color:'#111', lineHeight:1.2 }}>{c.name}</div>
              <div style={{ fontSize:9.5, color:'#666', marginTop:1 }}>{c.role}</div>
            </div>
          </div>

          {/* Fake text lines */}
          {[80,65,90,55,75].map((w,j) => (
            <div key={j} style={{ height:5, borderRadius:3, marginBottom:5,
              background: j===0?`${c.accent}25`:'rgba(0,0,0,.07)', width:`${w}%` }}/>
          ))}

          {/* Skills chips */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:8 }}>
            {c.skills.map(s => (
              <span key={s} style={{ fontSize:8, padding:'2px 6px', borderRadius:100,
                background:`${c.accent}15`, color:c.accent, fontWeight:700, border:`1px solid ${c.accent}25` }}>
                {s}
              </span>
            ))}
          </div>

          {/* AI Score badge */}
          <div style={{ position:'absolute', bottom:10, right:10,
            width:38, height:38, borderRadius:'50%',
            background: c.score>=85?'#dcfce7': c.score>=70?'#dbeafe':'#fef3c7',
            border: `2px solid ${c.score>=85?'#86efac':c.score>=70?'#93c5fd':'#fcd34d'}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', }}>
            <div style={{ fontWeight:800, fontSize:11, lineHeight:1,
              color: c.score>=85?'#065f46':c.score>=70?'#1e40af':'#b45309' }}>{c.score}%</div>
            <div style={{ fontSize:6.5, color:'#888', fontWeight:600 }}>AI</div>
          </div>

          {/* Watermark diagonal text */}
          <div style={{ position:'absolute', bottom:20, left:0, right:0, textAlign:'center',
            fontSize:7, color:`${c.accent}18`, fontWeight:900, textTransform:'uppercase',
            letterSpacing:'.2em', transform:'rotate(-20deg)', pointerEvents:'none' }}>
            FAIRRANK AI
          </div>
        </div>
      ))}

      {/* Shadow under the stack */}
      <div style={{ position:'absolute', bottom:-20, left:'50%', transform:'translateX(-50%)',
        width:300, height:30, borderRadius:'50%',
        background:'radial-gradient(ellipse,rgba(0,0,0,.15),transparent 70%)',
        pointerEvents:'none' }}/>
    </div>
  )
}

// ── Main Landing ───────────────────────────────────────────────────
export default function Landing({ go, setLoginRole }) {
  const [hovered, setHovered] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setScrollY(el.scrollTop)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const stats = [
    { val:'94%',  label:'Scoring Accuracy', icon:'🎯', color:'#1e40af' },
    { val:'200+', label:'Skill Synonyms',    icon:'🔗', color:'#7e22ce' },
    { val:'< 5s', label:'Analysis Speed',    icon:'⚡', color:'#b45309' },
    { val:'0',    label:'Bias Detected',     icon:'🛡️', color:'#065f46' },
  ]

  const features = [
    { icon:'📎', c:'#1e40af', bg:'#eff6ff', bd:'#bfdbfe', title:'Multi-Format Upload',    desc:'PDF, PNG, JPG, DOCX — AI reads every resume format in under 5 seconds.' },
    { icon:'🧬', c:'#7e22ce', bg:'#faf5ff', bd:'#e9d5ff', title:'GA Weight Optimizer',    desc:'Genetic Algorithm evolves optimal scoring weights from real hiring data.' },
    { icon:'🔑', c:'#b45309', bg:'#fffbeb', bd:'#fde68a', title:'Algorithmic Recourse',   desc:'World\'s first: exact minimum change a candidate needs to get shortlisted.' },
    { icon:'🛡️', c:'#065f46', bg:'#f0fdf4', bd:'#a7f3d0', title:'BAERE™ Fairness Engine', desc:'Strips all demographics before every AI analysis. EEOC & EU AI Act 2024.' },
    { icon:'📊', c:'#9f1239', bg:'#fff1f2', bd:'#fecdd3', title:'8-Chart HR Analytics',   desc:'Bar, Pie, Radar, Line, Area charts across your full talent pipeline.' },
    { icon:'📄', c:'#0369a1', bg:'#f0f9ff', bd:'#bae6fd', title:'Resume Builder',         desc:'3 professional templates with live preview and one-click PDF export.' },
  ]

  return (
    <div ref={containerRef} style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif",
      background: `
        radial-gradient(ellipse at 15% 30%, rgba(219,234,254,.65) 0%, transparent 45%),
        radial-gradient(ellipse at 85% 60%, rgba(233,213,255,.55) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 95%, rgba(254,249,195,.45) 0%, transparent 35%),
        linear-gradient(150deg,#fefefe 0%,#f8faff 35%,#f4f0ff 65%,#fafaf5 100%)
      `,
      position: 'relative',
      color: '#111',
    }}>

      {/* Paper ruled lines */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,
        backgroundImage:'repeating-linear-gradient(transparent,transparent 39px,rgba(99,102,241,.045) 39px,rgba(99,102,241,.045) 40px)',
        backgroundPosition:'0 80px' }}/>

      {/* Dot grid */}
      <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:0,
        backgroundImage:'radial-gradient(circle,rgba(99,102,241,.06) 1px,transparent 1px)',
        backgroundSize:'28px 28px', opacity:.6 }}/>

      {/* Red margin line */}
      <div style={{ position:'fixed',top:0,bottom:0,left:72,width:1.5,
        background:'rgba(248,113,113,.28)',pointerEvents:'none',zIndex:0 }}/>

      {/* Watermark */}
      <div style={{ position:'fixed',top:'48%',left:'50%',
        transform:'translate(-50%,-50%) rotate(-28deg)',
        fontSize:'clamp(52px,9vw,110px)',fontWeight:900,
        color:'rgba(99,102,241,.032)',letterSpacing:'-.03em',
        pointerEvents:'none',zIndex:0,userSelect:'none',whiteSpace:'nowrap',
        textTransform:'uppercase' }}>FairRank AI</div>

      {/* Stamp */}
      <div style={{ position:'fixed',top:24,right:36,width:78,height:78,
        border:'2px solid rgba(99,102,241,.18)',borderRadius:'50%',
        display:'flex',alignItems:'center',justifyContent:'center',
        transform:'rotate(14deg)',pointerEvents:'none',zIndex:2 }}>
        <div style={{ textAlign:'center',fontSize:7.5,color:'rgba(99,102,241,.38)',
          fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',lineHeight:1.5 }}>
          BAERE™<br/>CERTIFIED<br/>FAIR
        </div>
      </div>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position:'sticky',top:0,zIndex:100,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:`14px clamp(20px,4vw,64px)`,
        background: scrollY>20 ? 'rgba(255,255,255,.93)' : 'rgba(255,255,255,.7)',
        backdropFilter:'blur(14px)',
        borderBottom:`1px solid ${scrollY>20?'rgba(99,102,241,.12)':'transparent'}`,
        boxShadow: scrollY>20 ? '0 2px 20px rgba(99,102,241,.07)' : 'none',
        transition:'all .3s',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:38,height:38,borderRadius:10,fontSize:18,
            background:'linear-gradient(135deg,#1e40af,#7c3aed)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 4px 16px rgba(30,64,175,.3)' }}>✦</div>
          <div>
            <div style={{ fontWeight:800,fontSize:17,color:'#111',letterSpacing:'-.02em' }}>
              FairRank <span style={{ color:'#1e40af' }}>AI</span>
            </div>
            <div style={{ fontSize:9,color:'#9ca3af',textTransform:'uppercase',
              letterSpacing:'.12em',marginTop:-1 }}>Smart Resume Screener</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {[['v5.0','#1e40af','#eff6ff','#bfdbfe'],['Ethical AI','#065f46','#f0fdf4','#a7f3d0'],['Bias-Free','#7c3aed','#faf5ff','#e9d5ff']].map(([t,tc,bg,bd])=>(
            <span key={t} style={{ fontSize:10,padding:'3px 10px',borderRadius:100,fontWeight:700,
              background:bg,color:tc,border:`1px solid ${bd}`,textTransform:'uppercase',letterSpacing:'.06em' }}>{t}</span>
          ))}
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>{setLoginRole('candidate');go('login')}} style={{
            padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',
            background:'#eff6ff',color:'#1e40af',border:'1px solid #bfdbfe',transition:'all .2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'}
            onMouseLeave={e=>e.currentTarget.style.background='#eff6ff'}>
            Candidate Login
          </button>
          <button onClick={()=>{setLoginRole('hr');go('login')}} style={{
            padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',
            background:'linear-gradient(135deg,#1e40af,#7c3aed)',color:'#fff',border:'none',
            boxShadow:'0 2px 12px rgba(30,64,175,.3)',transition:'all .2s' }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 22px rgba(30,64,175,.45)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(30,64,175,.3)'}>
            HR Login →
          </button>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{ position:'relative',zIndex:5,
        display:'grid',gridTemplateColumns:'1fr 1fr',
        alignItems:'center',gap:'clamp(24px,4vw,48px)',
        padding:'clamp(48px,7vh,80px) clamp(32px,5vw,80px) clamp(32px,4vh,56px)',
        maxWidth:1200,margin:'0 auto' }}>

        {/* Left — text */}
        <div>
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,
            padding:'8px 18px',borderRadius:100,marginBottom:28,
            background:'rgba(180,83,9,.07)',border:'1px solid rgba(180,83,9,.2)',
            fontSize:12,color:'#92400e',fontWeight:700,letterSpacing:'.04em' }}>
            🏆 BAERE™ — Bias-Aware Explainable AI Ranking Engine
          </div>

          <h1 style={{ fontSize:'clamp(38px,5vw,68px)',fontWeight:800,
            letterSpacing:'-.04em',lineHeight:1.06,color:'#111',
            margin:'0 0 20px',animation:'fadeUp .7s ease both' }}>
            Screen Smarter.{' '}
            <span style={{ background:'linear-gradient(135deg,#1e40af 0%,#7c3aed 50%,#065f46 100%)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
              backgroundSize:'200% 200%',animation:'gradShift 6s ease infinite' }}>
              Hire Fairer.
            </span>
          </h1>

          <p style={{ fontSize:'clamp(14px,1.4vw,17px)',color:'#4b5563',
            lineHeight:1.8,marginBottom:36,animation:'fadeUp .7s ease .1s both' }}>
            Upload <strong style={{color:'#111'}}>PDF, JPG, PNG or DOC</strong> resumes.
            Get <strong style={{color:'#1e40af'}}>AI-powered rankings</strong>,{' '}
            <strong style={{color:'#065f46'}}>bias detection</strong>, and the world's first{' '}
            <strong style={{color:'#b45309'}}>Algorithmic Recourse Engine</strong>.
          </p>

          <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:22,
            animation:'fadeUp .7s ease .2s both' }}>
            <button onClick={()=>{setLoginRole('candidate');go('register')}} style={{
              padding:'13px 28px',fontSize:14,fontWeight:700,borderRadius:10,cursor:'pointer',
              background:'linear-gradient(135deg,#1e40af,#7c3aed)',color:'#fff',border:'none',
              boxShadow:'0 4px 20px rgba(30,64,175,.35)',transition:'all .2s',
              display:'flex',alignItems:'center',gap:8 }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(30,64,175,.45)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(30,64,175,.35)'}}>
              👤 Register as Candidate
            </button>
            <button onClick={()=>{setLoginRole('hr');go('login')}} style={{
              padding:'13px 28px',fontSize:14,fontWeight:700,borderRadius:10,cursor:'pointer',
              background:'#fff',color:'#1e40af',border:'1.5px solid #bfdbfe',
              boxShadow:'0 2px 12px rgba(30,64,175,.1)',transition:'all .2s',
              display:'flex',alignItems:'center',gap:8 }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.background='#eff6ff'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.background='#fff'}}>
              🏢 HR Portal →
            </button>
          </div>

          <div style={{ fontSize:12,color:'#9ca3af',animation:'fadeUp .7s ease .3s both' }}>
            Demo — HR:{' '}
            <code style={{ background:'rgba(0,0,0,.05)',padding:'2px 6px',borderRadius:4,fontSize:11,color:'#374151' }}>hr@techcorp.com / admin123</code>
            &ensp;·&ensp; Candidate:{' '}
            <code style={{ background:'rgba(0,0,0,.05)',padding:'2px 6px',borderRadius:4,fontSize:11,color:'#374151' }}>rahul@demo.com / demo123</code>
          </div>
        </div>

        {/* Right — fanned resume cards */}
        <div style={{ display:'flex',justifyContent:'center',alignItems:'center',
          animation:'fadeUp .8s ease .15s both',position:'relative' }}>
          <FannedResumeCards />
          {/* Label under cards */}
          <div style={{ position:'absolute',bottom:-32,left:'50%',transform:'translateX(-50%)',
            fontSize:11,color:'#9ca3af',fontStyle:'italic',whiteSpace:'nowrap' }}>
            AI-scored résumés · ranked by FairRank AI
          </div>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section style={{ position:'relative',zIndex:5,
        maxWidth:900,margin:'0 auto clamp(0px,2vh,8px)',
        padding:'0 clamp(20px,4vw,64px)' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
          background:'rgba(255,255,255,.75)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(99,102,241,.1)',borderRadius:20,overflow:'hidden',
          boxShadow:'0 4px 28px rgba(99,102,241,.07)' }}>
          {stats.map(({val,label,icon,color},i)=>(
            <div key={label} style={{ textAlign:'center',padding:'24px 8px',
              borderRight:i<3?'1px solid rgba(99,102,241,.08)':'none' }}>
              <div style={{ fontSize:20,marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:'clamp(22px,2.5vw,34px)',fontWeight:800,color,letterSpacing:'-.03em' }}>{val}</div>
              <div style={{ fontSize:10,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.1em',marginTop:4,fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section style={{ position:'relative',zIndex:5,
        maxWidth:1200,margin:'0 auto',
        padding:'clamp(36px,5vh,56px) clamp(20px,4vw,64px)' }}>
        <h2 style={{ textAlign:'center',fontSize:'clamp(20px,2.5vw,30px)',fontWeight:800,
          color:'#111',letterSpacing:'-.03em',marginBottom:8 }}>
          Everything you need to hire right
        </h2>
        <p style={{ textAlign:'center',color:'#6b7280',fontSize:14,marginBottom:36 }}>
          Built for candidates and recruiters — no setup, no cost, no bias.
        </p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:18 }}>
          {features.map(({icon,c,bg,bd,title,desc},i)=>(
            <div key={title}
              onMouseEnter={()=>setHovered(title)}
              onMouseLeave={()=>setHovered(null)}
              style={{ background:hovered===title?bg:'rgba(255,255,255,.85)',
                border:`1.5px solid ${hovered===title?bd:'rgba(0,0,0,.07)'}`,
                borderRadius:16,padding:'22px 22px 20px',transition:'all .25s',
                transform:hovered===title?'translateY(-4px)':'none',
                boxShadow:hovered===title?`0 12px 36px ${c}18`:'0 2px 10px rgba(0,0,0,.04)',
                position:'relative',overflow:'hidden',
                animation:`fadeUp .6s ease ${i*.07+.2}s both`,cursor:'default' }}>
              <div style={{ position:'absolute',top:0,right:0,width:0,height:0,
                borderStyle:'solid',borderWidth:'0 16px 16px 0',
                borderColor:`transparent ${bd} transparent transparent` }}/>
              <div style={{ width:44,height:44,borderRadius:12,background:bg,
                border:`1.5px solid ${bd}`,display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:20,marginBottom:12 }}>{icon}</div>
              <div style={{ fontWeight:700,fontSize:14.5,color:'#111',marginBottom:7 }}>{title}</div>
              <div style={{ fontSize:13,color:'#6b7280',lineHeight:1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ ROLE CARDS ══════════════ */}
      <section style={{ position:'relative',zIndex:5,
        maxWidth:960,margin:'0 auto',
        padding:`0 clamp(20px,4vw,64px) clamp(48px,6vh,72px)`,
        display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:22 }}>
        {[
          { role:'candidate',icon:'👤',label:'Candidate Portal',head:"I'm a Job Seeker",
            c:'#1e40af',bg:'#eff6ff',bd:'#bfdbfe',grad:'linear-gradient(135deg,#1e40af,#2563eb)',
            items:['Upload PDF/JPG/PNG/DOCX resume','AI scoring with full bias audit',
              'Resume builder — 3 templates','Browse & apply to live jobs','🔑 Algorithmic Recourse Engine'] },
          { role:'hr',icon:'🏢',label:'HR Portal',head:"I'm a Recruiter",
            c:'#7c3aed',bg:'#faf5ff',bd:'#e9d5ff',grad:'linear-gradient(135deg,#7c3aed,#a855f7)',
            items:['Post jobs & rank by AI score','8-chart analytics dashboard',
              'Fairness audit per candidate','🧬 GA weight optimizer','Schedule interviews + AI questions'] },
        ].map(({role,icon,label,head,c,bg,bd,grad,items})=>(
          <div key={role}
            onClick={()=>{setLoginRole(role);go(role==='hr'?'login':'register')}}
            onMouseEnter={()=>setHovered(role)} onMouseLeave={()=>setHovered(null)}
            style={{ background:'rgba(255,255,255,.92)',
              border:`2px solid ${hovered===role?c+'50':'rgba(0,0,0,.07)'}`,
              borderRadius:20,padding:'clamp(20px,2.5vw,30px)',cursor:'pointer',transition:'all .3s',
              transform:hovered===role?'translateY(-6px)':'none',
              boxShadow:hovered===role?`0 16px 48px ${c}20`:'0 4px 16px rgba(0,0,0,.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,
              paddingBottom:16,marginBottom:18,borderBottom:`2px solid ${bd}` }}>
              <div style={{ width:50,height:50,borderRadius:13,background:bg,
                border:`1.5px solid ${bd}`,display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:22 }}>{icon}</div>
              <div>
                <div style={{ fontWeight:800,fontSize:18,color:'#111' }}>{head}</div>
                <div style={{ fontSize:11,color:c,fontWeight:700,textTransform:'uppercase',
                  letterSpacing:'.1em',marginTop:2 }}>{label}</div>
              </div>
            </div>
            {items.map(item=>(
              <div key={item} style={{ display:'flex',alignItems:'flex-start',gap:9,
                marginBottom:10,fontSize:13.5,color:'#374151',lineHeight:1.5 }}>
                <div style={{ width:18,height:18,borderRadius:4,flexShrink:0,marginTop:1,
                  background:bg,border:`1px solid ${bd}`,display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:10,color:c,fontWeight:800 }}>✓</div>
                {item}
              </div>
            ))}
            <button style={{ width:'100%',marginTop:18,padding:'12px 20px',
              background:grad,color:'#fff',border:'none',borderRadius:10,cursor:'pointer',
              fontWeight:700,fontSize:14,boxShadow:`0 4px 20px ${c}30`,transition:'all .2s',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}
              onMouseEnter={e=>e.currentTarget.style.opacity='.9'}
              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              Get Started →
            </button>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ position:'relative',zIndex:5,textAlign:'center',
        padding:'22px 20px 32px',borderTop:'1px solid rgba(99,102,241,.1)',
        background:'rgba(248,250,255,.8)',fontSize:12,color:'#9ca3af' }}>
        <div style={{ fontWeight:600,color:'#6b7280',marginBottom:5 }}>
          FairRank AI v5.0 &nbsp;·&nbsp; BAERE™ Fairness Engine &nbsp;·&nbsp;
          Algorithmic Recourse Engine &nbsp;·&nbsp; Genetic Algorithm Optimizer
        </div>
        <div style={{ fontSize:11,opacity:.7 }}>
          React 18 + Express &nbsp;·&nbsp; Google Gemini AI &nbsp;·&nbsp;
          EU AI Act 2024 Compliant &nbsp;·&nbsp; © 2025 FairRank AI
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        * { box-sizing:border-box }
        html { scroll-behavior:smooth }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(99,102,241,.2);border-radius:4px }
      `}</style>
    </div>
  )
}
