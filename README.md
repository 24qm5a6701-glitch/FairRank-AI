# ⚡ FairRank AI — Smart Resume Screener v5 Enhanced

AI-powered resume screening platform with Dark/Light mode, localStorage persistence,
interview scheduling, skill gap roadmap, AI interview questions, export to PDF,
audit log, mobile responsive UI, and skeleton loading.

---

## 🚀 QUICK START (3 steps)

### Step 1 — Install Node.js
Download and install Node.js v18 or higher from: https://nodejs.org

### Step 2 — Install packages
```
npm install
```

### Step 3 — (Optional) Add API Key
Copy `.env.example` → `.env` and add your Google Gemini API key:
```
GOOGLE_API_KEY=your-key-here
```
**Works without a key** — uses the built-in accurate local scorer.

### Step 4 — Run
```
npm run dev
```
Open: **http://localhost:5173**

---

## 🔑 DEMO LOGIN CREDENTIALS

| Role | Email | Password |
|------|-------|----------|
| ⚡ Super Admin | admin@fairrank.com | admin@123 |
| 🏢 HR Admin | hr@techcorp.com | admin123 |
| 🏢 HR Admin 2 | hr@healthplus.com | admin123 |
| 👤 Candidate | rahul@demo.com | demo123 |
| 👤 Candidate 2 | priya@demo.com | demo123 |

---

## ✨ NEW FEATURES IN v5

### 🌙 Dark / Light Mode
- Toggle button in the top-right of every page
- Preference saved to localStorage (survives page refresh)
- Full theme support across all components

### 💾 Data Persistence
- All data (applications, jobs, messages, interviews) saved to localStorage
- Data survives page refresh — no more losing work on reload
- File blobs excluded to keep storage small

### 📅 Interview Scheduling (NEW)
- HR can generate AI interview questions tailored to each candidate
- Schedule interview with date, time, duration, mode (Video/Phone/In-person)
- Automated message sent to candidate with invite details
- Candidate can Accept / Decline from their Interviews page
- HR can mark completed

### 📈 Skill Gap Learning Roadmap (NEW)
- After resume analysis, missing skills show a "Skill Roadmap" button
- Curated course links for each missing skill (Coursera, free resources)
- Available in both AI Analyzer and My Applications pages
- HR can also view roadmap for candidates from Candidates page

### 🎯 AI Interview Question Generator (NEW)
- HR clicks "Interview + AI Questions" on any candidate
- Claude API generates 8 tailored questions based on matched/missing skills
- Directly integrates into the scheduling flow

### 📄 Export Rankings to PDF (NEW)
- HR Dashboard: "Export PDF" button for all candidates
- Candidates tab: Export filtered/searched results
- Opens a print-ready HTML table in a new tab
- Works without any extra libraries

### 🛡️ Audit Log (NEW)
- Every status change is automatically recorded
- Shows actor name, action, detail, timestamp
- Accessible from HR portal (Audit Log tab) and Admin portal
- Helps demonstrate transparency and fairness

### 📱 Mobile Responsive (NEW)
- Collapsible sidebar becomes a slide-in drawer on mobile
- Hamburger menu button in topbar on small screens
- Stats grids stack to 2-column / 1-column on mobile
- Cards and tables adapt to screen size

### ⬛ Skeleton Loading (NEW)
- Content-shaped skeleton animations during AI analysis
- Replaces plain spinner for a more polished feel

---

## 📁 PROJECT STRUCTURE

```
fairrank-ai-v5/
├── .env.example
├── index.html
├── package.json
├── vite.config.js
├── server/
│   └── index.js          ← Express backend with Gemini AI + local scorer
└── src/
    ├── main.jsx
    ├── App.jsx            ← All pages + new features (interviews, roadmap, etc.)
    ├── api.js             ← Anthropic/Gemini API calls
    ├── db.js              ← localStorage-persisted in-memory database
    ├── index.css          ← Dark/light theme, mobile responsive, skeletons
    ├── components/
    │   └── UI.jsx         ← Icons, ScoreRing, Spinner, Toast, Charts
    └── pages/
        ├── Landing.jsx
        └── Auth.jsx
```

---

## 🛠 TROUBLESHOOTING

**npm install fails?** → Make sure Node.js v18+ is installed: `node -v`

**API calls return error?** → The app works without an API key using the local scorer.

**Port conflict?** → Change frontend port in `vite.config.js`, backend in `server/index.js`

**Both ports must run** — `npm run dev` starts both together.
