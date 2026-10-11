import express      from 'express'
import cors         from 'cors'
import dotenv       from 'dotenv'
import crypto       from 'crypto'
import zlib         from 'zlib'
// fs not needed — PDF extraction is pure in-memory

dotenv.config()
const app  = express()
const PORT = 3001
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ─────────────────────────────────────────────────────────────────
// CACHE + RATE LIMITER
// ─────────────────────────────────────────────────────────────────
const cache     = new Map()
const MAX_CACHE = 200
function hashContent(t) {
  return crypto.createHash('md5').update(String(t).slice(0,5000)).digest('hex')
}
let lastCall = 0
async function waitRL() {
  const wait = 2100 - (Date.now() - lastCall)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastCall = Date.now()
}

// ─────────────────────────────────────────────────────────────────
// GEMINI CALLER
// ─────────────────────────────────────────────────────────────────
const MODELS = ['gemini-2.0-flash-lite','gemini-1.5-flash-8b','gemini-1.0-pro']
async function callGemini(parts, key, idx = 0) {
  if (idx >= MODELS.length) return null
  await waitRL()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[idx]}:generateContent?key=${key}`
  let resp, data
  try {
    resp = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts}], generationConfig:{temperature:0.1,maxOutputTokens:1500}})
    })
    data = await resp.json()
  } catch(e) { return callGemini(parts, key, idx+1) }
  if (!resp.ok || data?.error) {
    const s=resp.status, m=data?.error?.message||''
    if (s===429||m.includes('quota')||m.includes('RESOURCE')||s===404||m.includes('not found'))
      return callGemini(parts, key, idx+1)
    return null
  }
  const raw = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||''
  return raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()
}

// ─────────────────────────────────────────────────────────────────
// PDF TEXT EXTRACTOR — pure Node.js, works on Windows/Mac/Linux
// Handles reportlab PDFs: ASCII85Decode + FlateDecode
// ─────────────────────────────────────────────────────────────────
function ascii85decode(str) {
  str = str.replace(/\s+/g,'').replace(/~>$/,'')
  const out = []
  let i = 0
  while (i < str.length) {
    if (str[i]==='z') { out.push(0,0,0,0); i++; continue }
    const chunk = str.slice(i,i+5)
    if (!chunk.length) break
    const padded = chunk.padEnd(5,'u')
    let v = 0
    for (let j=0;j<5;j++) v = v*85 + (padded.charCodeAt(j)-33)
    const bytes = Math.min(chunk.length-1, 4)
    for (let j=0;j<bytes;j++) out.push((v>>>(24-j*8))&0xFF)
    i += 5
  }
  return Buffer.from(out)
}

function extractTjText(streamText) {
  const tokens = []
  // (text) Tj  — single string operator
  for (const m of streamText.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g)) {
    const s = m[1]
      .replace(/\\n/g,' ').replace(/\\r/g,' ').replace(/\\t/g,' ')
      .replace(/\\\(/g,'(').replace(/\\\)/g,')').replace(/\\\\/g,'\\')
      .replace(/[^\x20-\x7E]/g,' ').trim()
    if (s.length > 0) tokens.push(s)
  }
  // [(text)(num)(text)] TJ — array operator
  for (const m of streamText.matchAll(/\[([^\]]*)\]\s*TJ/g)) {
    for (const s of m[1].matchAll(/\(([^)]*)\)/g)) {
      const t = s[1].replace(/[^\x20-\x7E]/g,' ').trim()
      if (t.length > 0) tokens.push(t)
    }
  }
  return tokens.join(' ').replace(/\s+/g,' ').trim()
}

function extractTextFromPDF(b64) {
  try {
    const buf    = Buffer.from(b64, 'base64')
    const binary = buf.toString('binary')
    const parts  = []
    let pos = 0

    while (pos < binary.length - 20) {
      const si = binary.indexOf('stream', pos)
      if (si === -1) break

      // Check the dictionary before this stream for filter info
      const dictSection = binary.slice(Math.max(0, si-600), si)
      const hasASCII85  = dictSection.includes('ASCII85Decode')
      const hasFlate    = dictSection.includes('FlateDecode')

      // Advance past 'stream' + line ending
      let di = si + 6
      if (binary.charCodeAt(di) === 13) di++
      if (binary.charCodeAt(di) === 10) di++

      const ei = binary.indexOf('endstream', di)
      if (ei === -1 || ei <= di) { pos = si + 6; continue }

      const streamStr = binary.slice(di, ei)
      let decoded = null

      try {
        if (hasASCII85 && hasFlate) {
          const a85 = ascii85decode(streamStr)
          decoded   = zlib.inflateSync(a85).toString('latin1')
        } else if (hasFlate) {
          decoded = zlib.inflateSync(Buffer.from(streamStr,'binary')).toString('latin1')
        } else if (hasASCII85) {
          decoded = ascii85decode(streamStr).toString('latin1')
        }
      } catch(e) { /* compressed with unsupported filter — skip */ }

      if (decoded) {
        const extracted = extractTjText(decoded)
        if (extracted.length > 10) parts.push(extracted)
      }
      pos = ei + 9
    }

    const result = parts.join(' ').replace(/\s+/g,' ').trim()
    console.log(`📄 PDF extracted: ${result.length} chars`)
    return result
  } catch(e) {
    console.log('⚠️  PDF extraction error:', e.message)
    return ''
  }
}

// ─────────────────────────────────────────────────────────────────
// SYNONYM MAP  (200+ pairs — Indian B.Tech coverage included)
// ─────────────────────────────────────────────────────────────────
const SYNONYM_MAP = {
  'sql':              ['dbms','database','rdbms','relational database','mysql','postgresql','oracle',
                       'sql server','mssql','sqlite','mariadb','pl/sql','stored procedure',
                       'database management','database management system'],
  'mysql':            ['sql','dbms','rdbms','database','mariadb'],
  'postgresql':       ['sql','dbms','postgres','rdbms','database'],
  'mongodb':          ['nosql','no-sql','document database','document store','database'],
  'nosql':            ['mongodb','cassandra','dynamodb','couchdb','hbase','redis'],
  'redis':            ['cache','caching','in-memory database','nosql'],
  'oracle':           ['sql','pl/sql','dbms','rdbms','database'],
  'database':         ['dbms','sql','rdbms','nosql','data storage','data management'],
  'dbms':             ['sql','mysql','postgresql','oracle','database','rdbms',
                       'structured query language','database management system'],
  'python':           ['py','python3','scripting','automation','django','flask','fastapi'],
  'javascript':       ['js','es6','ecmascript','node','nodejs','typescript'],
  'typescript':       ['ts','javascript','js'],
  'java':             ['jvm','spring','j2ee','core java','java8','java11'],
  'c++':              ['cpp','c plus plus','systems programming','oop','c/c++'],
  'golang':           ['go','go language'],
  'react':            ['reactjs','react.js','react native','frontend','jsx','redux'],
  'angular':          ['angularjs','angular2','typescript framework'],
  'vue':              ['vuejs','vue.js','nuxt'],
  'nodejs':           ['node','node.js','express','backend javascript'],
  'django':           ['python web','web framework','drf'],
  'flask':            ['python web','microframework','python api','web framework'],
  'fastapi':          ['python api','rest api','api development','web framework'],
  'spring':           ['spring boot','java web','spring framework','microservices'],
  'machine learning': ['ml','ai','artificial intelligence','predictive modeling',
                       'supervised learning','unsupervised learning','classification',
                       'regression','neural network','model training'],
  'ml':               ['machine learning','artificial intelligence','ai'],
  'deep learning':    ['dl','neural network','cnn','rnn','lstm','transformer','ann'],
  'neural network':   ['deep learning','ann','cnn','rnn','lstm','ai','machine learning'],
  'nlp':              ['natural language processing','text analytics','text mining','bert',
                       'language model','sentiment analysis','named entity recognition'],
  'computer vision':  ['image processing','opencv','cnn','image recognition','object detection'],
  'tensorflow':       ['keras','tf','deep learning','neural network'],
  'pytorch':          ['torch','deep learning','neural network'],
  'keras':            ['tensorflow','deep learning','neural network'],
  'scikit-learn':     ['sklearn','scikit','machine learning','ml'],
  'scikit':           ['scikit-learn','sklearn','machine learning'],
  'data science':     ['data analysis','analytics','machine learning','statistics','data mining'],
  'data analysis':    ['analytics','statistics','data science','pandas','numpy','excel','tableau','eda'],
  'statistics':       ['statistical analysis','data analysis','probability','regression',
                       'hypothesis testing','data science'],
  'aws':              ['amazon web services','cloud','cloud computing','s3','ec2','lambda',
                       'sagemaker','dynamodb'],
  'azure':            ['microsoft azure','cloud','cloud computing','azure ml'],
  'gcp':              ['google cloud','google cloud platform','cloud','bigquery'],
  'cloud':            ['aws','azure','gcp','cloud computing','saas','iaas','paas'],
  'docker':           ['containerization','container','devops','kubernetes','microservices'],
  'kubernetes':       ['k8s','container orchestration','devops','docker','microservices'],
  'devops':           ['ci/cd','cicd','jenkins','gitlab ci','github actions','docker','kubernetes'],
  'linux':            ['unix','bash','shell','command line','ubuntu','centos'],
  'git':              ['version control','github','gitlab','bitbucket','source control','vcs'],
  'spark':            ['apache spark','pyspark','big data','hadoop','distributed computing'],
  'kafka':            ['apache kafka','message queue','event streaming','data pipeline'],
  'airflow':          ['apache airflow','workflow automation','data pipeline','etl'],
  'etl':              ['data pipeline','data engineering','airflow','spark'],
  'tableau':          ['data visualization','bi','business intelligence','reporting','power bi'],
  'power bi':         ['powerbi','data visualization','reporting','business intelligence'],
  'networking':       ['tcp/ip','network','lan','wan','routing','computer networks','cn'],
  'cybersecurity':    ['security','information security','infosec','ethical hacking'],
  'agile':            ['scrum','kanban','sprint','jira','project management','sdlc'],
  'rest api':         ['api','restful','web services','http','json','microservices','backend'],
  'api':              ['rest','restful','web services','integration','microservices'],
  'object oriented':  ['oop','oops','oops concepts','inheritance','polymorphism','encapsulation'],
  'oops':             ['object oriented','oop','inheritance','polymorphism','encapsulation',
                       'object oriented programming'],
  'data structures':  ['dsa','ds','algorithms','arrays','linked list','trees','graphs'],
  'algorithms':       ['dsa','data structures','sorting','searching','dynamic programming'],
  'operating system': ['os','linux','unix','process management','memory management'],
  'computer networks':['networking','tcp/ip','osi model','protocols','lan','wan','cn'],
  'dsa':              ['data structures','algorithms','data structures and algorithms'],
}

function semanticMatch(skill, resumeText) {
  if (resumeText.includes(skill)) return {matched:true, how:'exact', via:skill}
  for (const syn of (SYNONYM_MAP[skill]||[]))
    if (resumeText.includes(syn)) return {matched:true, how:'synonym', via:syn}
  for (const [canonical, syns] of Object.entries(SYNONYM_MAP))
    if (syns.includes(skill) && resumeText.includes(canonical))
      return {matched:true, how:'semantic', via:canonical}
  return {matched:false, how:null, via:null}
}

// ─────────────────────────────────────────────────────────────────
// SMART LOCAL SCORER — weighted tech stack + semantic synonyms
// ─────────────────────────────────────────────────────────────────
function smartLocalScore(jdRaw, resumeRaw) {
  const jd  = (jdRaw  ||'').toLowerCase().trim()
  const res = (resumeRaw||'').toLowerCase().trim()

  if (!res || res.length < 20) {
    return makeResult(35,30,30,30,30,[],
      ['Resume text could not be read'],
      ['Resume content not detected'],
      ['Please paste your resume text in the supplementary field for accurate scoring.'],
      'No resume content found.','Not Recommended',[],false,'Not specified',
      'Resume could not be extracted. Please paste resume text manually.')
  }

  const techStack = {
    'python':10,'javascript':10,'typescript':10,'java':10,'c++':9,'golang':9,
    'ruby':8,'scala':8,'php':8,'kotlin':8,'swift':8,
    'react':9,'angular':9,'vue':9,'nodejs':9,'django':9,'flask':8,
    'fastapi':8,'spring':8,'express':8,
    'tensorflow':10,'pytorch':10,'keras':9,'scikit-learn':9,'scikit':9,
    'machine learning':10,'deep learning':10,'nlp':10,'computer vision':10,
    'data science':9,'data analysis':9,'statistics':8,
    'sql':9,'mysql':8,'postgresql':8,'mongodb':8,'redis':7,'nosql':8,
    'dbms':9,'database':8,'oracle':8,
    'pandas':8,'numpy':8,'spark':9,'hadoop':8,'kafka':8,'airflow':8,
    'tableau':8,'power bi':8,'excel':7,
    'aws':9,'azure':9,'gcp':9,'docker':9,'kubernetes':9,
    'cloud':8,'devops':8,'ci/cd':8,'linux':7,'git':7,
    'rest api':8,'api':7,'agile':7,'scrum':7,
    'oops':8,'object oriented':8,'data structures':8,'algorithms':8,
    'cybersecurity':10,'networking':9,
    'feature engineering':9,
  }

  let skillScore=0, skillMax=0
  const matchedTech=[], missingTech=[]

  for (const [tech,weight] of Object.entries(techStack)) {
    if (jd.includes(tech)) {
      skillMax += weight
      const r = semanticMatch(tech, res)
      if (r.matched) {
        skillScore += weight
        matchedTech.push(r.how==='exact' ? tech : `${tech} (via ${r.via})`)
      } else {
        missingTech.push(tech)
      }
    }
  }

  // Fallback if no tech keywords found in JD
  const SW = new Set(['and','the','for','with','that','have','from','will','your','more','also',
    'required','experience','candidate','should','must','strong','work','looking','knowledge',
    'ability','skills','years','able','using','this','role','team','good','well'])
  const skillRatio = skillMax > 0
    ? skillScore / skillMax
    : (() => {
        const jdW = [...new Set((jd.match(/\b[a-z]{4,}\b/g)||[]).filter(w=>!SW.has(w)))]
        return jdW.filter(w=>semanticMatch(w,res).matched).length / Math.max(jdW.length,1)
      })()

  // Experience
  const yoeM   = res.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp|work)/i)
  let resYears = yoeM ? parseInt(yoeM[1]) : 0
  if (!resYears) {
    const roles=(res.match(/\b(engineer|developer|analyst|manager|lead|architect|scientist|consultant)\b/gi)||[]).length
    resYears = roles>=4?5:roles>=3?3:roles>=2?2:roles>=1?1:0
  }
  const jdYoeM  = jd.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i)
  const jdYears = jdYoeM ? parseInt(jdYoeM[1]) : 0
  let expRatio  = 0.65
  if (jdYears>0&&resYears>0) expRatio=resYears>=jdYears?1.0:Math.max(0.35,resYears/jdYears)
  else if (resYears>0) expRatio=resYears>=7?1.0:resYears>=5?0.92:resYears>=3?0.80:resYears>=1?0.65:0.45
  const isSenior=/\b(senior|lead|principal|architect|head of|director|vp\b|chief|expert)\b/i.test(res)
  const isJunior=/\b(junior|intern|fresher|entry.level|trainee)\b/i.test(res)
  if (isSenior) expRatio=Math.min(1.0,expRatio+0.08)
  if (isJunior) expRatio=Math.max(0.30,expRatio-0.12)

  // Education
  const hasPhD     =/\b(ph\.?d\.?|doctorate)\b/i.test(res)
  const hasMasters =/\b(m\.?tech|m\.?e\.?\b|mba|m\.?s\.?\b|master|msc|post.?grad)\b/i.test(res)
  const hasBachelor=/\b(b\.?tech|b\.?e\.?\b|bsc|b\.?sc|bachelor|b\.?s\.?\b|engineering)\b/i.test(res)
  const hasCerts   =/\b(certif|certified|aws certif|ceh\b|pmp\b|nptel|google certif)\b/i.test(res)
  const jdNeedsMSc =/\b(master|postgrad|mba|m\.?tech|advanced degree)\b/i.test(jd)
  let eduRatio=0.50
  if (hasBachelor) eduRatio=0.73
  if (hasMasters)  eduRatio=0.88
  if (hasPhD)      eduRatio=0.96
  if (hasCerts)    eduRatio=Math.min(0.99,eduRatio+0.09)
  if (jdNeedsMSc&&!hasMasters&&!hasPhD) eduRatio=Math.max(0.42,eduRatio-0.10)

  // Potential
  const hasQuan=/\b(\d+%|\d+x|reduced|improved|increased|saved|achieved|deployed|launched)\b/i.test(res)
  const hasProj=/\b(project|built|created|implemented|designed|developed)\b/i.test(res)
  const hasLead=/\b(led|managed|mentored|supervised|coordinated)\b/i.test(res)
  let potRatio=skillRatio*0.50+expRatio*0.30+eduRatio*0.20
  if (hasQuan) potRatio=Math.min(1.0,potRatio+0.05)
  if (hasProj) potRatio=Math.min(1.0,potRatio+0.03)
  if (hasLead) potRatio=Math.min(1.0,potRatio+0.03)

  const skillPct  = Math.round(skillRatio*100)
  const expPct    = Math.min(99,Math.round(expRatio*100))
  const eduPct    = Math.min(99,Math.round(eduRatio*100))
  const potPct    = Math.min(99,Math.round(potRatio*100))
  const matchScore= Math.min(97,Math.max(35,Math.round(skillPct*0.40+expPct*0.30+eduPct*0.15+potPct*0.15)))

  const cap = s => s.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
  const exactMatches    = matchedTech.filter(t=>!t.includes('(via')).map(cap)
  const semanticMatches = matchedTech.filter(t=> t.includes('(via')).map(cap)
  const displayMissing  = missingTech.slice(0,6).map(cap)

  const strengths=[]
  if (exactMatches.length>0)    strengths.push(`Direct skill match: ${exactMatches.slice(0,3).join(', ')}`)
  if (semanticMatches.length>0) strengths.push(`Semantic match: ${semanticMatches.slice(0,2).join(', ')}`)
  if (hasMasters||hasPhD)       strengths.push(`${hasPhD?'PhD':'Masters'} qualification meets requirements`)
  if (hasCerts)                 strengths.push('Industry certifications strengthen profile')
  if (isSenior)                 strengths.push('Senior-level experience aligns with role')
  if (hasQuan)                  strengths.push('Quantified achievements demonstrate impact')
  if (strengths.length===0)     strengths.push('Profile covers core job requirements')

  const concerns=[]
  if (displayMissing.length>0) concerns.push(`Skills not found: ${displayMissing.slice(0,3).join(', ')}`)
  if (jdYears>0&&resYears<jdYears) concerns.push(`JD needs ${jdYears}+ yrs; resume shows ~${resYears}`)
  if (skillRatio<0.40) concerns.push('Low skill overlap with JD requirements')
  if (jdNeedsMSc&&!hasMasters) concerns.push('JD prefers Masters degree')
  if (isJunior&&jd.includes('senior')) concerns.push('Junior profile for senior role')

  const rec=matchScore>=85?'Strong Recommend':matchScore>=70?'Recommend':matchScore>=55?'Consider':'Not Recommended'
  const semNote=semanticMatches.length>0?` Semantic: ${semanticMatches.slice(0,2).join(', ')}.`:''
  const rationale=`Skill match: ${skillPct}% (${exactMatches.length} exact + ${semanticMatches.length} semantic).${semNote} Experience: ${resYears}yr vs ${jdYears}yr. Education: ${hasPhD?'PhD':hasMasters?'Masters':hasBachelor?'Bachelors':'Not detected'}${hasCerts?' + Certified':''}. Score: ${matchScore}%.`
  const feedback=matchScore>=80
    ?`Strong candidate. ${skillPct}% skill alignment (${exactMatches.length} exact + ${semanticMatches.length} semantic). ${hasCerts?'Certifications add credibility. ':''}${displayMissing.length>0?`Consider: ${displayMissing[0]}.`:''}`
    :`${skillPct}% skill match (${exactMatches.length} exact, ${semanticMatches.length} via synonyms). Gaps: ${displayMissing.slice(0,2).join(', ')||'see concerns'}. ${jdYears>resYears&&jdYears>0?`Experience gap: ${jdYears-resYears} yr. `:''}Targeted upskilling recommended.`

  return makeResult(matchScore,skillPct,expPct,eduPct,potPct,
    [...exactMatches,...semanticMatches].slice(0,12),
    displayMissing,strengths.slice(0,4),concerns.slice(0,3),
    rationale,rec,exactMatches.slice(0,5),false,
    isSenior?'Senior':isJunior?'Junior/Fresher':resYears>=5?'Senior':resYears>=2?'Mid-level':'Entry-level',
    feedback)
}

function makeResult(ms,sp,ep,edp,pp,matched,missing,strengths,concerns,rationale,rec,topSkills,ff,el,fb) {
  return {
    matchScore:ms,
    dimensionScores:{skills:Math.min(99,Math.max(30,sp)),experience:Math.min(99,Math.max(30,ep)),
                     education:Math.min(99,Math.max(30,edp)),potential:Math.min(99,Math.max(30,pp))},
    matchedKeywords:matched||[],missingSkills:missing||[],
    strengths:strengths||[],concerns:concerns||[],
    aiRationale:rationale||'',recommendationLevel:rec||'Consider',
    fairnessFlag:ff||false,
    fairnessNote:'Scored on skills, experience and qualifications only. Semantic synonym matching applied.',
    topSkills:topSkills||[],experienceLevel:el||'Not specified',overallFeedback:fb||'',
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN ENDPOINT
// ─────────────────────────────────────────────────────────────────
app.post('/messages', async (req, res) => {
  const apiKey   = process.env.GOOGLE_API_KEY
  const content  = req.body?.messages?.[0]?.content || []
  const fileB64  = req.body?._fileB64   || null
  const fileMime = req.body?._fileMime  || null
  const fileName = req.body?._fileName  || null
  const hasFile  = !!(fileB64 && fileMime)

  // Dedicated fields — no prompt parsing needed
  const jdDirect  = (req.body?._jd        ||'').trim()
  const resDirect = (req.body?._resumeText ||'').trim()

  // Extract text from uploaded PDF / DOC (pure Node.js, works on Windows)
  let fileText = ''
  if (hasFile) {
    if (fileMime==='application/pdf' || fileMime.includes('word') || fileMime.includes('doc')) {
      fileText = extractTextFromPDF(fileB64)
    } else if (fileMime.startsWith('image/')) {
      console.log(`🖼  Image resume: ${fileName} — Gemini will read it`)
    }
  }

  // Use file-extracted text if good, else fall back to typed text
  const resumeTextFinal = (fileText.length>50 ? fileText : resDirect).trim()

  // Cache
  const cacheKey = hashContent(jdDirect + resumeTextFinal + (fileB64?fileB64.slice(0,300):''))
  if (cache.has(cacheKey)) {
    console.log('⚡ Cache hit')
    return res.json({ content:[{type:'text',text:cache.get(cacheKey)}] })
  }

  // Try Gemini (if API key set)
  if (apiKey) {
    const parts = []
    if (hasFile) {
      if (fileMime==='application/pdf')       parts.push({inlineData:{mimeType:'application/pdf',data:fileB64}})
      else if (fileMime.startsWith('image/')) parts.push({inlineData:{mimeType:fileMime,data:fileB64}})
    }
    const textBlocks = Array.isArray(content)
      ? content.filter(b=>b.type==='text').map(b=>b.text).join('\n')
      : String(content)
    const docTypes = ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const finalPrompt = (hasFile&&docTypes.includes(fileMime)&&fileText.length>50)
      ? textBlocks + `\n\n===EXTRACTED RESUME===\n${fileText}\n===END===`
      : textBlocks
    if (finalPrompt.trim()) parts.push({text:finalPrompt})

    if (parts.length>0) {
      const gText = await callGemini(parts, apiKey)
      if (gText&&gText.trim()) {
        if (cache.size>=MAX_CACHE) cache.delete(cache.keys().next().value)
        cache.set(cacheKey, gText)
        return res.json({ content:[{type:'text',text:gText}] })
      }
    }
    console.warn('⚠️  Gemini failed — smart local scorer active')
  } else {
    console.log('ℹ️  No API key — smart local scorer active')
  }

  // Smart local scorer
  console.log(`📊 Local scorer | JD: ${jdDirect.length}c | Resume: ${resumeTextFinal.length}c`)
  if (!jdDirect) {
    return res.json({content:[{type:'text',text:JSON.stringify({
      matchScore:35,dimensionScores:{skills:35,experience:35,education:35,potential:35},
      matchedKeywords:[],missingSkills:[],strengths:[],
      concerns:['No job description provided'],
      aiRationale:'No JD.',recommendationLevel:'Not Recommended',
      fairnessFlag:false,fairnessNote:'',topSkills:[],experienceLevel:'Unknown',
      overallFeedback:'Please provide a job description.',
    })}]})
  }

  const result = smartLocalScore(jdDirect, resumeTextFinal)
  const json   = JSON.stringify(result)
  if (cache.size>=MAX_CACHE) cache.delete(cache.keys().next().value)
  cache.set(cacheKey, json)
  return res.json({ content:[{type:'text',text:json}] })
})

app.get('/health', (_req,res) => res.json({
  status:'ok',
  mode: process.env.GOOGLE_API_KEY ? 'Gemini AI + Smart local scorer' : 'Smart local scorer (no API key)',
  cache: cache.size,
}))

app.listen(PORT, () => {
  console.log(`\n🚀 FairRank AI Backend → http://localhost:${PORT}`)
  console.log(process.env.GOOGLE_API_KEY ? '✅ Gemini API key loaded' : '✅ Smart local scorer (no key needed)')
  console.log('📦 PDF extractor: pure Node.js (Windows compatible)\n')
})
