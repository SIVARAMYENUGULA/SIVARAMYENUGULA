# JWT Authentication Architecture

## Token Strategy
- Access Token: 15-minute expiry, stored in memory/localStorage
- Refresh Token: 7-day expiry, stored in DB + localStorage
- Algorithm: HS256 (symmetric)
- Secrets: JWT_SECRET (access), JWT_REFRESH_SECRET (refresh)

## Authentication Flow

### Register
POST /auth/register -> Validate -> Hash password (bcrypt) -> Create User + role profile -> Generate JWT tokens -> Store refreshToken -> Return {user, token, refreshToken}

### Login
POST /auth/login -> Find user -> Compare password (bcrypt) -> Check isActive -> Generate tokens -> Update lastLoginAt -> Return {user, token, refreshToken}

### Authenticated Request
GET /api/* (Authorization: Bearer <token>) -> Extract token -> Verify JWT -> Decode payload (sub, role) -> Find user -> Check isActive -> Attach to req.user -> Route handler

### Token Refresh
POST /auth/refresh {refreshToken} -> Verify signature -> Find user -> Compare tokens -> Generate new pair -> Return {token, refreshToken}

### Logout
POST /auth/logout -> Set refreshToken = null -> Return success

## Middleware Pattern
- authenticate.js: Verifies JWT, fetches user from DB, sets req.user
- authorize.js: Factory function, checks req.user.role against allowedRoles

## Security Measures
- Passwords hashed with bcrypt (12 salt rounds)
- Refresh token rotation on each refresh
- Password/refreshToken use select: false
- Express-rate-limit on auth routes
- Helmet security headers
- toJSON() strips sensitive fields