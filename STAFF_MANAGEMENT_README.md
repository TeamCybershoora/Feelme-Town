# Staff Management System

This document describes the staff management functionality added to the FeelME Town application.

## Features Added

### 1. Staff User Management
- **Password Field**: Added password field to staff creation and management in the admin panel
- **Database Storage**: Staff passwords are now stored in the database for login authentication
- **Secure Updates**: Password updates are handled securely (only updates when new password is provided)

### 2. Staff Login System
- **Login Page**: Created `/management` route for staff login
- **Authentication API**: New API endpoint `/api/staff/login` for credential verification
- **Session Management**: Staff sessions are stored in localStorage with 24-hour expiration

### 3. Staff Dashboard
- **Dashboard Access**: Staff can access `/management/dashboard` after login
- **Limited Access**: Staff dashboard shows relevant information and quick actions
- **Session Protection**: Dashboard is protected and requires valid staff authentication

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── staff/
│   │       └── login/
│   │           └── route.ts          # Staff login API
│   ├── management/
│   │   ├── page.tsx                  # Staff login page
│   │   ├── layout.tsx                # Management layout with auth
│   │   └── dashboard/
│   │       └── page.tsx              # Staff dashboard
│   └── Administrator/
│       └── user-list/
│           └── page.tsx              # Updated with password field
└── lib/
    └── db-connect.ts                 # Updated to handle passwords
```

## API Endpoints

### Staff Login
- **POST** `/api/staff/login`
- **Body**: `{ email: string, password: string }`
- **Response**: Staff user data (excluding password) on success

## Database Schema Updates

The `staff` collection now includes:
- `password`: Staff login password
- All existing fields remain unchanged

## Usage Instructions

### For Administrators:
1. Go to `/Administrator/user-list`
2. Click "Add Staff" button
3. Fill in all required fields including the new **Password** field
4. Save the staff member
5. Staff can now login using their email and password

### For Staff Members:
1. Navigate to `/management`
2. Enter email and password
3. Click "Sign In"
4. Access staff dashboard with limited functionality

## Security Notes

- Staff passwords are stored in plain text (consider implementing hashing for production)
- Staff sessions expire after 24 hours
- Dashboard access is protected by authentication checks
- Passwords are not shown in edit forms for security

## Future Enhancements

- Password hashing (bcrypt or similar)
- Password reset functionality
- Role-based permissions for different staff levels
- Audit logging for staff activities
- Two-factor authentication
