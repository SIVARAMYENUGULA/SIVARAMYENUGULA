# Role-Based Access Control (RBAC) Architecture

## Role Definitions
| Role | Description | Profile Model |
|------|-------------|---------------|
| student | Job seeker | Student.js |
| company | Job poster | Company.js |
| college | Placement coordinator | College.js |
| admin | Super admin | AdminProfile.js |

## Permission Matrix
| Resource | student | company | college | admin |
|----------|---------|---------|---------|-------|
| Own Profile | CRUD | CRUD | CRUD | CRUD |
| Browse Jobs | R | R | R | R |
| Post Jobs | - | CRUD | - | CRUD |
| Apply to Jobs | CRUD | - | - | - |
| View Applications | Own | Own | - | All |
| Update App Status | - | CRUD | - | - |
| Take Assessments | CRUD | - | - | - |
| View Scores | Own | - | Agg | All |
| Notifications | Own | Own | Own | All |
| Audit Logs | - | - | - | CRUD |
| Manage Users | - | - | - | CRUD |

## Data Scoping
- Student: Applications scoped to student._id
- Company: Jobs scoped to company._id, Applications for their jobs
- Notifications: Always scoped to userId = req.user._id

## Middleware Usage
router.get('/', authenticate, authorize('student', 'company'), handler);
authorize() is a factory returning configured middleware. Returns 403 on failure.