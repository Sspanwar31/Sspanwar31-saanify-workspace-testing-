# 🔐 Secure Multi-Role Authentication System

A comprehensive authentication and authorization system for the Saanify financial society platform with role-based access control, JWT tokens, and refresh token support.

## 🎯 Features

### ✅ Core Authentication
- **Dual Role System**: Super Admin and Client roles with distinct permissions
- **Secure Login**: Password hashing with bcrypt, JWT tokens with expiration
- **Refresh Tokens**: Automatic token refresh for extended sessions
- **Session Management**: Secure cookie-based session handling with localStorage fallback

### 🛡️ Security Features
- **Role-Based Authorization**: Middleware-based access control
- **Token Expiration**: Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **Secure Cookies**: HTTP-only, secure, sameSite protection
- **Input Validation**: Zod schema validation for all API endpoints
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

### 🏗️ Architecture
- **Middleware Protection**: Route-level authentication and authorization
- **API Organization**: Separate endpoints for admin and client operations
- **Database Schema**: User model with role field and society relationships
- **Frontend Integration**: React components with automatic token management

## 📋 Database Schema

### User Model
```prisma
model User {
  id               String           @id @default(cuid())
  email            String           @unique
  name             String?
  phone            String?
  password         String           // bcrypt hashed
  role             UserRole         @default(CLIENT)
  societyAccountId String?
  isActive         Boolean          @default(true)
  lastLoginAt      DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relations
  societyAccount SocietyAccount? @relation(fields: [societyAccountId], references: [id])
  createdSocieties SocietyAccount[] @relation("SocietyCreator")
}

enum UserRole {
  SUPER_ADMIN
  CLIENT
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with role selection
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/check-session` - Validate current session

### Admin Only (SUPER_ADMIN)
- `GET /api/admin/users` - List all users with pagination
- `PATCH /api/admin/users` - Update user status/role
- `GET /api/admin/analytics` - System analytics and statistics

### Client Only (CLIENT)
- `GET /api/client/profile` - Get user profile
- `PATCH /api/client/profile` - Update user profile
- `GET /api/client/financial` - Get financial data

## 🎨 Frontend Components

### Login Modal
- **Role Selection**: Choose between Client and Admin login
- **Form Validation**: Real-time validation with error messages
- **Token Management**: Automatic token storage and refresh
- **Redirect Logic**: Role-based dashboard redirection

### Dashboard Pages
- **Admin Dashboard**: `/dashboard/admin` - System management interface
- **Client Dashboard**: `/dashboard/client` - User-specific interface
- **Auth Guards**: Automatic authentication checks and redirects

## 🔧 Implementation Details

### Middleware Configuration
```typescript
// Route protection
const protectedRoutes = ['/dashboard/admin', '/dashboard/client', '/dashboard']

// Role-based access
if (pathname.startsWith('/dashboard/admin') && decoded.role !== 'SUPER_ADMIN') {
  return NextResponse.redirect(new URL('/', request.url))
}
```

### Token Management
```typescript
// Access token (15 minutes)
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })

// Refresh token (7 days)
const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
```

### API Authorization
```typescript
// Admin-only endpoint
export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  // Admin logic here
})

// Client-only endpoint
export const GET = withClient(async (req: AuthenticatedRequest) => {
  // Client logic here
})
```

## 🚀 Usage Examples

### Login with Role Selection
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    password: 'password123',
    userType: 'admin' // or 'client'
  })
})
```

### Authenticated API Request
```javascript
import { makeAuthenticatedRequest } from '@/lib/auth'

const response = await makeAuthenticatedRequest('/api/client/profile')
const data = await response.json()
```

### Session Check
```javascript
import { checkSession } from '@/lib/auth'

const { authenticated, user } = await checkSession()
if (authenticated && user.role === 'SUPER_ADMIN') {
  // User is authenticated admin
}
```

## 🔐 Security Considerations

### ✅ Implemented
- Password hashing with bcrypt
- JWT token expiration and refresh
- HTTP-only cookies for tokens
- Role-based access control
- Input validation and sanitization
- Secure headers and CORS configuration

### 🔄 Best Practices
- Regular token rotation
- Rate limiting on auth endpoints
- Audit logging for admin actions
- IP-based access monitoring
- Password complexity requirements

## 🎯 Role Permissions

### Super Admin
- ✅ View all users and societies
- ✅ Manage user accounts (activate/deactivate)
- ✅ Access system analytics
- ✅ Configure platform settings
- ✅ View all financial data

### Client
- ✅ View own profile and data
- ✅ Update personal information
- ✅ Access own financial records
- ✅ Submit requests and tickets
- ❌ Cannot access other users' data
- ❌ Cannot access admin functions

## 🧪 Testing

### Test Credentials
```
Admin: superadmin@saanify.com / admin123
Client: client@saanify.com / client123
```

### Test Scenarios
1. **Valid Login**: Both roles should redirect to appropriate dashboards
2. **Invalid Credentials**: Should show error message
3. **Role Mismatch**: Admin trying to access client dashboard should be blocked
4. **Token Expiration**: Should automatically refresh tokens
5. **Session Check**: Should validate and refresh expired sessions

## 📱 Mobile & Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive design
- ✅ Touch-friendly interface
- ✅ Secure cookie handling
- ✅ LocalStorage fallback for tokens

## 🔄 Next Steps

### Potential Enhancements
- [ ] Multi-factor authentication (MFA)
- [ ] Social login integration (Google, Microsoft)
- [ ] Advanced audit logging
- [ ] Real-time notifications
- [ ] Advanced role management
- [ ] API rate limiting
- [ ] Session analytics
- [ ] Password reset functionality

---

This authentication system provides a robust, secure, and scalable foundation for the Saanify financial society platform with comprehensive role-based access control and modern security practices.