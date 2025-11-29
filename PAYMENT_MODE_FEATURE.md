# Payment Gateway Toggle Feature

## Overview

This feature allows ADMIN users to switch between two payment modes for subscription plans:

- **MANUAL**: Users upload payment receipts for manual admin approval
- **RAZORPAY**: Users pay directly via Razorpay instant payment gateway

## Architecture

### Database Schema

The payment mode is stored in the `system_settings` table:

```sql
CREATE TABLE system_settings (
  id        TEXT PRIMARY KEY,
  key       TEXT UNIQUE NOT NULL,
  value     TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

The payment mode is stored with:
- `key`: "PAYMENT_MODE"
- `value`: "MANUAL" or "RAZORPAY"

### API Endpoints

#### GET `/api/admin/payment-mode`

Returns the current payment mode configuration.

**Response:**
```json
{
  "mode": "MANUAL",
  "available": ["MANUAL", "RAZORPAY"]
}
```

#### POST `/api/admin/payment-mode`

Updates the payment mode (ADMIN only).

**Request:**
```json
{
  "mode": "RAZORPAY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment mode updated to RAZORPAY",
  "mode": "RAZORPAY",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Components

#### PaymentModeToggle Component

Location: `/src/components/admin/PaymentModeToggle.tsx`

Features:
- Real-time updates using TanStack Query
- Auto-refresh every 30 seconds
- Admin-only access control
- Visual feedback with loading states
- Error handling with retry functionality

Props:
```typescript
interface PaymentModeToggleProps {
  currentMode?: 'MANUAL' | 'RAZORPAY' | null
  onModeChange?: (mode: 'MANUAL' | 'RAZORPAY') => void
  isAdmin: boolean
}
```

## Integration Points

### Admin Dashboard

The PaymentModeToggle component is integrated into:
- `/src/app/admin/dashboard/page.tsx` (Overview tab)
- Automatically detects admin role
- Shows real-time payment mode status

### Subscription Page

The subscription page at `/src/app/subscription/page.tsx`:

1. **Reads payment mode** using TanStack Query
2. **Shows admin status** when admin user is logged in
3. **Updates UI** based on current payment mode:
   - MANUAL: Shows "Upload Payment Proof" workflow
   - RAZORPAY: Shows "Proceed to Online Payment" button
4. **Auto-refreshes** every 30 seconds
5. **Handles loading/error states** gracefully

## User Experience

### For Admin Users

1. **Visual Toggle**: Clean switch interface in admin dashboard
2. **Real-time Updates**: Changes reflect immediately across all users
3. **Status Indicators**: Clear badges showing current mode
4. **Error Handling**: Retry functionality if API fails

### For Regular Users

1. **Seamless Experience**: Payment method adapts automatically
2. **Clear Instructions**: Different CTAs based on payment mode
3. **No Page Reload**: Updates happen in real-time

## Safety Features

### Access Control

- **Admin Only**: Only users with ADMIN role can change payment mode
- **Server-side Validation**: API validates user permissions
- **Client-side Protection**: UI disables controls for non-admin users

### Error Handling

- **Graceful Degradation**: Defaults to MANUAL if API fails
- **Retry Mechanism**: Automatic retry with exponential backoff
- **User Feedback**: Clear error messages and loading states

### Data Integrity

- **Database Persistence**: Settings survive server restarts
- **Atomic Updates**: Single transaction for mode changes
- **Validation**: Only accepts valid mode values

## Technical Implementation

### State Management

- **TanStack Query**: Used for caching and real-time updates
- **Query Invalidation**: Automatic cache refresh on changes
- **Optimistic Updates**: Immediate UI feedback

### Performance

- **Caching**: 30-second refresh interval
- **Lazy Loading**: Component-level data fetching
- **Minimal Re-renders**: Efficient state updates

### Security

- **Input Validation**: Server-side validation of mode values
- **Authentication**: Role-based access control
- **Error Sanitization**: Safe error messages

## Testing

### Manual Testing

1. **Admin Dashboard**: Toggle between modes and verify persistence
2. **Subscription Page**: Check UI updates in real-time
3. **Cross-browser**: Test in different browsers
4. **Mobile**: Verify responsive design

### Automated Testing

Run the test script:
```bash
node test-payment-mode.js
```

This tests:
- API endpoint functionality
- Mode switching
- Error handling
- Data persistence

## Configuration

### Environment Variables

- `NEXT_PUBLIC_PAYMENT_MODE`: Optional default payment mode
- Falls back to "MANUAL" if not set

### Database Setup

The system_settings table is created automatically when you run:
```bash
npm run db:push
```

## Troubleshooting

### Common Issues

1. **Payment mode not updating**: Check admin permissions
2. **UI not refreshing**: Verify TanStack Query setup
3. **API errors**: Check database connection
4. **Access denied**: Confirm user has ADMIN role

### Debug Mode

Enable debug logging by checking browser console for:
- API request/response logs
- Query cache status
- Error details

## Future Enhancements

### Planned Features

1. **Audit Log**: Track payment mode changes with timestamps
2. **Multiple Gateways**: Support for additional payment providers
3. **Scheduled Changes**: Ability to schedule mode changes
4. **Analytics**: Usage statistics for each payment mode

### Scalability

- **Redis Integration**: For distributed cache invalidation
- **WebSockets**: Real-time updates without polling
- **Microservices**: Separate payment mode service

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database connection
3. Confirm admin permissions
4. Test API endpoints directly

## Dependencies

- `@tanstack/react-query`: State management and caching
- `framer-motion`: Animations
- `lucide-react`: Icons
- `sonner`: Toast notifications
- `prisma`: Database ORM
- `next.js`: React framework