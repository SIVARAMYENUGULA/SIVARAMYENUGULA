# Authentication Architecture

## Flow

```
Client                    Server
  |                         |
  |-- POST /auth/login ---->|
  |   { email, password }   |
  |                         |-- Validate input (Zod)
  |                         |-- Find user by email
  |                         |-- Compare password hash (bcrypt)
  |                         |-- Generate JWT access + refresh tokens
  |                         |-- Store refresh token hash in DB
  |                         |-- Log audit event
  |                         |
  |<---- 200 { user, -------|
  |   token, refreshToken } |
  |                         |
  |-- [API Requests] ------>|
  |   Authorization:        |-- Verify JWT in middleware
  |   Bearer <token>        |-- Attach user to req
  |                         |-- Check role if needed
  |<---- 200 Response ------|
  |                         |
  |-- POST /auth/refresh -->|
  |   { refreshToken }      |
  |                         |-- Verify refresh token
  |                         |-- Generate new token pair
  |                         |-- Rotate refresh token
  |<---- 200 { token, ------|
  |   refreshToken }        |
```

## JWT Token Strategy

| Property        | Access Token        | Refresh Token            |
|-----------------|---------------------|--------------------------|
| **Expiry**      | 15 minutes          | 7 days                   |
| **Storage**     | Memory / HTTP-only   | HTTP-only cookie or      |
|                 | cookie              | localStorage (hashed)    |
| **Rotation**    | N/A                 | Rotated on each use      |
| **Revocation**  | Short TTL           | DB blacklist / delete    |

## JWT Payload

```typescript
interface JwtPayload {
  sub: string      // user id
  email: string
  role: UserRole
  iat: number
  exp: number
}
```

## Password Policy

- Min 8 characters, max 128
- At least: 1 uppercase, 1 lowercase, 1 number
- Hashed with bcrypt (cost factor 12)
- Never stored in plain text
- Rate-limited: 5 attempts per 15 minutes

## Security Measures

1. **Rate Limiting**: 5 login attempts / 15 min per IP
2. **Account Lockout**: After 10 failed attempts, lock for 30 min
3. **Email Verification**: Required for first login
4. **Refresh Token Rotation**: Old refresh token invalidated on use
5. **Audit Trail**: All auth events logged
6. **Password Reset**: Time-limited token (15 min), sent via email
7. **HTTPS Only**: Strict transport security headers

## Endpoints

| Method | Path                | Auth Required | Description               |
|--------|---------------------|---------------|---------------------------|
| POST   | /auth/register      | No            | Create account            |
| POST   | /auth/login         | No            | Login                     |
| POST   | /auth/logout        | Yes           | Invalidate refresh token  |
| POST   | /auth/refresh       | No (has token)| Refresh access token      |
| POST   | /auth/verify-email  | No (has token)| Verify email address      |
| POST   | /auth/forgot-password| No           | Send reset email          |
| POST   | /auth/reset-password| No (has token)| Reset password            |
| GET    | /auth/profile       | Yes           | Get current user profile  |
| PUT    | /auth/profile       | Yes           | Update profile            |

