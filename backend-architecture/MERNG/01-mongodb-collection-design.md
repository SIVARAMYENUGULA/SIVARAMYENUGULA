# PlaceMux MongoDB Collection Design

## Collection Overview

| # | Collection | Description | Indexes |
|---|-----------|-------------|---------|
| 1 | `users` | Base user accounts (all roles) | email, role |
| 2 | `students` | Student-specific profile data | userId, collegeId |
| 3 | `companies` | Company profile data | userId |
| 4 | `colleges` | College profile data | userId |
| 5 | `jobs` | Job postings by companies | companyId, status, type, skills |
| 6 | `applications` | Student job applications | jobId, studentId, status |
| 7 | `assessments` | Assessment templates | type, isActive |
| 8 | `questions` | Assessment questions | assessmentId |
| 9 | `assessmentSessions` | Student assessment attempts | assessmentId, studentId, status |
| 10 | `scores` | Assessment scores & results | sessionId, studentId |
| 11 | `skillPassports` | Student skill inventories | studentId |
| 12 | `notifications` | User notifications | userId, isRead |
| 13 | `auditLogs` | System audit trail | userId, action, createdAt |

---

## 1. users Collection

```javascript
{
  _id: ObjectId,
  name: String,                    // required
  email: String,                   // required, unique, indexed
  password: String,                // required, bcrypt hash
  role: String,                    // enum: ['student', 'company', 'college', 'admin']
  avatar: String,                  // URL
  isVerified: Boolean,             // default: false
  isActive: Boolean,               // default: true
  refreshToken: String,            // hashed refresh token
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { email: 1 } unique, { role: 1 }
```

## 2. students Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref -> users, unique
  collegeId: ObjectId,             // ref -> colleges
  course: String,
  year: Number,                    // 1-6
  phone: String,
  linkedinUrl: String,
  portfolioUrl: String,
  resumeUrl: String,
  bio: String,
  profileCompleted: Number,        // 0-100 percentage
  createdAt: Date,
  updatedAt: Date
}
// Index: { userId: 1 } unique, { collegeId: 1 }
```

## 3. companies Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref -> users, unique
  industry: String,
  companySize: String,             // '1-10', '11-50', '51-200', '201-1000', '1000+'
  location: String,
  website: String,
  description: String,
  logoUrl: String,
  verified: Boolean,               // default: false
  createdAt: Date,
  updatedAt: Date
}
// Index: { userId: 1 } unique
```

