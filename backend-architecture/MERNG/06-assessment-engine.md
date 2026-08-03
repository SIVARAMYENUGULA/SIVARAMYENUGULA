# Assessment Engine Architecture

## Start Assessment
POST /assessments/:id/start -> Find assessment + questions -> Check no existing session -> Create session (pending) -> Shuffle questions -> Strip answers -> Return {sessionId, questions, duration, startedAt}

## Submit Assessment
POST /assessments/:id/submit {answers[]} -> Find session -> Validate in_progress -> Check timer -> Grade each answer -> Calculate score -> Determine grade -> Create Score -> Update SkillPassport -> Return result

## View Results
GET /assessments/:id/results -> Find latest Score doc -> Return breakdown

## Scoring
- Percentage = (earnedPoints / totalPoints) * 100
- Grade: >=90% Excellent, >=75% Good, >=50% Average, else Needs Improvement
- Passed: percentage >= passingScore (default 60)

## Timer Enforcement
- Server-side: startedAt + duration compared on submit
- Client-side: Countdown timer with auto-submit at 0
- Session states: pending -> in_progress -> completed | timed_out

## Anti-Cheat
- Correct answers stripped from client
- Questions shuffled per attempt
- Server-side time limit enforced
- One active session per assessment per student