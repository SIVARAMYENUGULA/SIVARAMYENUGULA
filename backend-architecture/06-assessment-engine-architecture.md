# Assessment Engine Architecture

## Overview

The PlaceMux Assessment Engine is a timed, multi-question evaluation system designed for placement skill assessments.

## Data Flow

```
Student                  Backend                    Database
  |                        |                          |
  |-- GET /assessments --> |                          |
  |                        |-- SELECT * FROM --------->|
  |                        |   assessments            |
  |<---- [list] ---------- |                          |
  |                        |                          |
  |-- POST /assessments ---|                          |
  |   /:id/start           |                          |
  |                        |-- INSERT assessment_----->|
  |                        |   attempt (pending)      |
  |<-- { sessionId, -------|                          |
  |   questions, timer }   |                          |
  |                        |                          |
  |===[ User takes test ]================================|
  |                        |                          |
  |-- POST /assessments ---|                          |
  |   /:id/submit          |                          |
  |   { answers[] }        |                          |
  |                        |-- Validate answers       |
  |                        |-- Calculate score        |
  |                        |-- UPDATE attempt -------->|
  |                        |   (score, completed_at)  |
  |                        |-- Log audit event        |
  |                        |-- Create notification    |
  |<-- { score, max, ------|                          |
  |   correct, total }     |                          |
  |                        |                          |
  |-- GET /assessments ---|                           |
  |   /:id/results          |                          |
  |                        |-- SELECT attempt -------->|
  |<-- { full results } ---|                          |
```

## Database Schema

### assessments table
```sql
CREATE TABLE assessments (
  id            UUID PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,        -- "Full Stack Development"
  type          assessment_type NOT NULL,     -- Technical | Aptitude | Soft_Skills | Domain
  max_score     INTEGER DEFAULT 100,
  duration      INTEGER NOT NULL,             -- minutes
  passing_score INTEGER DEFAULT 60,
  description   TEXT,
  instructions  TEXT,
  is_active     BOOLEAN DEFAULT true
);
```

### assessment_questions table
```sql
CREATE TABLE assessment_questions (
  id              UUID PRIMARY KEY,
  assessment_id   UUID REFERENCES assessments(id),
  question_text   TEXT NOT NULL,
  options         TEXT[] NOT NULL,             -- 4 options
  correct_index   INTEGER NOT NULL,            -- index of correct answer
  points          INTEGER DEFAULT 10,
  order_index     INTEGER NOT NULL             -- question order
);
```

### assessment_attempts table
```sql
CREATE TABLE assessment_attempts (
  id              UUID PRIMARY KEY,
  assessment_id   UUID REFERENCES assessments(id),
  student_id      UUID REFERENCES student_profiles(id),
  status          assessment_status DEFAULT 'pending',
  score           INTEGER DEFAULT 0,
  max_score       INTEGER DEFAULT 100,
  answers         JSONB,                       -- { "q1": 2, "q2": 0, ... }
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  time_taken_sec  INTEGER
);
```

## Scoring Logic

```typescript
function calculateScore(answers: Record<string, number>, questions: Question[]): AssessmentResult {
  let correct = 0
  let totalPoints = 0
  let earnedPoints = 0

  for (const question of questions) {
    totalPoints += question.points
    
    if (answers[question.id] === question.correctIndex) {
      correct++
      earnedPoints += question.points
    }
  }

  const percentage = Math.round((earnedPoints / totalPoints) * 100)

  return {
    correct,
    total: questions.length,
    earnedPoints,
    totalPoints,
    percentage,
    passed: percentage >= passingScore,
    grade: percentage >= 90 ? 'Excellent' :
           percentage >= 75 ? 'Good' :
           percentage >= 60 ? 'Average' :
           'Needs Improvement',
  }
}
```

## Timer / Auto-Submit Logic

```typescript
// Server-side: validate time limit on submission
async function submitAssessment(attemptId: string, answers: any) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: { assessment: true }
  })

  const elapsedSeconds = Math.floor(
    (Date.now() - attempt.startedAt.getTime()) / 1000
  )
  const maxSeconds = attempt.assessment.duration * 60

  if (elapsedSeconds > maxSeconds) {
    // Auto-submit: use whatever answers were provided
    // Mark as completed regardless
  }

  // Calculate score and save
}
```

## API Endpoints

| Method | Path                           | Auth    | Description                    |
|--------|--------------------------------|---------|--------------------------------|
| GET    | /api/assessments               | Student | List available assessments     |
| GET    | /api/assessments/:id           | Student | Get assessment details         |
| POST   | /api/assessments/:id/start     | Student | Start an attempt (returns Qs)  |
| POST   | /api/assessments/:id/submit    | Student | Submit answers                 |
| GET    | /api/assessments/:id/results   | Student | Get detailed results           |
| GET    | /api/assessments/history       | Student | Get all past attempts          |
| POST   | /api/assessments               | Admin   | Create assessment              |
| PUT    | /api/assessments/:id           | Admin   | Update assessment              |
| DELETE | /api/assessments/:id           | Admin   | Delete assessment              |

## Security Considerations

1. **Server-side validation**: Answers are validated on the backend, not just the frontend
2. **Time enforcement**: Timer is enforced server-side; frontend timer is UI only
3. **Anti-cheat**: Questions are shuffled; options are randomized per attempt
4. **Rate limiting**: Max 3 attempts per assessment per student per day
5. **Data integrity**: Once submitted, answers cannot be modified
6. **Partial submission**: Auto-saves progress every 30 seconds
7. **Session timeout**: Assessment session expires if no activity for 5 minutes

## Question Types (Future)

| Type           | Description                    | Scoring                       |
|----------------|--------------------------------|-------------------------------|
| Multiple Choice| Single correct answer          | Points if correct             |
| Multiple Select| Multiple correct answers       | Partial credit                |
| True/False     | Binary choice                  | Points if correct             |
| Coding         | Write code to solve problem    | Test-case based               |
| Essay          | Free-form text answer          | Manual review / AI grading    |

