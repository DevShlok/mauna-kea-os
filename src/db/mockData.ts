export const DATA = {
  mandates: [
    { id:1, company:'ABC Limited', role:'CFO', ctc:'₹180–240L', exp:'15–20 yrs', sectors:['BFSI','FinTech'], status:'shortlist', internalStatus:'contractsigned', consultant:'Priya Menon', opened:'3 Apr 2026', target:'30 Jun 2026', geography:'Mumbai', workMode:'Hybrid', clientPOC:'Vikram Shah', pocEmail:'vikram.shah@abc.com', pocPhone:'+91 98200 11234',
      candidates:[
        {id:'c1',name:'Ayush Shroff',company:'HDFC Bank',role:'Deputy CFO',stage:'shortlist',score:8.2,hasReport:true,initials:'AS'},
        {id:'c2',name:'Nidhi Kapoor',company:'Kotak Mahindra',role:'CFO',stage:'interview',score:8.8,hasReport:true,initials:'NK'},
        {id:'c3',name:'Rohit Verma',company:'Axis Bank',role:'Group CFO',stage:'shortlist',score:7.9,hasReport:true,initials:'RV'},
        {id:'c4',name:'Siddharth Pillai',company:'ICICI Bank',role:'VP Finance',stage:'calllist',score:null,hasReport:false,initials:'SP'},
        {id:'c5',name:'Ananya Mishra',company:'SBI',role:'GM Finance',stage:'longlist',score:null,hasReport:false,initials:'AM'}
      ]
    },
    { id:2, company:'XYZ Corporation', role:'CHRO', ctc:'₹120–160L', exp:'12–18 yrs', sectors:['FMCG'], status:'interview', internalStatus:'contractsent', consultant:'Amit Sharma', opened:'15 Mar 2026', target:'15 Jun 2026', geography:'Delhi', workMode:'On-site', clientPOC:'Rakesh Gupta', pocEmail:'r.gupta@xyz.com', pocPhone:'+91 98110 55678',
      candidates:[
        {id:'c6',name:'Kavitha Rajan',company:'HUL',role:'HR Director',stage:'interview',score:8.5,hasReport:true,initials:'KR'},
        {id:'c7',name:'Sunita Agarwal',company:'Nestle India',role:'CHRO',stage:'shortlist',score:7.6,hasReport:true,initials:'SA'},
        {id:'c8',name:'Arjun Malhotra',company:'Dabur',role:'VP HR',stage:'calllist',score:null,hasReport:false,initials:'AML'}
      ]
    },
    { id:3, company:'Finova Tech', role:'CTO', ctc:'₹150–200L', exp:'14–18 yrs', sectors:['Technology'], status:'mapping', internalStatus:'contractsigned', consultant:'Sanya Rao', opened:'1 May 2026', target:'31 Jul 2026', geography:'Bengaluru', workMode:'Hybrid', clientPOC:'Deepa Nair', pocEmail:'deepa@finovatech.in', pocPhone:'+91 99001 22334',
      candidates:[
        {id:'c9',name:'Prashant Mehta',company:'Google India',role:'Director Eng',stage:'mapping',score:null,hasReport:false,initials:'PM'},
        {id:'c10',name:'Ravi Shankar',company:'Flipkart',role:'VP Engineering',stage:'longlist',score:null,hasReport:false,initials:'RS'}
      ]
    },
    { id:4, company:'Capital Group', role:'Managing Director', ctc:'₹300–400L', exp:'20+ yrs', sectors:['Banking'], status:'universe', internalStatus:'contractsent', consultant:'Rahul Kumar', opened:'20 May 2026', target:'31 Aug 2026', geography:'Mumbai', workMode:'On-site', clientPOC:'Aditya Birla', pocEmail:'aditya@capitalgroup.in', pocPhone:'+91 98200 99001',
      candidates:[]
    }
  ],
  flCandidates: [
    { id:'MK-001', initials:'AS', name:'Ayush Shroff', mobile:'+91 98200 11111', email:'ayush.shroff@gmail.com', location:'Mumbai', company:'HDFC Bank', designation:'Deputy CFO', exp:16, ctc:185, expected:220, notice:90, status:'Active', qual:['CA','MBA'], dreamRoles:['CFO','Group CFO'], dreamCos:['Kotak','Yes Bank','ICICI'], expTags:['Deputy CFO – HDFC Bank','VP Finance – Axis Bank','Senior Manager – Deloitte'], score:8.2, assessDate:'12 Apr 2026', linkedin:'https://linkedin.com/in/ayush-shroff', hasCv:true },
    { id:'MK-002', initials:'NK', name:'Nidhi Kapoor', mobile:'+91 99300 22222', email:'nidhi.k@outlook.com', location:'Mumbai', company:'Kotak Mahindra Bank', designation:'CFO', exp:18, ctc:210, expected:260, notice:60, status:'Passive', qual:['CA','CFA'], dreamRoles:['Group CFO','CFO – Listed Co'], dreamCos:['HDFC','Bajaj Finance','Tata Capital'], expTags:['CFO – Kotak Mahindra','Deputy CFO – ICICI Bank','Finance Director – GE Capital'], score:8.8, assessDate:'15 Apr 2026', linkedin:'https://linkedin.com/in/nidhi-kapoor', hasCv:true },
    { id:'MK-003', initials:'RV', name:'Rohit Verma', mobile:'+91 98110 33333', email:'rohit.verma@gmail.com', location:'Delhi', company:'Axis Bank', designation:'Group CFO', exp:20, ctc:240, expected:300, notice:90, status:'Active', qual:['CA','MBA'], dreamRoles:['CFO – MNC','MD Finance'], dreamCos:['Citi','Standard Chartered','Barclays'], expTags:['Group CFO – Axis Bank','CFO – Kotak MF','VP – Morgan Stanley'], score:7.9, assessDate:'18 Apr 2026', linkedin:'https://linkedin.com/in/rohit-verma', hasCv:true },
    { id:'MK-004', initials:'PM', name:'Prashant Mehta', mobile:'+91 98765 44444', email:'prashant.m@gmail.com', location:'Bengaluru', company:'Google India', designation:'Director Engineering', exp:15, ctc:220, expected:280, notice:60, status:'Active', qual:['B.Tech','MBA'], dreamRoles:['CTO','VP Engineering','Chief Product Officer'], dreamCos:['Microsoft','Amazon','Razorpay'], expTags:['Director Eng – Google India','Sr. Eng Manager – Amazon','Principal Engineer – Flipkart'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/prashant-mehta', hasCv:true },
    { id:'MK-005', initials:'KR', name:'Kavitha Rajan', mobile:'+91 99001 55555', email:'kavitha.r@outlook.com', location:'Delhi', company:'HUL', designation:'HR Director', exp:17, ctc:145, expected:180, notice:90, status:'Active', qual:['MBA'], dreamRoles:['CHRO','Chief People Officer'], dreamCos:['Nestle','P&G','ITC'], expTags:['HR Director – HUL','HR Business Partner – Unilever UK','Senior HRBP – Colgate'], score:8.5, assessDate:'10 May 2026', linkedin:'https://linkedin.com/in/kavitha-rajan', hasCv:true },
    { id:'MK-006', initials:'RS', name:'Ravi Shankar', mobile:'+91 98900 66666', email:'ravi.shankar@gmail.com', location:'Bengaluru', company:'Flipkart', designation:'VP Engineering', exp:14, ctc:190, expected:240, notice:90, status:'Passive', qual:['B.Tech','M.Tech'], dreamRoles:['CTO','VP Product & Engineering'], dreamCos:['Swiggy','Zepto','Meesho'], expTags:['VP Engineering – Flipkart','Director Eng – Ola','Senior Engineer – TCS'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/ravi-shankar', hasCv:false },
    { id:'MK-007', initials:'SA', name:'Sunita Agarwal', mobile:'+91 98200 77777', email:'sunita.a@gmail.com', location:'Mumbai', company:'Nestle India', designation:'CHRO', exp:19, ctc:155, expected:200, notice:60, status:'Active', qual:['MBA'], dreamRoles:['CHRO – MNC','Chief People Officer'], dreamCos:['HUL','Marico','Godrej'], expTags:['CHRO – Nestle India','HR Head – Pepsi India','HR Director – Cadbury'], score:7.6, assessDate:'5 May 2026', linkedin:'https://linkedin.com/in/sunita-agarwal', hasCv:true },
    { id:'MK-008', initials:'ARL', name:'Arjun Malhotra', mobile:'+91 98110 88888', email:'arjun.m@gmail.com', location:'Gurugram', company:'Dabur',  designation:'VP HR', exp:12, ctc:110, expected:140, notice:30, status:'Active', qual:['MBA'], dreamRoles:['CHRO','HR Director'], dreamCos:['HUL','Britannia','Marico'], expTags:['VP HR – Dabur','HR Manager – Jubilant','HRBP – Wipro'], score:null, assessDate:null, linkedin:'https://linkedin.com/in/arjun-malhotra', hasCv:false }
  ],
  flSubmissions: [
    { id:'SUB-001', candId:'MK-001', candName:'Ayush Shroff', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dateShared:'2026-04-10', via:['Email','PDF Report'], followUp:'2026-04-24', status:'Shortlisted', response:'Client very interested, wants to schedule F2F' },
    { id:'SUB-002', candId:'MK-002', candName:'Nidhi Kapoor', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dateShared:'2026-04-12', via:['Email','Presentation'], followUp:'2026-04-26', status:'Interviewing', response:'First round done, progressing to panel' },
    { id:'SUB-003', candId:'MK-005', candName:'Kavitha Rajan', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dateShared:'2026-05-05', via:['Email','WhatsApp'], followUp:'2026-05-19', status:'Shared', response:'Awaiting client review' },
    { id:'SUB-004', candId:'MK-004', candName:'Prashant Mehta', client:'Finova Tech', role:'CTO', consultant:'Sanya Rao', dateShared:'2026-05-15', via:['LinkedIn','PDF Report'], followUp:'2026-05-29', status:'Under Review', response:'Client reviewing profile' },
    { id:'SUB-005', candId:'MK-007', candName:'Sunita Agarwal', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dateShared:'2026-05-20', via:['Email'], followUp:'2026-06-03', status:'Shortlisted', response:'Shortlisted, scheduling interviews' }
  ],
  flActivities: {
    'MK-001': [
      {date:'2026-05-10',time:'10:30 AM',consultant:'Priya Menon',note:'Called candidate, discussed ABC Limited mandate. Candidate interested.',type:'Call'},
      {date:'2026-05-02',time:'2:00 PM',consultant:'Rahul Kumar',note:'Profile reviewed and approved for submission.',type:'Review'},
      {date:'2026-04-10',time:'11:00 AM',consultant:'Priya Menon',note:'Submitted to ABC Limited with full assessment report.',type:'Submission'}
    ],
    'MK-002': [
      {date:'2026-05-12',time:'4:00 PM',consultant:'Priya Menon',note:'Candidate confirmed interview on 20 May. Prepped candidate on client expectations.',type:'Call'},
      {date:'2026-04-12',time:'9:30 AM',consultant:'Priya Menon',note:'Submitted to ABC Limited with presentation.',type:'Submission'}
    ]
  },
  flFollowUps: [
    { id:'FU-001', cand:'Ayush Shroff', candId:'MK-001', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dueDate:'2026-06-04', status:'today', note:'Follow up on interview feedback from Vikram Shah' },
    { id:'FU-002', cand:'Nidhi Kapoor', candId:'MK-002', client:'ABC Limited', role:'CFO', consultant:'Priya Menon', dueDate:'2026-06-02', status:'overdue', note:'Panel interview scheduled — confirm date' },
    { id:'FU-003', cand:'Kavitha Rajan', candId:'MK-005', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dueDate:'2026-06-01', status:'overdue', note:'Client review pending — chase Rakesh Gupta' },
    { id:'FU-004', cand:'Prashant Mehta', candId:'MK-004', client:'Finova Tech', role:'CTO', consultant:'Sanya Rao', dueDate:'2026-06-08', status:'upcoming', note:'Send updated profile to Deepa' },
    { id:'FU-005', cand:'Sunita Agarwal', candId:'MK-007', client:'XYZ Corporation', role:'CHRO', consultant:'Amit Sharma', dueDate:'2026-06-10', status:'upcoming', note:'Schedule first interview with HR panel' },
    { id:'FU-006', cand:'Rohit Verma', candId:'MK-003', client:'Capital Group', role:'MD Finance', consultant:'Rahul Kumar', dueDate:'2026-06-15', status:'upcoming', note:'Introduce profile to Capital Group team' }
  ],
  frameworks: [
    { id:'fw1', name:'Standard CFO Framework', industry:'BFSI / FinTech', usedIn:3, lastModified:'18 Apr 2026',
      categories:[
        { name:'Financial Leadership', criteria:[
          {name:'P&L Management & Accountability',weight:15},{name:'Financial Controls & Governance',weight:12},
          {name:'Treasury & Capital Allocation',weight:10},{name:'Financial Reporting & Audit',weight:8}
        ]},
        { name:'Strategic & Commercial Acumen', criteria:[
          {name:'Business Partnering & Stakeholder Influence',weight:12},{name:'Strategy Development & Execution',weight:10},
          {name:'M&A / Fundraising Experience',weight:8},{name:'Investor Relations',weight:5}
        ]},
        { name:'Leadership & Culture', criteria:[
          {name:'Team Leadership & Development',weight:10},{name:'Change Management',weight:8},
          {name:'Communication & Executive Presence',weight:7},{name:'Ethics & Integrity',weight:5},
          {name:'Diversity & Inclusion Commitment',weight:5},{name:'Digital & Tech Orientation',weight:5}
        ]}
      ]
    },
    { id:'fw2', name:'CHRO Leadership Framework', industry:'FMCG / Consumer', usedIn:2, lastModified:'25 Apr 2026',
      categories:[
        { name:'People Strategy', criteria:[
          {name:'Talent Acquisition & Employer Branding',weight:15},{name:'L&D and Capability Building',weight:12},
          {name:'Succession Planning',weight:10},{name:'Culture Building',weight:10}
        ]},
        { name:'Organisational Effectiveness', criteria:[
          {name:'OD / Org Design',weight:12},{name:'Performance Management',weight:10},
          {name:'Change Management',weight:8},{name:'HR Analytics',weight:8}
        ]},
        { name:'Commercial HR', criteria:[
          {name:'Business Partnering',weight:10},{name:'Compensation & Benefits',weight:8},
          {name:'Labour Relations / IR',weight:5},{name:'HR Technology',weight:5}
        ]}
      ]
    },
    { id:'fw3', name:'Technology Leader Framework', industry:'Technology / SaaS', usedIn:1, lastModified:'2 May 2026',
      categories:[
        { name:'Technical Excellence', criteria:[
          {name:'Architecture & Systems Design',weight:15},{name:'Engineering Quality & DevOps',weight:12},
          {name:'Security & Compliance',weight:8},{name:'Data Engineering',weight:8}
        ]},
        { name:'Product & Delivery', criteria:[
          {name:'Product Strategy',weight:12},{name:'Agile / Delivery Excellence',weight:10},
          {name:'Customer Obsession',weight:8},{name:'Roadmap Planning',weight:7}
        ]},
        { name:'Leadership', criteria:[
          {name:'Engineering Culture',weight:8},{name:'Hiring & Team Building',weight:7},
          {name:'Stakeholder Communication',weight:5},{name:'Budgeting & Cost Management',weight:5},
          {name:'External Ecosystem (Open Source, Patents)',weight:5}
        ]}
      ]
    }
  ],
  users: [
    { id:'u1', name:'Rahul Kumar', email:'rahul@maunakea.co.in', role:'admin', status:'Active', lastLogin:'Today, 9:15 AM', initials:'RK' },
    { id:'u2', name:'Priya Menon', email:'priya@maunakea.co.in', role:'management', status:'Active', lastLogin:'Today, 8:45 AM', initials:'PM' },
    { id:'u3', name:'Amit Sharma', email:'amit@maunakea.co.in', role:'consultant', status:'Active', lastLogin:'Yesterday, 6:30 PM', initials:'AS' },
    { id:'u4', name:'Sanya Rao', email:'sanya@maunakea.co.in', role:'consultant', status:'Active', lastLogin:'2 Jun 2026', initials:'SR' }
  ],
  masterData: {
    locations:['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Pune','Kolkata','Gurugram','Noida','Ahmedabad'],
    industries:['BFSI','FinTech','FMCG','Technology','Healthcare','Manufacturing','Consulting','Energy','Real Estate','Education'],
    functions:['Finance','Human Resources','Technology','Operations','Sales','Marketing','Legal','Strategy','Supply Chain','Risk'],
    workModes:['On-site','Hybrid','Remote'],
    seniority:['C-Suite','SVP / EVP','VP / Director','Senior Manager','Manager','Individual Contributor']
  }
};
