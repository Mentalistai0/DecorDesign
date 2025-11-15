# How to View Subscriptions from Supabase

You have **3 easy ways** to view subscriptions, payments, and user data:

---

## ⭐ Option 1: Admin Dashboard (Easiest)

I've created a beautiful admin dashboard for you!

### How to Use:

1. **Open the Dashboard**:
   - Open `ADMIN_DASHBOARD.html` in your browser
   - Or visit: http://138.68.241.35/ADMIN_DASHBOARD.html (after deployment)

2. **Login**:
   - Use any user account credentials from your app
   - The dashboard requires authentication

3. **View Data**:
   - **Stats**: See total users, revenue, payments, credits
   - **Payments Tab**: View all payments with status
   - **Users & Credits Tab**: See all users and their credit balances
   - **Transactions Tab**: View detailed transaction history

### Features:
- ✅ Real-time data from Supabase
- ✅ Beautiful, responsive interface
- ✅ No coding required
- ✅ Filter and search capabilities

---

## 🔧 Option 2: API Endpoints

If you prefer using API calls (e.g., with Postman or curl):

### Get Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://138.68.241.35/api/admin/stats
```

### Get All Payments
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://138.68.241.35/api/admin/payments
```

### Get All User Credits
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://138.68.241.35/api/admin/credits
```

### Get Transactions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://138.68.241.35/api/admin/transactions
```

**To get your token:**
1. Login via API or frontend
2. Copy the JWT token from the response
3. Use it in the Authorization header

---

## 📊 Option 3: Supabase Dashboard (Direct Database Access)

Access your data directly in Supabase:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Login to your account
3. Select project: **ixtmmrettexwjasdxytr**

### Step 2: View Tables
Click **Table Editor** in the left sidebar, then select:

#### **`stripe_payments`** - All Payment Records
- See: payment status, amounts, users, plans
- Filter by status (succeeded, pending, failed)
- View payment dates and Stripe IDs

#### **`user_credits`** - User Credit Balances
- See: total credits, used credits, available credits
- View by image/video credits separately
- See Stripe customer IDs

#### **`credit_transactions`** - Transaction History
- See: all credit additions and deductions
- Filter by transaction type
- View balances before/after each transaction

#### **`plans`** - Available Plans
- View all pricing plans
- See credit allocations
- Check active/inactive plans

### Step 3: Run SQL Queries
Click **SQL Editor** and run custom queries:

#### View All Payments with User Info
```sql
SELECT
  sp.id,
  au.email as user_email,
  p.name as plan_name,
  sp.amount_cents / 100 as amount_usd,
  sp.status,
  sp.credits_allocated,
  sp.created_at
FROM stripe_payments sp
LEFT JOIN auth.users au ON sp.user_id = au.id
LEFT JOIN plans p ON sp.plan_id = p.id
ORDER BY sp.created_at DESC
LIMIT 50;
```

#### View User Credits Summary
```sql
SELECT
  au.email,
  uc.credits_image_total,
  uc.credits_image_used,
  uc.credits_image_total - uc.credits_image_used as image_available,
  uc.credits_video_total,
  uc.credits_video_used,
  uc.credits_video_total - uc.credits_video_used as video_available,
  uc.stripe_customer_id,
  uc.created_at as account_created
FROM user_credits uc
LEFT JOIN auth.users au ON uc.user_id = au.id
ORDER BY uc.created_at DESC;
```

#### View Today's Transactions
```sql
SELECT
  au.email,
  ct.transaction_type,
  ct.credit_type,
  ct.amount,
  ct.balance_after,
  ct.description,
  ct.created_at
FROM credit_transactions ct
LEFT JOIN auth.users au ON ct.user_id = au.id
WHERE DATE(ct.created_at) = CURRENT_DATE
ORDER BY ct.created_at DESC;
```

#### Calculate Total Revenue
```sql
SELECT
  COUNT(*) as total_payments,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
  SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) / 100 as total_revenue_usd
FROM stripe_payments;
```

---

## 🎯 Recommended Workflow

**For Quick Checks**: Use the Admin Dashboard
**For Detailed Analysis**: Use Supabase SQL Editor
**For Automation**: Use the API Endpoints

---

## 🔐 Security Notes

1. **Admin Dashboard**: Only accessible with valid user credentials
2. **API Endpoints**: Require authentication token
3. **Supabase Dashboard**: Only accessible to project owners

---

## 📈 Key Metrics to Track

- **Total Users**: Number of registered users
- **Conversion Rate**: Users who purchased vs free users
- **Revenue**: Total from successful payments
- **Credits Used**: Track engagement via credit usage
- **Popular Plans**: Which pricing tier sells most

---

## 🆘 Troubleshooting

### Dashboard Not Loading?
- Check if backend is running: http://138.68.241.35/health
- Verify you're logged in with valid credentials

### No Data Showing?
- Make sure database migrations are run in Supabase
- Check if users have made any purchases yet

### API Returns 401/403?
- Ensure you're sending the authentication token
- Token may have expired, login again

---

## 📞 Need Help?

Check the server logs:
```bash
ssh root@138.68.241.35
pm2 logs decor-design-backend
```

View Supabase logs in the dashboard under **Logs** → **API Logs**
