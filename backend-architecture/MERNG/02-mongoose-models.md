# Mongoose Models

## Directory: 

| Model | Fields | Key Indexes |
|-------|--------|-------------|
| **User** | name, email, password(bcrypt), role, avatar, isVerified, isActive, refreshToken, lastLoginAt | email(unique) |
| **Student** | userId(ref:User), collegeId(ref:College), course, year, phone, linkedinUrl, portfolioUrl, resumeUrl, bio, profileCompleted | userId(unique) |
| **Company** | userId(ref:User), industry, companySize, location, website, description, logoUrl, verified | userId(unique) |
| **College** | userId(ref:User), collegeName, location, website, totalStudents, placementRate, averagePackage, verified | userId(unique) |
| **Job** | companyId(ref:Company), title, description, location, type(enum), salaryMin/Max, skillsRequired[], status(enum), deadline | companyId+status, skillsRequired |
| **Application** | jobId(ref:Job), studentId(ref:Student), status(enum), resumeUrl, coverLetter, additionalInfo | jobId+studentId(unique) |
| **Assessment** | title, type(enum), maxScore, duration, passingScore, questionCount, isActive, createdBy | - |
| **Question** | assessmentId(ref), questionText, options[], correctIndex, points, orderIndex | assessmentId+orderIndex |
| **AssessmentSession** | assessmentId, studentId, status(enum), answers[], score, maxScore, percentage, startedAt, completedAt | assessmentId+studentId(unique) |
| **Score** | sessionId, studentId, assessmentId, title, type, score, maxScore, percentage, passed, grade, correctCount, totalQuestions | studentId, completedAt |
| **SkillPassport** | studentId(unique), skills[{name,category,level,endorsements}], overallScore | studentId(unique) |
| **Notification** | userId, title, message, type(enum), isRead, link, metadata | userId+isRead, createdAt |
| **AuditLog** | userId, action, resource, resourceId, details, ipAddress, userAgent | userId, action, createdAt |

## Key Implementation Details

- User model has pre-save hook for bcrypt password hashing (salt rounds: 12)
- User has comparePassword() method for login validation
- toJSON() method strips password/refreshToken from responses
- Application has unique compound index on jobId+studentId to prevent duplicates
- AssessmentSession tracks answers as [{questionId, selectedIndex, isCorrect, timeSpent}]
- All models use timestamps: true for createdAt/updatedAt
- Selective field queries: password and refreshToken use select: false
