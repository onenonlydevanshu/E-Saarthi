export interface Subject {
  name: string
  topics: string[]
  weightage: number // Percentage weightage in exam
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ExamSyllabus {
  id: string
  examName: string
  shortName: string
  category: 'government' | 'private'
  description: string
  totalMarks: number
  duration: string
  subjects: Subject[]
  importantTopics: string[]
  recommendedBooks: string[]
  examPattern: string[]
  preparationTips: string[]
}

export const EXAM_SYLLABI: Record<string, ExamSyllabus> = {
  upsc: {
    id: 'upsc',
    examName: 'UPSC Civil Services Examination',
    shortName: 'UPSC',
    category: 'government',
    description: 'Indian Administrative Service (IAS) and other All India Services',
    totalMarks: 1750,
    duration: '6-7 hours (Prelims) + 3 hours each (Mains)',
    subjects: [
      {
        name: 'Indian History',
        topics: ['Ancient India', 'Medieval India', 'Modern India', 'Art & Culture', 'Freedom Movement', 'Post-Independence India'],
        weightage: 15,
        difficulty: 'medium'
      },
      {
        name: 'Geography',
        topics: ['Physical Geography', 'Indian Geography', 'World Geography', 'Economic Geography', 'Environmental Geography', 'Climatology'],
        weightage: 15,
        difficulty: 'medium'
      },
      {
        name: 'Indian Polity',
        topics: ['Constitutional Development', 'Fundamental Rights & Duties', 'Parliament', 'Judiciary', 'Federalism', 'Local Governance', 'Election Commission'],
        weightage: 15,
        difficulty: 'medium'
      },
      {
        name: 'Economics',
        topics: ['Indian Economy', 'Economic Planning', 'Banking & Finance', 'Budget & Fiscal Policy', 'International Trade', 'Agriculture', 'Industries'],
        weightage: 15,
        difficulty: 'hard'
      },
      {
        name: 'Science & Technology',
        topics: ['Physics Basics', 'Chemistry Basics', 'Biology', 'Space Technology', 'IT & Computers', 'Biotechnology', 'Defense Technology'],
        weightage: 10,
        difficulty: 'medium'
      },
      {
        name: 'Environment & Ecology',
        topics: ['Biodiversity', 'Climate Change', 'Environmental Pollution', 'Conservation', 'Environmental Laws', 'Sustainable Development'],
        weightage: 10,
        difficulty: 'easy'
      },
      {
        name: 'Current Affairs',
        topics: ['National News', 'International Affairs', 'Government Schemes', 'Awards & Honors', 'Sports', 'Summits & Conferences'],
        weightage: 20,
        difficulty: 'medium'
      }
    ],
    importantTopics: [
      'Indian Constitution and Amendments',
      'Economic Survey and Budget Analysis',
      'Government Flagship Schemes',
      'International Relations and Foreign Policy',
      'Environmental Issues and Climate Action',
      'Science & Tech developments'
    ],
    recommendedBooks: [
      'Indian Polity by M. Laxmikanth',
      'Indian Economy by Ramesh Singh',
      'Certificate Physical Geography by Goh Cheng Leong',
      'India After Gandhi by Ramachandra Guha',
      'NCERT Books (Class 6-12)',
      'The Hindu / Indian Express (Daily Reading)'
    ],
    examPattern: [
      'Prelims: 2 Papers (GS + CSAT)',
      'Mains: 9 Papers (Essay + GS I-IV + Optional + Language)',
      'Interview: 275 Marks',
      'Total: 1750 Marks (Mains) + 275 (Interview)'
    ],
    preparationTips: [
      'Start with NCERTs for building foundation',
      'Read newspapers daily for Current Affairs',
      'Focus on answer writing practice',
      'Take regular mock tests',
      'Maintain short notes for revision'
    ]
  },

  ssc: {
    id: 'ssc',
    examName: 'SSC Combined Graduate Level',
    shortName: 'SSC CGL',
    category: 'government',
    description: 'Staff Selection Commission Combined Graduate Level Examination',
    totalMarks: 200,
    duration: '60 minutes per tier',
    subjects: [
      {
        name: 'Quantitative Aptitude',
        topics: ['Number System', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry', 'Data Interpretation', 'Percentage', 'Profit & Loss', 'Time & Work', 'Speed & Distance'],
        weightage: 25,
        difficulty: 'medium'
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Synonyms & Antonyms', 'Idioms & Phrases', 'One Word Substitution', 'Error Detection', 'Sentence Improvement'],
        weightage: 25,
        difficulty: 'medium'
      },
      {
        name: 'General Intelligence & Reasoning',
        topics: ['Analogies', 'Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Series', 'Classification', 'Syllogism', 'Non-Verbal Reasoning', 'Puzzles'],
        weightage: 25,
        difficulty: 'medium'
      },
      {
        name: 'General Awareness',
        topics: ['History', 'Geography', 'Polity', 'Economics', 'Science', 'Current Affairs', 'Static GK', 'Computer Knowledge'],
        weightage: 25,
        difficulty: 'easy'
      }
    ],
    importantTopics: [
      'Arithmetic Shortcuts and Tricks',
      'Reasoning Puzzles and Patterns',
      'Vocabulary Building',
      'Static GK (Countries, Capitals, Awards)',
      'Current Affairs (Last 6 months)',
      'Data Interpretation'
    ],
    recommendedBooks: [
      'Quantitative Aptitude by R.S. Aggarwal',
      'Objective General English by S.P. Bakshi',
      'A Modern Approach to Verbal & Non-Verbal Reasoning by R.S. Aggarwal',
      'Lucent General Knowledge',
      'Previous Year Papers',
      'Kiran SSC Mathematics'
    ],
    examPattern: [
      'Tier I: CBT (200 marks, 60 mins)',
      'Tier II: CBT (Paper I & II, 60 mins each)',
      'Tier III: Descriptive Test (100 marks)',
      'Tier IV: Skill Test (DEST/CPT)'
    ],
    preparationTips: [
      'Practice calculation speed daily',
      'Memorize formulas and shortcuts',
      'Solve previous year papers',
      'Focus on accuracy over speed initially',
      'Take sectional mock tests'
    ]
  },

  rrb: {
    id: 'rrb',
    examName: 'Railway Recruitment Board NTPC',
    shortName: 'RRB NTPC',
    category: 'government',
    description: 'Railway Non-Technical Popular Categories Recruitment',
    totalMarks: 100,
    duration: '90 minutes',
    subjects: [
      {
        name: 'Mathematics',
        topics: ['Number System', 'Decimals & Fractions', 'LCM & HCF', 'Ratio & Proportion', 'Percentage', 'Mensuration', 'Time & Work', 'Time & Distance', 'Simple & Compound Interest', 'Profit & Loss', 'Algebra', 'Geometry', 'Trigonometry', 'Data Interpretation'],
        weightage: 30,
        difficulty: 'medium'
      },
      {
        name: 'General Intelligence & Reasoning',
        topics: ['Analogies', 'Alphabetical Series', 'Coding-Decoding', 'Mathematical Operations', 'Relationships', 'Syllogism', 'Jumbling', 'Venn Diagrams', 'Data Interpretation', 'Statement & Conclusion', 'Decision Making', 'Similarities & Differences', 'Analytical Reasoning', 'Classification', 'Directions', 'Statement & Arguments'],
        weightage: 30,
        difficulty: 'medium'
      },
      {
        name: 'General Awareness',
        topics: ['Current Events', 'History', 'Geography', 'Indian Polity', 'Indian Economy', 'General Science', 'Indian Railways', 'Famous Personalities', 'Books & Authors', 'Sports', 'Important Days', 'Computer Awareness'],
        weightage: 40,
        difficulty: 'easy'
      }
    ],
    importantTopics: [
      'Indian Railways History and Facts',
      'Current Affairs (6 months)',
      'Static GK (Countries, Rivers, Mountains)',
      'Basic Mathematics',
      'Logical Reasoning Patterns',
      'Science (Physics, Chemistry, Biology basics)'
    ],
    recommendedBooks: [
      'Lucent General Knowledge',
      'Quantitative Aptitude by R.S. Aggarwal',
      'Reasoning by R.S. Aggarwal',
      'RRB NTPC Previous Year Papers',
      'Platform Books for Railway',
      'Pratiyogita Darpan (Current Affairs)'
    ],
    examPattern: [
      'CBT Stage 1: 100 questions, 90 minutes',
      'CBT Stage 2: 120 questions, 90 minutes',
      'Typing Skill Test (where applicable)',
      'Document Verification'
    ],
    preparationTips: [
      'Focus on Railway-related current affairs',
      'Learn facts about Indian Railways',
      'Practice mental math calculations',
      'Study science from NCERT books',
      'Solve maximum mock tests'
    ]
  },

  cat: {
    id: 'cat',
    examName: 'Common Admission Test',
    shortName: 'CAT',
    category: 'private',
    description: 'Entrance exam for IIMs and top MBA colleges in India',
    totalMarks: 198,
    duration: '120 minutes',
    subjects: [
      {
        name: 'Verbal Ability & Reading Comprehension',
        topics: ['Reading Comprehension', 'Para Jumbles', 'Para Summary', 'Odd Sentence Out', 'Critical Reasoning', 'Vocabulary Based Questions'],
        weightage: 34,
        difficulty: 'hard'
      },
      {
        name: 'Data Interpretation & Logical Reasoning',
        topics: ['Tables & Graphs', 'Caselets', 'Data Sufficiency', 'Logical Puzzles', 'Seating Arrangement', 'Blood Relations', 'Syllogism', 'Binary Logic', 'Clocks & Calendars'],
        weightage: 33,
        difficulty: 'hard'
      },
      {
        name: 'Quantitative Ability',
        topics: ['Number System', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry', 'Modern Math', 'Arithmetic', 'Permutation & Combination', 'Probability', 'Coordinate Geometry'],
        weightage: 33,
        difficulty: 'hard'
      }
    ],
    importantTopics: [
      'Reading Comprehension (4-5 passages)',
      'Para Jumbles and Summary',
      'Data Interpretation Sets',
      'Logical Reasoning Puzzles',
      'Number System and Algebra',
      'Geometry and Mensuration'
    ],
    recommendedBooks: [
      'How to Prepare for CAT by Arun Sharma',
      'Word Power Made Easy by Norman Lewis',
      'Logical Reasoning by Arun Sharma',
      'Quantitative Aptitude by Arun Sharma',
      'Previous Year CAT Papers',
      'IMS/TIME/Career Launcher Study Material'
    ],
    examPattern: [
      'Section 1: VARC (26 questions, 40 mins)',
      'Section 2: DILR (24 questions, 40 mins)',
      'Section 3: QA (26 questions, 40 mins)',
      'Total: 76 questions, 120 minutes',
      'Negative marking: -1 for wrong MCQs'
    ],
    preparationTips: [
      'Read extensively for RC improvement',
      'Practice DI sets daily',
      'Master concepts before speed',
      'Take at least 30 full mocks',
      'Analyze each mock test thoroughly'
    ]
  },

  bankpo: {
    id: 'bankpo',
    examName: 'IBPS Probationary Officer',
    shortName: 'Bank PO',
    category: 'government',
    description: 'Institute of Banking Personnel Selection - PO Recruitment',
    totalMarks: 200,
    duration: '60 minutes (Prelims) / 180 minutes (Mains)',
    subjects: [
      {
        name: 'Quantitative Aptitude',
        topics: ['Simplification', 'Number Series', 'Data Interpretation', 'Quadratic Equations', 'Percentage', 'Ratio & Proportion', 'Profit & Loss', 'Time & Work', 'Time, Speed & Distance', 'Simple & Compound Interest', 'Mensuration', 'Permutation & Combination', 'Probability'],
        weightage: 35,
        difficulty: 'medium'
      },
      {
        name: 'Reasoning Ability',
        topics: ['Puzzles', 'Seating Arrangement', 'Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Syllogism', 'Inequality', 'Input-Output', 'Data Sufficiency', 'Statement & Assumptions', 'Logical Reasoning'],
        weightage: 35,
        difficulty: 'hard'
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Error Detection', 'Sentence Improvement', 'Para Jumbles', 'Fill in the Blanks', 'Column Based Questions', 'Phrase Replacement'],
        weightage: 30,
        difficulty: 'medium'
      },
      {
        name: 'General Awareness',
        topics: ['Banking Awareness', 'Financial Awareness', 'Current Affairs', 'Static GK', 'Economy', 'Government Schemes', 'RBI Policies', 'Banking Terms'],
        weightage: 40,
        difficulty: 'medium'
      },
      {
        name: 'Computer Knowledge',
        topics: ['Computer Fundamentals', 'Software & Hardware', 'MS Office', 'Internet & Networking', 'Database', 'Cyber Security', 'Banking Technology'],
        weightage: 20,
        difficulty: 'easy'
      }
    ],
    importantTopics: [
      'Banking Awareness and Current Affairs',
      'Data Interpretation and Number Series',
      'Seating Arrangement and Puzzles',
      'Reading Comprehension',
      'RBI Guidelines and Policies',
      'Financial Terms and Concepts'
    ],
    recommendedBooks: [
      'Quantitative Aptitude for Banking by Arun Sharma',
      'Reasoning by R.S. Aggarwal',
      'Objective General English by S.P. Bakshi',
      'Banking Awareness by Arihant',
      'Previous Year Papers',
      'Financial Awareness by Disha'
    ],
    examPattern: [
      'Prelims: 100 questions, 60 minutes',
      'Mains: 200 questions, 180 minutes',
      'Interview: 100 marks',
      'Final Merit: Mains (80%) + Interview (20%)'
    ],
    preparationTips: [
      'Stay updated with banking news daily',
      'Practice puzzles and DI extensively',
      'Learn all banking terms and abbreviations',
      'Focus on speed and accuracy',
      'Take sectional and full-length mocks'
    ]
  },

  gate: {
    id: 'gate',
    examName: 'Graduate Aptitude Test in Engineering',
    shortName: 'GATE',
    category: 'government',
    description: 'National level exam for M.Tech/PhD admissions and PSU recruitment',
    totalMarks: 100,
    duration: '180 minutes',
    subjects: [
      {
        name: 'General Aptitude',
        topics: ['Verbal Ability', 'Numerical Ability', 'Logical Reasoning', 'Data Interpretation', 'Analytical Ability'],
        weightage: 15,
        difficulty: 'easy'
      },
      {
        name: 'Engineering Mathematics',
        topics: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability & Statistics', 'Numerical Methods', 'Complex Variables'],
        weightage: 13,
        difficulty: 'hard'
      },
      {
        name: 'Core Subject',
        topics: ['Discipline-specific subjects based on chosen paper (CS/EC/ME/CE/EE etc.)'],
        weightage: 72,
        difficulty: 'hard'
      }
    ],
    importantTopics: [
      'Engineering Mathematics (Linear Algebra, Calculus)',
      'Core Subject Fundamentals',
      'Previous Year Questions',
      'Numerical Answer Type Questions',
      'General Aptitude (Easy marks)',
      'High-weightage topics from your branch'
    ],
    recommendedBooks: [
      'Made Easy Subject Books',
      'Higher Engineering Mathematics by B.S. Grewal',
      'Previous Year GATE Papers (20 years)',
      'ACE Academy Notes',
      'Standard Textbooks for Core Subjects',
      'Online Test Series'
    ],
    examPattern: [
      '65 Questions in 180 minutes',
      'MCQ + NAT (Numerical Answer Type)',
      'GA: 10 questions (15 marks)',
      'Subject: 55 questions (85 marks)',
      'Negative marking only for MCQs'
    ],
    preparationTips: [
      'Focus on high-weightage subjects first',
      'Practice numerical problems daily',
      'Solve 20 years of previous papers',
      'Take at least 50 mock tests',
      'Revise formulas weekly'
    ]
  }
}

// Get syllabus by exam ID
export function getSyllabusById(examId: string): ExamSyllabus | null {
  return EXAM_SYLLABI[examId.toLowerCase()] || null
}

// Get syllabus by exam name (fuzzy match)
export function getSyllabusByName(examName: string): ExamSyllabus | null {
  const lowerName = examName.toLowerCase()
  
  // Direct match
  if (EXAM_SYLLABI[lowerName]) {
    return EXAM_SYLLABI[lowerName]
  }
  
  // Fuzzy match
  for (const [key, syllabus] of Object.entries(EXAM_SYLLABI)) {
    if (
      lowerName.includes(key) ||
      lowerName.includes(syllabus.shortName.toLowerCase()) ||
      syllabus.examName.toLowerCase().includes(lowerName)
    ) {
      return syllabus
    }
  }
  
  return null
}

// Get all available exams
export function getAllExams(): { id: string; name: string; shortName: string; category: string }[] {
  return Object.values(EXAM_SYLLABI).map(s => ({
    id: s.id,
    name: s.examName,
    shortName: s.shortName,
    category: s.category
  }))
}

// Format syllabus for AI context
export function formatSyllabusForAI(syllabus: ExamSyllabus): string {
  let formatted = `
## EXAM: ${syllabus.examName} (${syllabus.shortName})
Category: ${syllabus.category}
Total Marks: ${syllabus.totalMarks}
Duration: ${syllabus.duration}

### SUBJECTS AND TOPICS:
${syllabus.subjects.map(s => `
**${s.name}** (${s.weightage}% weightage, ${s.difficulty} difficulty)
Topics: ${s.topics.join(', ')}
`).join('\n')}

### IMPORTANT TOPICS TO FOCUS:
${syllabus.importantTopics.map(t => `- ${t}`).join('\n')}

### EXAM PATTERN:
${syllabus.examPattern.map(p => `- ${p}`).join('\n')}

### RECOMMENDED BOOKS:
${syllabus.recommendedBooks.map(b => `- ${b}`).join('\n')}

### PREPARATION TIPS:
${syllabus.preparationTips.map(t => `- ${t}`).join('\n')}
`
  return formatted
}
