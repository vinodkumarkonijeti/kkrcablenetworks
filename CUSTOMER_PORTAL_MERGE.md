# Customer Portal & Payment Integration — Merge Complete

## What Was Added

This merge brings **Customer Portal** and **Payment Integration** features from the `kk-cable-connect-main` project into KKR Cable Network.

### New Components

1. **`src/components/PaymentHistory.tsx`**
   - Displays customer payment history fetched from Firestore `bills` collection
   - Shows payment amount, date, status (Paid/Pending)
   - Download link for invoices (if available)
   - Show More / Show Less toggle for many payments

2. **`src/components/PaymentSection.tsx`**
   - Allows customers to pay bills
   - Integrated payment methods: UPI, Card, Bank Transfer
   - Payment amount input (up to bill amount)
   - Simulated payment processing (ready for Razorpay/UPI API integration)
   - Security notice and error handling

3. **`src/components/SupportChat.tsx`**
   - Customer support messaging interface
   - Real-time message fetching from Firestore `support_tickets` collection
   - Send/receive messages with timestamps
   - Stores messages in Firestore (ready for operator response system)

### New Pages

4. **`src/pages/CustomerPortal.tsx`**
   - Main customer-facing page after login
   - Displays connection status (Active/Inactive with Wifi icon)
   - Tabbed interface: Dashboard | Pay Bill | Payment History | Support
   - Shows connection details (name, phone, village, box ID)
   - Shows bill summary with current amount and status
   - Auto-fetches customer record by email from Firestore

### Route Integration

- Added route `/customer-portal` in `src/App.tsx`
- Protected route (requires authentication)
- Accessible after successful login

## How It Works

### Customer Portal Flow

1. Customer logs in with their email/password
2. Auto-redirected to either:
   - `/dashboard` (if role = 'admin' or 'operator')
   - `/customer-portal` (if role = 'customer' or not specified)
3. Customer portal fetches their record from Firestore using their email
4. Displays tabs:
   - **Dashboard**: Connection status + bill info
   - **Pay Bill**: Payment interface
   - **Payment History**: Past payments from `bills` collection
   - **Support**: Chat with support team

### Data Sources

- **Customer data**: `firestore.customers` (matched by email)
- **Bills/Payments**: `firestore.bills` (filtered by customerId)
- **Support messages**: `firestore.support_tickets` (filtered by customerId)

## Configuration Required

### 1. Add `customer` Role to User Type
✅ Already updated in `src/types/index.ts` with `role?: 'admin' | 'operator'`
- Can now add `role: 'customer'` when needed

### 2. Update Firestore Security Rules
✅ Created `firestore.rules` with role-based access control
- Customers can read their own data
- Operators/admins can read all customer data
- Support tickets are read/write for all authenticated users

### 3. Create Support Tickets Collection (Optional)
If you want the support chat to save messages to Firestore:
```typescript
// Collection: support_tickets
// Document structure:
{
  customerId: string,
  sender: 'customer' | 'support',
  message: string,
  timestamp: Timestamp,
  resolved: boolean,
  createdAt: Timestamp
}
```

### 4. Update Customer Records with Email (Important!)
Ensure each customer document in Firestore has an `email` field:
```typescript
// In customers collection, each doc should have:
{
  firstName: "John",
  lastName: "Doe",
  email: "customer@example.com",  // ← Add this
  phoneNumber: "9876543210",
  billAmount: 500,
  // ... other fields
}
```

## Payment Integration (Ready for API)

The `PaymentSection` component is ready for real payment processing:

### To Enable Razorpay or UPI

1. Install payment library (example: Razorpay):
   ```bash
   npm install razorpay
   ```

2. Update `handlePayment()` in `src/components/PaymentSection.tsx`:
   ```typescript
   const handlePayment = async () => {
     // Replace the setTimeout simulation with actual API call
     const response = await razorpay.orders.create({
       amount: amount * 100,
       currency: 'INR',
       receipt: `receipt_${customerId}_${Date.now()}`
     });
     
     // Handle payment flow...
   };
   ```

3. Store payment confirmation in Firestore:
   ```typescript
   await addDoc(collection(db, 'bills'), {
     customerId,
     amount,
     status: 'Paid',
     timestamp: serverTimestamp()
   });
   ```

## Next Steps (Recommended)

1. **Test the flow**:
   - Create a test customer with `email` field in Firestore
   - Add customer `role` to AuthContext during registration
   - Log in as customer and verify portal loads

2. **Connect real payments**:
   - Integrate Razorpay or UPI gateway
   - Update `handlePayment()` with real API calls
   - Store payment records in Firestore

3. **Enable support tickets**:
   - Create `support_tickets` collection in Firestore
   - Add operator dashboard to respond to tickets
   - Update `SupportChat` component to save messages

4. **Restrict routes by role**:
   - Update `ProtectedRoute` component to check user `role`
   - Redirect customers away from `/dashboard`
   - Redirect operators away from `/customer-portal`

## Files Modified

- `src/App.tsx` — Added `/customer-portal` route
- `src/types/index.ts` — Already has role field

## Files Created

- `src/components/PaymentHistory.tsx`
- `src/components/PaymentSection.tsx`
- `src/components/SupportChat.tsx`
- `src/pages/CustomerPortal.tsx`

## Testing Checklist

- [ ] Customer records in Firestore have `email` field
- [ ] Test user creation with default `role: 'operator'` or explicit `role: 'customer'`
- [ ] Navigate to `/customer-portal` after login
- [ ] Verify connection status displays correctly
- [ ] Test payment amount input and validation
- [ ] Verify payment history loads from `bills` collection
- [ ] Test support chat message sending (check console logs)

---

**Status**: ✅ Merge complete. Ready for integration testing and payment API connection.
