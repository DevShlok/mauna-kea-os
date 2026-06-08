import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import {
  mandates, mandateCandidates, flCandidates, flSubmissions,
  flFollowUps, flActivities, frameworks, frameworkCategories,
  frameworkCriteria, platformUsers
} from './schema';

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: 'Krishna@1469*', database: 'maunakea'
  });
  const db = drizzle(conn);

  console.log('🌱 Seeding database...');

  // ─── DROP AND RECREATE TABLES IN ORDER ───────────────────
  const drops = [
    'fl_activities','fl_followups','fl_submissions',
    'framework_criteria','framework_categories',
    'mandate_candidates','mandates','frameworks',
    'fl_candidates','platform_users'
  ];
  for (const t of drops) {
    await conn.execute(`DROP TABLE IF EXISTS \`${t}\``);
    console.log(`  Dropped ${t}`);
  }

  // ─── CREATE TABLES ────────────────────────────────────────
  await conn.execute(`CREATE TABLE mandates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    ctc VARCHAR(100),
    exp VARCHAR(100),
    sectors JSON,
    status VARCHAR(50) DEFAULT 'universe',
    internal_status VARCHAR(50) DEFAULT 'contractsent',
    consultant VARCHAR(255),
    opened VARCHAR(50),
    target VARCHAR(50),
    geography VARCHAR(255),
    work_mode VARCHAR(50),
    client_poc VARCHAR(255),
    poc_email VARCHAR(255),
    poc_phone VARCHAR(50),
    created_at DATETIME DEFAULT NOW()
  )`);

  await conn.execute(`CREATE TABLE mandate_candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(20) NOT NULL,
    mandate_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(255),
    stage VARCHAR(50) DEFAULT 'universe',
    score FLOAT,
    has_report BOOLEAN DEFAULT FALSE,
    initials VARCHAR(5),
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (mandate_id) REFERENCES mandates(id)
  )`);

  await conn.execute(`CREATE TABLE fl_candidates (
    id VARCHAR(20) PRIMARY KEY,
    initials VARCHAR(5),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    location VARCHAR(100),
    company VARCHAR(255),
    designation VARCHAR(255),
    exp INT,
    ctc INT,
    expected INT,
    notice INT,
    status VARCHAR(50) DEFAULT 'Active',
    qual JSON,
    dream_roles JSON,
    dream_cos JSON,
    exp_tags JSON,
    score FLOAT,
    assess_date VARCHAR(20),
    linkedin VARCHAR(500),
    has_cv BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW()
  )`);

  await conn.execute(`CREATE TABLE fl_submissions (
    id VARCHAR(20) PRIMARY KEY,
    cand_id VARCHAR(20) NOT NULL,
    cand_name VARCHAR(255),
    client VARCHAR(255),
    role VARCHAR(255),
    consultant VARCHAR(255),
    date_shared VARCHAR(20),
    via JSON,
    follow_up VARCHAR(20),
    status VARCHAR(50),
    response TEXT,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (cand_id) REFERENCES fl_candidates(id)
  )`);

  await conn.execute(`CREATE TABLE fl_followups (
    id VARCHAR(20) PRIMARY KEY,
    cand_id VARCHAR(20) NOT NULL,
    cand VARCHAR(255),
    client VARCHAR(255),
    role VARCHAR(255),
    consultant VARCHAR(255),
    due_date VARCHAR(20),
    status VARCHAR(20),
    note TEXT,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (cand_id) REFERENCES fl_candidates(id)
  )`);

  await conn.execute(`CREATE TABLE fl_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cand_id VARCHAR(20) NOT NULL,
    date VARCHAR(20),
    time VARCHAR(20),
    consultant VARCHAR(255),
    note TEXT,
    type VARCHAR(50),
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (cand_id) REFERENCES fl_candidates(id)
  )`);

  await conn.execute(`CREATE TABLE frameworks (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    used_in INT DEFAULT 0,
    last_modified VARCHAR(50),
    created_at DATETIME DEFAULT NOW()
  )`);

  await conn.execute(`CREATE TABLE framework_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    framework_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (framework_id) REFERENCES frameworks(id)
  )`);

  await conn.execute(`CREATE TABLE framework_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    weight INT DEFAULT 10,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES framework_categories(id)
  )`);

  await conn.execute(`CREATE TABLE platform_users (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    last_login VARCHAR(100),
    initials VARCHAR(5),
    created_at DATETIME DEFAULT NOW()
  )`);

  console.log('✓ Tables created');

  // ─── SEED MANDATES ────────────────────────────────────────
  const mandateRows = [
    { company:'ABC Limited', role:'CFO', ctc:'₹180–240L', exp:'15–20 yrs', sectors:['BFSI','FinTech'], status:'shortlist', internal_status:'contractsigned', consultant:'Priya Menon', opened:'3 Apr 2026', target:'30 Jun 2026', geography:'Mumbai', work_mode:'Hybrid', client_poc:'Vikram Shah', poc_email:'vikram.shah@abc.com', poc_phone:'+91 98200 11234' },
    { company:'XYZ Corporation', role:'CHRO', ctc:'₹120–160L', exp:'12–18 yrs', sectors:['FMCG'], status:'interview', internal_status:'contractsent', consultant:'Amit Sharma', opened:'15 Mar 2026', target:'15 Jun 2026', geography:'Delhi', work_mode:'On-site', client_poc:'Rakesh Gupta', poc_email:'r.gupta@xyz.com', poc_phone:'+91 98110 55678' },
    { company:'Finova Tech', role:'CTO', ctc:'₹150–200L', exp:'14–18 yrs', sectors:['Technology'], status:'mapping', internal_status:'contractsigned', consultant:'Sanya Rao', opened:'1 May 2026', target:'31 Jul 2026', geography:'Bengaluru', work_mode:'Hybrid', client_poc:'Deepa Nair', poc_email:'deepa@finovatech.in', poc_phone:'+91 99001 22334' },
    { company:'Capital Group', role:'Managing Director', ctc:'₹300–400L', exp:'20+ yrs', sectors:['Banking'], status:'universe', internal_status:'contractsent', consultant:'Rahul Kumar', opened:'20 May 2026', target:'31 Aug 2026', geography:'Mumbai', work_mode:'On-site', client_poc:'Aditya Birla', poc_email:'aditya@capitalgroup.in', poc_phone:'+91 98200 99001' },
  ];
  for (const m of mandateRows) {
    await conn.execute(`INSERT INTO mandates (company,role,ctc,exp,sectors,status,internal_status,consultant,opened,target,geography,work_mode,client_poc,poc_email,poc_phone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [m.company,m.role,m.ctc,m.exp,JSON.stringify(m.sectors),m.status,m.internal_status,m.consultant,m.opened,m.target,m.geography,m.work_mode,m.client_poc,m.poc_email,m.poc_phone]);
  }
  console.log('✓ Mandates seeded');

  // Get mandate IDs
  const [mRows] = await conn.execute('SELECT id FROM mandates ORDER BY id');
  const mIds = (mRows as {id:number}[]).map(r => r.id);

  // ─── SEED MANDATE CANDIDATES ─────────────────────────────
  const candData = [
    { mIdx:0, id:'c1', name:'Ayush Shroff', company:'HDFC Bank', role:'Deputy CFO', stage:'shortlist', score:8.2, hasReport:true, initials:'AS' },
    { mIdx:0, id:'c2', name:'Nidhi Kapoor', company:'Kotak Mahindra', role:'CFO', stage:'interview', score:8.8, hasReport:true, initials:'NK' },
    { mIdx:0, id:'c3', name:'Rohit Verma', company:'Axis Bank', role:'Group CFO', stage:'shortlist', score:7.9, hasReport:true, initials:'RV' },
    { mIdx:0, id:'c4', name:'Siddharth Pillai', company:'ICICI Bank', role:'VP Finance', stage:'calllist', score:null, hasReport:false, initials:'SP' },
    { mIdx:0, id:'c5', name:'Ananya Mishra', company:'SBI', role:'GM Finance', stage:'longlist', score:null, hasReport:false, initials:'AM' },
    { mIdx:1, id:'c6', name:'Kavitha Rajan', company:'HUL', role:'HR Director', stage:'interview', score:8.5, hasReport:true, initials:'KR' },
    { mIdx:1, id:'c7', name:'Sunita Agarwal', company:'Nestle India', role:'CHRO', stage:'shortlist', score:7.6, hasReport:true, initials:'SA' },
    { mIdx:1, id:'c8', name:'Arjun Malhotra', company:'Dabur', role:'VP HR', stage:'calllist', score:null, hasReport:false, initials:'AML' },
    { mIdx:2, id:'c9', name:'Prashant Mehta', company:'Google India', role:'Director Eng', stage:'mapping', score:null, hasReport:false, initials:'PM' },
    { mIdx:2, id:'c10', name:'Ravi Shankar', company:'Flipkart', role:'VP Engineering', stage:'longlist', score:null, hasReport:false, initials:'RS' },
  ];
  for (const c of candData) {
    await conn.execute(`INSERT INTO mandate_candidates (external_id,mandate_id,name,company,role,stage,score,has_report,initials) VALUES (?,?,?,?,?,?,?,?,?)`,
      [c.id, mIds[c.mIdx], c.name, c.company, c.role, c.stage, c.score, c.hasReport ? 1 : 0, c.initials]);
  }
  console.log('✓ Mandate candidates seeded');

  // ─── SEED FL CANDIDATES ──────────────────────────────────
  const flCands = [
    { id:'MK-001', initials:'AS', name:'Ayush Shroff', mobile:'+91 98200 11111', email:'ayush.shroff@gmail.com', location:'Mumbai', company:'HDFC Bank', designation:'Deputy CFO', exp:16, ctc:185, expected:220, notice:90, status:'Active', qual:['CA','MBA'], dreamRoles:['CFO','Group CFO'], dreamCos:['Kotak','Yes Bank','ICICI'], expTags:['Deputy CFO – HDFC Bank','VP Finance – Axis Bank','Senior Manager – Deloitte'], score:8.2, assessDate:'12 Apr 2026', linkedin:'https://linkedin.com/in/ayush-shroff', hasCv:true },
    { id:'MK-002', initials:'NK', name:'Nidhi Kapoor', mobile:'+91 99300 22222', email:'nidhi.k@outlook.com', location:'Mumbai', company:'Kotak Mahindra Bank', designation:'CFO', exp:18, ctc:210, expected:260, notice:60, status:'Passive', qual:['CA','CFA'], dreamRoles:['Group CFO','CFO – Listed Co'], dreamCos:['HDFC','Bajaj Finance','Tata Capital'], expTags:['CFO – Kotak Mahindra','Deputy CFO – ICICI Bank','Finance Director – GE Capital'], score:8.8, assessDate:'15 Apr 2026', linkedin:'https://linkedin.com/in/nidhi-kapoor', hasCv:true },
    { id:'MK-003', initials:'RV', name:'Rohit Verma', mobile:'+91 98110 33333', email:'rohit.verma@gmail.com', location:'Delhi', company:'Axis Bank', designation:'Group CFO', exp:20, ctc:240, expected:300, notice:90, status:'Active', qual:['CA','MBA'], dreamRoles:['CFO – MNC','MD Finance'], dreamCos:['Citi','Standard Chartered','Barclays'], expTags:['Group CFO – Axis Bank','CFO – Kotak MF','VP – Morgan Stanley'], score:7.9, assessDate:'18 Apr 2026', linkedin:'https://linkedin.com/in/rohit-verma', hasCv:true },
    { id:'MK-004', initials:'PM', name:'Prashant Mehta', mobile:'+91 98765 44444', email:'prashant.m@gmail.com', location:'Bengaluru', company:'Google India', designation:'Director Engineering', exp:15, ctc:220, expected:280, notice:60, status:'Active', qual:['B.Tech','MBA'], dreamRoles:['CTO','VP Engineering','Chief Product Officer'], dreamCos:['Microsoft','Amazon','Razorpay'], expTags:['Director Eng – Google India','Sr. Eng Manager – Amazon','Principal Engineer – Flipkart'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/prashant-mehta', hasCv:true },
    { id:'MK-005', initials:'KR', name:'Kavitha Rajan', mobile:'+91 99001 55555', email:'kavitha.r@outlook.com', location:'Delhi', company:'HUL', designation:'HR Director', exp:17, ctc:145, expected:180, notice:90, status:'Active', qual:['MBA'], dreamRoles:['CHRO','Chief People Officer'], dreamCos:['Nestle','P&G','ITC'], expTags:['HR Director – HUL','HR Business Partner – Unilever UK','Senior HRBP – Colgate'], score:8.5, assessDate:'10 May 2026', linkedin:'https://linkedin.com/in/kavitha-rajan', hasCv:true },
    { id:'MK-006', initials:'RS', name:'Ravi Shankar', mobile:'+91 98900 66666', email:'ravi.shankar@gmail.com', location:'Bengaluru', company:'Flipkart', designation:'VP Engineering', exp:14, ctc:190, expected:240, notice:90, status:'Passive', qual:['B.Tech','M.Tech'], dreamRoles:['CTO','VP Product & Engineering'], dreamCos:['Swiggy','Zepto','Meesho'], expTags:['VP Engineering – Flipkart','Director Eng – Ola','Senior Engineer – TCS'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/ravi-shankar', hasCv:false },
    { id:'MK-007', initials:'SA', name:'Sunita Agarwal', mobile:'+91 98200 77777', email:'sunita.a@gmail.com', location:'Mumbai', company:'Nestle India', designation:'CHRO', exp:19, ctc:155, expected:200, notice:60, status:'Active', qual:['MBA'], dreamRoles:['CHRO – MNC','Chief People Officer'], dreamCos:['HUL','Marico','Godrej'], expTags:['CHRO – Nestle India','HR Head – Pepsi India','HR Director – Cadbury'], score:7.6, assessDate:'5 May 2026', linkedin:'https://linkedin.com/in/sunita-agarwal', hasCv:true },
    { id:'MK-008', initials:'ARL', name:'Arjun Malhotra', mobile:'+91 98110 88888', email:'arjun.m@gmail.com', location:'Gurugram', company:'Dabur', designation:'VP HR', exp:12, ctc:110, expected:140, notice:30, status:'Active', qual:['MBA'], dreamRoles:['CHRO','HR Director'], dreamCos:['HUL','Britannia','Marico'], expTags:['VP HR – Dabur','HR Manager – Jubilant','HRBP – Wipro'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/arjun-malhotra', hasCv:false },
  ];
  for (const c of flCands) {
    await conn.execute(`INSERT INTO fl_candidates (id,initials,name,mobile,email,location,company,designation,exp,ctc,expected,notice,status,qual,dream_roles,dream_cos,exp_tags,score,assess_date,linkedin,has_cv) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [c.id,c.initials,c.name,c.mobile,c.email,c.location,c.company,c.designation,c.exp,c.ctc,c.expected,c.notice,c.status,JSON.stringify(c.qual),JSON.stringify(c.dreamRoles),JSON.stringify(c.dreamCos),JSON.stringify(c.expTags),c.score||null,c.assessDate||null,c.linkedin,c.hasCv?1:0]);
  }
  console.log('✓ FL candidates seeded');

  // ─── SEED FL SUBMISSIONS ─────────────────────────────────
  const subs = [
    { id:'SUB-001', candId:'MK-001', candName:'Ayush Shroff', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dateShared:'2026-04-10', via:['Email','PDF Report'], followUp:'2026-04-24', status:'Shortlisted', response:'Client very interested, wants to schedule F2F' },
    { id:'SUB-002', candId:'MK-002', candName:'Nidhi Kapoor', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dateShared:'2026-04-12', via:['Email','Presentation'], followUp:'2026-04-26', status:'Interviewing', response:'First round done, progressing to panel' },
    { id:'SUB-003', candId:'MK-005', candName:'Kavitha Rajan', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dateShared:'2026-05-05', via:['Email','WhatsApp'], followUp:'2026-05-19', status:'Shared', response:'Awaiting client review' },
    { id:'SUB-004', candId:'MK-004', candName:'Prashant Mehta', client:'Finova Tech', role:'CTO', consultant:'Sanya Rao', dateShared:'2026-05-15', via:['LinkedIn','PDF Report'], followUp:'2026-05-29', status:'Under Review', response:'Client reviewing profile' },
    { id:'SUB-005', candId:'MK-007', candName:'Sunita Agarwal', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dateShared:'2026-05-20', via:['Email'], followUp:'2026-06-03', status:'Shortlisted', response:'Shortlisted, scheduling interviews' },
  ];
  for (const s of subs) {
    await conn.execute(`INSERT INTO fl_submissions (id,cand_id,cand_name,client,role,consultant,date_shared,via,follow_up,status,response) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [s.id,s.candId,s.candName,s.client,s.role,s.consultant,s.dateShared,JSON.stringify(s.via),s.followUp,s.status,s.response]);
  }
  console.log('✓ Submissions seeded');

  // ─── SEED FOLLOW-UPS ─────────────────────────────────────
  const fups = [
    { id:'FU-001', candId:'MK-001', cand:'Ayush Shroff', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dueDate:'2026-06-04', status:'today', note:'Follow up on interview feedback from Vikram Shah' },
    { id:'FU-002', candId:'MK-002', cand:'Nidhi Kapoor', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dueDate:'2026-06-02', status:'overdue', note:'Panel interview scheduled — confirm date' },
    { id:'FU-003', candId:'MK-005', cand:'Kavitha Rajan', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dueDate:'2026-06-01', status:'overdue', note:'Client review pending — chase Rakesh Gupta' },
    { id:'FU-004', candId:'MK-004', cand:'Prashant Mehta', client:'Finova Tech', role:'CTO', consultant:'Sanya Rao', dueDate:'2026-06-08', status:'upcoming', note:'Send updated profile to Deepa' },
    { id:'FU-005', candId:'MK-007', cand:'Sunita Agarwal', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dueDate:'2026-06-10', status:'upcoming', note:'Schedule first interview with HR panel' },
    { id:'FU-006', candId:'MK-003', cand:'Rohit Verma', client:'Capital Group', role:'MD Finance', consultant:'Rahul Kumar', dueDate:'2026-06-15', status:'upcoming', note:'Introduce profile to Capital Group team' },
  ];
  for (const f of fups) {
    await conn.execute(`INSERT INTO fl_followups (id,cand_id,cand,client,role,consultant,due_date,status,note) VALUES (?,?,?,?,?,?,?,?,?)`,
      [f.id,f.candId,f.cand,f.client,f.role,f.consultant,f.dueDate,f.status,f.note]);
  }
  console.log('✓ Follow-ups seeded');

  // ─── SEED ACTIVITIES ─────────────────────────────────────
  const acts = [
    { candId:'MK-001', date:'2026-05-10', time:'10:30 AM', consultant:'Priya Menon', note:'Called candidate, discussed ABC Limited mandate. Candidate interested.', type:'Call' },
    { candId:'MK-001', date:'2026-05-02', time:'2:00 PM', consultant:'Rahul Kumar', note:'Profile reviewed and approved for submission.', type:'Review' },
    { candId:'MK-001', date:'2026-04-10', time:'11:00 AM', consultant:'Priya Menon', note:'Submitted to ABC Limited with full assessment report.', type:'Submission' },
    { candId:'MK-002', date:'2026-05-12', time:'4:00 PM', consultant:'Priya Menon', note:'Candidate confirmed interview on 20 May. Prepped candidate on client expectations.', type:'Call' },
    { candId:'MK-002', date:'2026-04-12', time:'9:30 AM', consultant:'Priya Menon', note:'Submitted to ABC Limited with presentation.', type:'Submission' },
  ];
  for (const a of acts) {
    await conn.execute(`INSERT INTO fl_activities (cand_id,date,time,consultant,note,type) VALUES (?,?,?,?,?,?)`,
      [a.candId,a.date,a.time,a.consultant,a.note,a.type]);
  }
  console.log('✓ Activities seeded');

  // ─── SEED FRAMEWORKS ─────────────────────────────────────
  const fwData = [
    { id:'fw1', name:'Standard CFO Framework', industry:'BFSI / FinTech', usedIn:3, lastModified:'18 Apr 2026',
      cats:[
        { name:'Financial Leadership', criteria:[{name:'P&L Management & Accountability',w:15},{name:'Financial Controls & Governance',w:12},{name:'Treasury & Capital Allocation',w:10},{name:'Financial Reporting & Audit',w:8}]},
        { name:'Strategic & Commercial Acumen', criteria:[{name:'Business Partnering & Stakeholder Influence',w:12},{name:'Strategy Development & Execution',w:10},{name:'M&A / Fundraising Experience',w:8},{name:'Investor Relations',w:5}]},
        { name:'Leadership & Culture', criteria:[{name:'Team Leadership & Development',w:10},{name:'Change Management',w:8},{name:'Communication & Executive Presence',w:7},{name:'Ethics & Integrity',w:5},{name:'Diversity & Inclusion Commitment',w:5},{name:'Digital & Tech Orientation',w:5}]},
      ]},
    { id:'fw2', name:'CHRO Leadership Framework', industry:'FMCG / Consumer', usedIn:2, lastModified:'25 Apr 2026',
      cats:[
        { name:'People Strategy', criteria:[{name:'Talent Acquisition & Employer Branding',w:15},{name:'L&D and Capability Building',w:12},{name:'Succession Planning',w:10},{name:'Culture Building',w:10}]},
        { name:'Organisational Effectiveness', criteria:[{name:'OD / Org Design',w:12},{name:'Performance Management',w:10},{name:'Change Management',w:8},{name:'HR Analytics',w:8}]},
        { name:'Commercial HR', criteria:[{name:'Business Partnering',w:10},{name:'Compensation & Benefits',w:8},{name:'Labour Relations / IR',w:5},{name:'HR Technology',w:5}]},
      ]},
    { id:'fw3', name:'Technology Leader Framework', industry:'Technology / SaaS', usedIn:1, lastModified:'2 May 2026',
      cats:[
        { name:'Technical Excellence', criteria:[{name:'Architecture & Systems Design',w:15},{name:'Engineering Quality & DevOps',w:12},{name:'Security & Compliance',w:8},{name:'Data Engineering',w:8}]},
        { name:'Product & Delivery', criteria:[{name:'Product Strategy',w:12},{name:'Agile / Delivery Excellence',w:10},{name:'Customer Obsession',w:8},{name:'Roadmap Planning',w:7}]},
        { name:'Leadership', criteria:[{name:'Engineering Culture',w:8},{name:'Hiring & Team Building',w:7},{name:'Stakeholder Communication',w:5},{name:'Budgeting & Cost Management',w:5},{name:'External Ecosystem (Open Source, Patents)',w:5}]},
      ]},
  ];
  for (const fw of fwData) {
    await conn.execute(`INSERT INTO frameworks (id,name,industry,used_in,last_modified) VALUES (?,?,?,?,?)`,
      [fw.id,fw.name,fw.industry,fw.usedIn,fw.lastModified]);
    for (let ci=0; ci<fw.cats.length; ci++) {
      const cat = fw.cats[ci];
      const [catRes] = await conn.execute(`INSERT INTO framework_categories (framework_id,name,sort_order) VALUES (?,?,?)`, [fw.id,cat.name,ci]);
      const catId = (catRes as {insertId:number}).insertId;
      for (let cri=0; cri<cat.criteria.length; cri++) {
        const cr = cat.criteria[cri];
        await conn.execute(`INSERT INTO framework_criteria (category_id,name,weight,sort_order) VALUES (?,?,?,?)`, [catId,cr.name,cr.w,cri]);
      }
    }
  }
  console.log('✓ Frameworks seeded');

  // ─── SEED USERS ──────────────────────────────────────────
  const users = [
    { id:'u1', name:'Rahul Kumar', email:'rahul@maunakea.co.in', role:'admin', status:'Active', lastLogin:'Today, 9:15 AM', initials:'RK' },
    { id:'u2', name:'Priya Menon', email:'priya@maunakea.co.in', role:'management', status:'Active', lastLogin:'Today, 8:45 AM', initials:'PM' },
    { id:'u3', name:'Amit Sharma', email:'amit@maunakea.co.in', role:'consultant', status:'Active', lastLogin:'Yesterday, 6:30 PM', initials:'AS' },
    { id:'u4', name:'Sanya Rao', email:'sanya@maunakea.co.in', role:'consultant', status:'Active', lastLogin:'2 Jun 2026', initials:'SR' },
  ];
  for (const u of users) {
    await conn.execute(`INSERT INTO platform_users (id,name,email,role,status,last_login,initials) VALUES (?,?,?,?,?,?,?)`,
      [u.id,u.name,u.email,u.role,u.status,u.lastLogin,u.initials]);
  }
  console.log('✓ Users seeded');

  await conn.end();
  console.log('\n✅ Seed complete!');
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
