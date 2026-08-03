# Role-Based Access Control (RBAC) Architecture

## Role Hierarchy

```
                    +-------------------+
                    |     ADMIN         |
                    | (super admin)     |
                    +--------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
+---------v------+  +-------v-------+  +-------v-------+
|    COMPANY     |  |    COLLEGE    |  |    STUDENT     |
| (hiring org)   |  | (placement)   |  | (job seeker)   |
+----------------+  +---------------+  +----------------+
```

## Permission Matrix

| Resource              | Student | Company | College | Admin |
|-----------------------|---------|---------|---------|-------|
| **Own Profile**       | CRUD    | CRUD    | CRUD    | CRUD  |
| **Other Users**       | R       | R       | R       | CRUD  |
| **Jobs**              | R       | CRUD    | R       | CRUD  |
| **Applications**      | CRUD*   | CRUD**  | R       | CRUD  |
| **Assessments**       | CRUD*   | R       | R       | CRUD  |
| **Assessment Results**| R*      | R       | R       | CRUD  |
| **Interviews**        | R*      | CRUD    | R       | CRUD  |
| **Skills**            | CRUD*   | R       | R       | CRUD  |
| **Notifications**     | CRUD*   | CRUD*   | CRUD*   | CRUD  |
| **Analytics**         | R*      | R*      | R*      | CRUD  |
| **Audit Logs**        | -       | -       | -       | CRUD  |

* = Own records only
** = Related to company's jobs only

## Implementation

### Middleware Pattern

```typescript
// 1. Authenticate - verify JWT and attach user to request
app.use('/api', authenticate)

// 2. Authorize - check role-based access
router.get('/jobs', authorize(['student', 'company', 'college', 'admin']), jobController.list)
router.post('/jobs', authorize(['company', 'admin']), jobController.create)
router.put('/jobs/:id', authorize(['company', 'admin']), jobController.update)
router.delete('/jobs/:id', authorize(['admin']), jobController.delete)
```

### Owner-Based Access

```typescript
// Applications: students can only see/modify their own
async function getApplications(req: Request, res: Response) {
  const where: Prisma.ApplicationWhereInput = {}
  
  if (req.user.role === 'student') {
    where.studentId = req.user.studentProfile.id
  } else if (req.user.role === 'company') {
    where.job = { companyId: req.user.companyProfile.id }
  }
  // Admin sees all
  
  const applications = await prisma.application.findMany({ where })
  res.json(applications)
}
```

## Route Guards per Role

### Student Routes

```typescript
const studentRoutes = Router()
studentRoutes.use(authorize(['student']))

studentRoutes.get('/dashboard', studentController.dashboard)
studentRoutes.get('/assessments', studentController.assessments)
studentRoutes.post('/assessments/:id/start', studentController.startAssessment)
studentRoutes.post('/applications', studentController.submitApplication)
studentRoutes.get('/applications', studentController.listApplications)
```

### Company Routes

```typescript
const companyRoutes = Router()
companyRoutes.use(authorize(['company']))

companyRoutes.get('/dashboard', companyController.dashboard)
companyRoutes.post('/jobs', companyController.createJob)
companyRoutes.post('/interviews', companyController.scheduleInterview)
```

### College Routes

```typescript
const collegeRoutes = Router()
collegeRoutes.use(authorize(['college']))

collegeRoutes.get('/dashboard', collegeController.dashboard)
collegeRoutes.get('/students', collegeController.listStudents)
collegeRoutes.get('/analytics', collegeController.analytics)
```

### Admin Routes

```typescript
const adminRoutes = Router()
adminRoutes.use(authorize(['admin']))

adminRoutes.get('/dashboard', adminController.dashboard)
adminRoutes.get('/users', adminController.listUsers)
adminRoutes.post('/users', adminController.createUser)
adminRoutes.get('/audit-logs', adminController.auditLogs)
```

## Seed Data Roles

| Role    | Default Users                          |
|---------|----------------------------------------|
| Admin   | admin@placemux.com                     |
| Student | student@college.edu                    |
| Company | hr@techcorp.com                        |
| College | placement@iitb.ac.in                   |

