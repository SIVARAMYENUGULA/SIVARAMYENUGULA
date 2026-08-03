# Express.js Project Structure (MERN Stack)

## Directory Layout

backend/
+-- package.json
+-- server.js              # Entry point (connect DB + start server)
+-- .env
+-- src/
|   +-- app.js              # Express config (helmet, cors, morgan, routes)
|   +-- config/
|   |   +-- env.js           # dotenv config loader
|   |   +-- db.js            # Mongoose connection
|   |   +-- cors.js          # CORS options
|   +-- models/
|   |   +-- index.js          # Centralized model exports
|   |   +-- User.js           # Auth + role (bcrypt hashing)
|   |   +-- Student.js        # Student profile
|   |   +-- Company.js        # Company profile
|   |   +-- College.js        # College profile
|   |   +-- Job.js            # Job listings
|   |   +-- Application.js    # Job applications
|   |   +-- Assessment.js     # Assessment definitions
|   |   +-- Question.js       # Assessment questions
|   |   +-- AssessmentSession.js # Student attempt tracking
|   |   +-- Score.js          # Assessment results
|   |   +-- SkillPassport.js  # Student skill records
|   |   +-- Notification.js   # Notifications
|   |   +-- AuditLog.js       # Audit trail
|   +-- middleware/
|   |   +-- authenticate.js    # JWT verification
|   |   +-- authorize.js       # RBAC role factory
|   |   +-- errorHandler.js    # Central error handler (Mongoose, JWT errors)
|   +-- services/
|   |   +-- auth.service.js    # Register, login, refresh, logout
|   |   +-- assessment.service.js # Start, submit, score
|   |   +-- notification.service.js # Create, notify
|   +-- controllers/
|   |   +-- auth.controller.js
|   |   +-- assessment.controller.js
|   |   +-- job.controller.js
|   |   +-- application.controller.js
|   |   +-- notification.controller.js
|   +-- routes/
|   |   +-- index.js           # Route aggregator + /health
|   |   +-- auth.routes.js     # register, login, refresh, logout, profile
|   |   +-- assessment.routes.js # list, start, submit, results, history
|   |   +-- job.routes.js      # CRUD + search/filter/pagination
|   |   +-- application.routes.js # submit, list, updateStatus
|   |   +-- notification.routes.js # list, markRead, markAllRead
|   +-- utils/
|       +-- jwt.js             # Token generation + verification
|       +-- apiError.js        # Custom AppError class
|       +-- apiResponse.js     # success/paginated response helpers
+-- scripts/
|   +-- seed.js               # Database seeder
+-- tests/

## API Endpoints

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | /api/auth/register | No | - |
| POST | /api/auth/login | No | - |
| POST | /api/auth/refresh | No | - |
| POST | /api/auth/logout | Yes | All |
| GET | /api/auth/profile | Yes | All |
| GET | /api/jobs | Yes | All |
| GET | /api/jobs/:id | Yes | All |
| POST | /api/jobs | Yes | company, admin |
| PUT | /api/jobs/:id | Yes | company, admin |
| DELETE | /api/jobs/:id | Yes | admin |
| POST | /api/applications | Yes | student |
| GET | /api/applications | Yes | student, company |
| PUT | /api/applications/:id/status | Yes | company |
| GET | /api/assessments | Yes | student |
| GET | /api/assessments/history | Yes | student |
| GET | /api/assessments/:id | Yes | student |
| POST | /api/assessments/:id/start | Yes | student |
| POST | /api/assessments/:id/submit | Yes | student |
| GET | /api/assessments/:id/results | Yes | student |
| GET | /api/notifications | Yes | All |
| PUT | /api/notifications/:id/read | Yes | All |
| PUT | /api/notifications/read-all | Yes | All |
| GET | /api/health | No | - |

## Request Flow

Client -> server.js -> app.js -> routes -> authenticate -> authorize -> controller -> service -> model -> MongoDB

## Error Response Format

{ success: false, error: { code: "ERROR_CODE", message: "Human-readable message" } }

## Success Response Format

{ success: true, data: { ... }, message: "Optional message", pagination: { page, limit, total, pages } }