// db.js — Persistent in-memory database with localStorage backup
const SEED = {
  users: [
    { id:'hr1', name:'Arjun Mehta', phone:'9000000001', email:'hr@techcorp.com', password:'admin123', role:'hr', company:'TechCorp Solutions', avatar:'AM' },
    { id:'hr2', name:'Sunita Rao', phone:'9000000002', email:'hr@healthplus.com', password:'admin123', role:'hr', company:'HealthPlus', avatar:'SR' },
    { id:'c1', name:'Rahul Sharma', phone:'9876543210', email:'rahul@demo.com', password:'demo123', role:'candidate', avatar:'RS' },
    { id:'c2', name:'Priya Singh', phone:'9876543211', email:'priya@demo.com', password:'demo123', role:'candidate', avatar:'PS' },
  ],
  resetTokens: [],
  messages: [
    { id:'msg1', fromId:'c1', fromName:'Rahul Sharma', fromRole:'candidate', toId:'hr1', toName:'Arjun Mehta', toRole:'hr', subject:'Query about Software Engineer Role', body:'Hi Arjun, I applied for the Software Engineer position. Could you share more about the tech stack and team culture?', timestamp:'2025-02-21T10:30:00Z', read:true },
    { id:'msg2', fromId:'hr1', fromName:'Arjun Mehta', fromRole:'hr', toId:'c1', toName:'Rahul Sharma', toRole:'candidate', subject:'Re: Query about Software Engineer Role', body:'Hi Rahul! We primarily use Python and Java for backend, React for frontend. Your profile looks very strong — you have been shortlisted! We will reach out for an interview soon.', timestamp:'2025-02-21T14:15:00Z', read:false },
    { id:'msg3', fromId:'hr2', fromName:'Sunita Rao', fromRole:'hr', toId:'c2', toName:'Priya Singh', toRole:'candidate', subject:'Your Data Analyst Application', body:'Hi Priya, thank you for applying to the Data Analyst position at HealthPlus. We reviewed your profile and would like to schedule a technical interview. Please share your availability.', timestamp:'2025-02-23T09:00:00Z', read:false },
  ],
  jobs: [
    { id:'j1', hrId:'hr1', title:'Software Engineer', company:'TechCorp Solutions', location:'Hyderabad, India', type:'Full-time', salary:'₹18-28 LPA', category:'Technology', postedAt:'2025-02-20', description:'Develop cutting-edge software solutions. Requirements: Python, Java, C++, Agile, Git, Data Structures, Algorithms, 3+ years experience.', skills:['Python','Java','C++','Agile','Git','Data Structures'] },
    { id:'j2', hrId:'hr1', title:'Machine Learning Engineer', company:'TechCorp Solutions', location:'Bangalore, India', type:'Full-time', salary:'₹22-35 LPA', category:'AI/ML', postedAt:'2025-02-18', description:'Design ML algorithms. Requirements: Python, TensorFlow, PyTorch, NLP, Deep Learning, 4+ years experience.', skills:['Python','TensorFlow','PyTorch','NLP','Deep Learning','Statistics'] },
    { id:'j3', hrId:'hr1', title:'Cloud Architect', company:'TechCorp Solutions', location:'Remote', type:'Full-time', salary:'₹30-50 LPA', category:'Technology', postedAt:'2025-02-10', description:'Design scalable cloud systems. AWS, Azure, Docker, Kubernetes required.', skills:['AWS','Azure','Cloud Computing','Scalability','Docker','Kubernetes'] },
    { id:'j4', hrId:'hr2', title:'Data Analyst', company:'HealthPlus', location:'Mumbai, India', type:'Full-time', salary:'₹10-16 LPA', category:'Analytics', postedAt:'2025-02-22', description:'Extract insights from datasets. SQL, Excel, Python, Statistics, Tableau required.', skills:['SQL','Excel','Python','Statistics','Data Analysis','Tableau'] },
    { id:'j5', hrId:'hr2', title:'Financial Analyst', company:'HealthPlus', location:'Mumbai, India', type:'Full-time', salary:'₹14-22 LPA', category:'Finance', postedAt:'2025-02-19', description:'Evaluate financial data. Financial modeling, Excel, Budgeting required.', skills:['Financial Modelling','Excel','Budgeting','Market Research','Forecasting'] },
    { id:'j6', hrId:'hr1', title:'Cybersecurity Analyst', company:'TechCorp Solutions', location:'Delhi, India', type:'Full-time', salary:'₹16-26 LPA', category:'Security', postedAt:'2025-02-17', description:'Safeguard systems. Penetration Testing, Ethical Hacking, Network Security required.', skills:['Penetration Testing','Ethical Hacking','Network Security','SIEM','Incident Response'] },
    { id:'j7', hrId:'hr1', title:'Product Manager', company:'TechCorp Solutions', location:'Hyderabad, India', type:'Full-time', salary:'₹20-35 LPA', category:'Management', postedAt:'2025-02-28', description:'Lead product development. Agile, Leadership, Product Roadmap required.', skills:['Agile','Leadership','Product Roadmap','Cross-Functional Collaboration','Jira'] },
  ],
  applications: [
    { id:'a1', candidateId:'c1', jobId:'j1', candidateName:'Rahul Sharma', jobTitle:'Software Engineer', company:'TechCorp Solutions', resumeText:'Proficient in Python, Java, C++, Agile, Git with 5 years experience. Masters in CS.', resumeFileName:null, resumeFileData:null, resumeFileType:null, matchScore:88, dimensionScores:{skills:92,experience:85,education:88,potential:87}, matchedKeywords:['Python','Java','C++','Agile','Git'], missingSkills:['Data Structures'], strengths:['Strong Python','Agile certified'], concerns:['Data structures depth'], aiRationale:'Strong match across skills. Minor gap in data structures.', overallFeedback:'Excellent profile. Consider adding data structure examples.', recommendation:'Strong Recommend', status:'shortlisted', appliedAt:'2025-02-21', fairnessFlag:false, fairnessNote:'No bias detected' },
    { id:'a2', candidateId:'c2', jobId:'j4', candidateName:'Priya Singh', jobTitle:'Data Analyst', company:'HealthPlus', resumeText:'SQL, Excel, Python, Statistics, Data Analysis. Tableau Desktop Specialist certified.', resumeFileName:null, resumeFileData:null, resumeFileType:null, matchScore:82, dimensionScores:{skills:85,experience:78,education:82,potential:83}, matchedKeywords:['SQL','Excel','Python','Statistics','Data Analysis'], missingSkills:['Tableau'], strengths:['SQL expertise','Python skills'], concerns:['Tableau depth'], aiRationale:'Good match with strong analytics skills.', overallFeedback:'Strong background. Tableau cert would help.', recommendation:'Recommend', status:'reviewed', appliedAt:'2025-02-23', fairnessFlag:false, fairnessNote:'No bias detected' },
    { id:'a3', candidateId:'ext1', jobId:'j1', candidateName:'Jonah Anderson', jobTitle:'Software Engineer', company:'TechCorp Solutions', resumeText:'Java, Python, C++, Agile — senior. Masters. Kubernetes certified.', resumeFileName:'jonah_resume.pdf', resumeFileData:null, resumeFileType:'application/pdf', matchScore:91, dimensionScores:{skills:93,experience:90,education:88,potential:91}, matchedKeywords:['Python','Java','C++','Agile','Git','Data Structures'], missingSkills:[], strengths:['Full stack expertise','Senior experience'], concerns:[], aiRationale:'Exceptional match. All skills present.', overallFeedback:'Top-tier candidate.', recommendation:'Strong Recommend', status:'shortlisted', appliedAt:'2025-02-21', fairnessFlag:false, fairnessNote:'No bias detected' },
    { id:'a4', candidateId:'ext2', jobId:'j2', candidateName:'Hinata Sato', jobTitle:'Machine Learning Engineer', company:'TechCorp Solutions', resumeText:'Python, Deep Learning, TensorFlow, NLP, Statistics — senior.', resumeFileName:'hinata_cv.pdf', resumeFileData:null, resumeFileType:'application/pdf', matchScore:85, dimensionScores:{skills:88,experience:82,education:80,potential:88}, matchedKeywords:['Python','TensorFlow','NLP','Deep Learning'], missingSkills:['PyTorch'], strengths:['NLP expertise','TensorFlow proficiency'], concerns:['PyTorch limited'], aiRationale:'Strong ML background. PyTorch gap is minor.', overallFeedback:'Strong candidate.', recommendation:'Recommend', status:'pending', appliedAt:'2025-02-18', fairnessFlag:false, fairnessNote:'No bias detected' },
    { id:'a5', candidateId:'ext3', jobId:'j6', candidateName:'Lauren Davis', jobTitle:'Cybersecurity Analyst', company:'TechCorp Solutions', resumeText:'Penetration Testing, Ethical Hacking, Network Security — senior. CEH certified.', resumeFileName:'lauren_resume.docx', resumeFileData:null, resumeFileType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', matchScore:93, dimensionScores:{skills:95,experience:92,education:88,potential:96}, matchedKeywords:['Penetration Testing','Ethical Hacking','Network Security'], missingSkills:[], strengths:['CEH certified','Expert pentester'], concerns:[], aiRationale:'Perfect match.', overallFeedback:'Exceptional candidate.', recommendation:'Strong Recommend', status:'shortlisted', appliedAt:'2025-02-17', fairnessFlag:false, fairnessNote:'No bias detected' },
    { id:'a6', candidateId:'ext4', jobId:'j1', candidateName:'Shoji Fujii', jobTitle:'Software Engineer', company:'TechCorp Solutions', resumeText:'Agile, Git, Data Structures, C++ — senior. Oracle Java Cert.', resumeFileName:null, resumeFileData:null, resumeFileType:null, matchScore:79, dimensionScores:{skills:82,experience:76,education:84,potential:74}, matchedKeywords:['Agile','Git','Data Structures','C++'], missingSkills:['Python','Java'], strengths:['Algorithm expertise'], concerns:['Missing Python'], aiRationale:'Good fundamentals but missing Python.', overallFeedback:'Solid background. Adding Python would help.', recommendation:'Recommend', status:'reviewed', appliedAt:'2025-02-22', fairnessFlag:false, fairnessNote:'No bias detected' },
  ],
  auditLog: [
    { id:'log1', actorId:'hr1', actorName:'Arjun Mehta', action:'Status Updated', detail:'Rahul Sharma → shortlisted for Software Engineer', timestamp:'2025-02-21T15:00:00Z' },
    { id:'log2', actorId:'hr2', actorName:'Sunita Rao', action:'Status Updated', detail:'Priya Singh → reviewed for Data Analyst', timestamp:'2025-02-23T10:00:00Z' },
  ],
  interviews: [],
}

function loadDB() {
  try {
    const saved = localStorage.getItem('fairrank_db')
    if (saved) return JSON.parse(saved)
  } catch(e) {}
  return JSON.parse(JSON.stringify(SEED))
}

function saveDB(db) {
  try {
    // Don't save large file blobs to localStorage
    const lite = {
      ...db,
      applications: db.applications.map(a => ({...a, resumeFileData: null}))
    }
    localStorage.setItem('fairrank_db', JSON.stringify(lite))
  } catch(e) {}
}

export let INIT_DB = loadDB()
export { saveDB }
