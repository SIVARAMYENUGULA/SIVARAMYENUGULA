# Audit Log Architecture

## Schema
- userId (ref User), action, resource, resourceId, details, ipAddress, userAgent, metadata (Mixed)
- Indexes: {userId:1}, {action:1}, {createdAt:-1}

## Audited Actions
- REGISTER, LOGIN, LOGOUT, TOKEN_REFRESH
- CREATE_JOB, UPDATE_JOB, DELETE_JOB
- APPLY, UPDATE_APP_STATUS
- START_ASSESSMENT, SUBMIT_ASSESSMENT
- ADMIN_DEACTIVATE_USER

## Rules
- Write-only (no update/delete)
- Admin-only access
- IP from req.ip or x-forwarded-for
- Indexed by createdAt for efficient queries