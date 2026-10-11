// api.js — Resume analysis v5-fixed
// FIX 1: Removed wrong model name (was 'claude-sonnet-...' but server uses Gemini)
// FIX 2: Send _jd and _resumeText as dedicated body fields so server never
//         needs to regex-parse the prompt and accidentally captures the JSON
//         example template as part of the job description.

const API_URL = '/api/messages'

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })

export const getFileMime = (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const mimes = {
    pdf:  'application/pdf',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return mimes[ext] || file.type || 'application/octet-stream'
}

export const getFileIcon = (name = '') => {
  const ext = (name || '').split('.').pop().toLowerCase()
  if (ext === 'pdf')                        return '📄'
  if (['png', 'jpg', 'jpeg'].includes(ext)) return '🖼'
  if (['doc', 'docx'].includes(ext))        return '📝'
  return '📎'
}

export async function analyzeWithFile(jd, file, resumeTextFallback = '') {
  const mime = getFileMime(file)
  const b64  = await fileToBase64(file)
  const prompt = buildPrompt(jd, resumeTextFallback)

  let content
  if (mime === 'application/pdf') {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
      { type: 'text', text: prompt },
    ]
  } else if (mime.startsWith('image/')) {
    content = [
      { type: 'image', source: { type: 'base64', media_type: mime, data: b64 } },
      { type: 'text', text: prompt },
    ]
  } else {
    content = [{ type: 'text', text: prompt }]
  }

  return post(content, jd, resumeTextFallback, b64, mime, file.name)
}

export async function analyzeWithText(jd, resumeText) {
  const content = [{ type: 'text', text: buildPrompt(jd, resumeText) }]
  return post(content, jd, resumeText, null, null, null)
}

function buildPrompt(jd, resumeText) {
  return `You are FairRank AI, an expert ethical hiring analyst.

Read the resume carefully and score it against the job description below.
IMPORTANT: Extract ALL information from the resume — skills, years of experience, education, projects, certifications.
Do NOT use demographic information (name, gender, age, location) in scoring.

===JOB DESCRIPTION START===
${jd}
===JOB DESCRIPTION END===

${resumeText ? `===RESUME TEXT START===\n${resumeText}\n===RESUME TEXT END===` : '(Resume provided as attached file above)'}

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "matchScore": 82,
  "dimensionScores": { "skills": 85, "experience": 80, "education": 78, "potential": 84 },
  "matchedKeywords": ["Python", "Machine Learning", "AWS"],
  "missingSkills": ["Kubernetes", "Spark"],
  "strengths": ["Strong Python skills", "7 years relevant experience"],
  "concerns": ["Missing cloud deployment experience"],
  "aiRationale": "Strong ML background with 7 years experience. Minor gap in cloud tools.",
  "recommendationLevel": "Strong Recommend",
  "fairnessFlag": false,
  "fairnessNote": "No bias indicators detected",
  "topSkills": ["Python", "TensorFlow", "AWS"],
  "experienceLevel": "Senior",
  "overallFeedback": "Excellent candidate. Strong technical skills."
}

recommendationLevel must be exactly one of: "Strong Recommend", "Recommend", "Consider", "Not Recommended"`
}

async function post(content, jd, resumeText, fileB64, fileMime, fileName) {
  const body = {
    messages:     [{ role: 'user', content }],
    _jd:          jd         || '',
    _resumeText:  resumeText || '',
    _fileB64:     fileB64    || null,
    _fileMime:    fileMime   || null,
    _fileName:    fileName   || null,
  }

  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${res.status}`)
  }

  const data = await res.json()
  const text = (data.content || []).map(b => b.text || '').join('').trim()
  const clean = text.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim()

  try {
    return JSON.parse(clean)
  } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
    throw new Error('Could not parse AI response — please try again')
  }
}