## 4. colleges Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref -> users, unique
  collegeName: String,             // required
  location: String,
  website: String,
  totalStudents: Number,
  placementRate: Number,           // percentage 0-100
  averagePackage: Number,          // in INR
  verified: Boolean,               // default: false
  createdAt: Date,
  updatedAt: Date
}
// Index: { userId: 1 } unique
```

## 5. jobs Collection

```javascript
{
  _id: ObjectId,
  companyId: ObjectId,             // ref -> companies, required
  title: String,                   // required
  description: String,             // required
  location: String,
  type: String,                    // enum: ['Full-time', 'Part-time', 'Internship', 'Contract']
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: String,          // default: 'INR'
  skillsRequired: [String],        // array of skill names
  applicantsCount: Number,         // default: 0
  status: String,                  // enum: ['active', 'closed', 'draft'], default: 'draft'
  postedAt: Date,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { companyId: 1 }, { status: 1 }, { type: 1 }, { skillsRequired: 1 }
```

## 6. applications Collection

```javascript
{
  _id: ObjectId,
  jobId: ObjectId,                 // ref -> jobs, required
  studentId: ObjectId,             // ref -> students, required
  status: String,                  // enum: ['Applied', 'Shortlisted', 'Interview', 'Accepted', 'Rejected']
  resumeUrl: String,
  coverLetter: String,
  additionalInfo: Object,          // flexible key-value pairs
  appliedAt: Date,
  updatedAt: Date
}
// Indexes: { jobId: 1, studentId: 1 } unique compound, { studentId: 1 }, { status: 1 }
```

## 7. assessments Collection

```javascript
{
  _id: ObjectId,
  title: String,                   // required
  type: String,                    // enum: ['Technical', 'Aptitude', 'Soft_Skills', 'Domain']
  maxScore: Number,                // default: 100
  duration: Number,                // minutes, required
  passingScore: Number,            // default: 60
  description: String,
  instructions: String,
  questionCount: Number,
  isActive: Boolean,               // default: true
  createdBy: ObjectId,             // ref -> users (admin)
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { type: 1 }, { isActive: 1 }
```

## 8. questions Collection

```javascript
{
  _id: ObjectId,
  assessmentId: ObjectId,          // ref -> assessments, required
  questionText: String,            // required
  options: [String],               // array of 4 options
  correctIndex: Number,            // index of correct answer (0-3)
  points: Number,                  // default: 10
  orderIndex: Number,              // display order
  createdAt: Date
}
// Index: { assessmentId: 1, orderIndex: 1 }
```

## 9. assessmentSessions Collection

```javascript
{
  _id: ObjectId,
  assessmentId: ObjectId,          // ref -> assessments, required
  studentId: ObjectId,             // ref -> students, required
  status: String,                  // enum: ['pending', 'in_progress', 'completed', 'timed_out']
  answers: [{                      // array of answers
    questionId: ObjectId,          // ref -> questions
    selectedIndex: Number,         // selected option index
    isCorrect: Boolean,
    timeSpent: Number              // seconds on this question
  }],
  score: Number,                   // total score earned
  maxScore: Number,                // total possible score
  percentage: Number,              // score/maxScore * 100
  startedAt: Date,
  completedAt: Date,
  timeTakenSec: Number,            // total seconds taken
  createdAt: Date
}
// Indexes: { assessmentId: 1, studentId: 1 } unique compound, { studentId: 1 }, { status: 1 }
```

## 10. scores Collection

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,             // ref -> assessmentSessions, unique
  studentId: ObjectId,             // ref -> students
  assessmentId: ObjectId,          // ref -> assessments
  assessmentTitle: String,
  assessmentType: String,
  score: Number,
  maxScore: Number,
  percentage: Number,
  passed: Boolean,
  grade: String,                   // 'Excellent', 'Good', 'Average', 'Needs Improvement'
  correctCount: Number,
  totalQuestions: Number,
  timeTakenSec: Number,
  completedAt: Date,
  createdAt: Date
}
// Indexes: { studentId: 1 }, { assessmentId: 1 }, { completedAt: -1 }
```

## 11. skillPassports Collection

```javascript
{
  _id: ObjectId,
  studentId: ObjectId,             // ref -> students, unique
  skills: [{
    name: String,                  // skill name
    category: String,              // 'Frontend', 'Backend', 'AI/ML', 'Database', 'DevOps'
    level: String,                 // enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    endorsements: Number,          // default: 0
    assessedAt: Date               // when last assessed
  }],
  overallScore: Number,            // aggregate skill score
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
// Index: { studentId: 1 } unique, { 'skills.name': 1 }
```

## 12. notifications Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref -> users, required
  title: String,                   // required
  message: String,
  type: String,                    // enum: ['info', 'success', 'warning', 'error']
  isRead: Boolean,                 // default: false
  link: String,                    // deep link to relevant page
  metadata: Object,                // flexible contextual data
  createdAt: Date
}
// Indexes: { userId: 1, isRead: 1 }, { createdAt: -1 }
```

## 13. auditLogs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // ref -> users (nullable for unauthenticated actions)
  action: String,                  // required, e.g. 'LOGIN', 'CREATE_JOB', 'APPLY_JOB'
  resource: String,                // affected resource type
  resourceId: ObjectId,            // affected resource ID
  details: String,                 // human-readable description
  ipAddress: String,
  userAgent: String,
  metadata: Object,                // flexible additional data
  createdAt: Date
}
// Indexes: { userId: 1 }, { action: 1 }, { createdAt: -1 }, { resource: 1, resourceId: 1 }
```
