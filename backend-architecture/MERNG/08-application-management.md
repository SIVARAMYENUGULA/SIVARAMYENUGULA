# Application Management Architecture

## Flow
- Submit: POST /applications -> Find student -> Check no duplicate -> Verify job -> Create App -> Increment count -> Notify
- View: GET /applications -> Filter by role -> Populate job+student
- Update Status: PUT /applications/:id/status -> Find app -> Update -> Notify student

## Pipeline
Applied -> Shortlisted -> Interview -> Accepted
Any stage can go to Rejected

## Rules
- No duplicates: unique index on jobId+studentId
- Student profile required
- Status change triggers notification
- applicantsCount auto-incremented on create