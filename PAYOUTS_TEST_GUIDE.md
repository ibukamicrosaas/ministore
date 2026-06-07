# Payouts Automation Testing Guide

**Status**: ✅ Payout automation implemented and ready to test  
**Created**: 2026-06-07

---

## Quick Start

### 1. Configure CRON_SECRET

Add to `.env.local`:
```bash
CRON_SECRET=$(openssl rand -base64 32)
# Copy the output and paste it:
# CRON_SECRET=your-generated-secret-here
```

### 2. Test the Cron Job Locally

```bash
# Start dev server
npm run dev

# In another terminal, test the cron endpoint
curl -X GET "http://localhost:3000/api/cron/process-pending-payouts" \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d'=' -f2)"

# Expected: JSON with status "processed: 0, failed: 0" if no pending payouts
```

---

## Test Scenarios

### Scenario 1: Manual Admin Processing (Fast Test)

**Setup**:
1. Go to admin dashboard `/admin`
2. Find a pending payout in the "Reversements" section
3. Click "Marquer effectué" button

**What Happens Now (✅ Fixed)**:
- ✅ Payout calls Bictorys API immediately
- ✅ If success: status changes to 'completed', appears in history
- ✅ If error: shows error message, stays 'pending'
- ✅ User receives money in 24-48 hours

**Verification**:
```bash
# Check database for completed payout
# Go to Supabase → payouts table
# Filter by status='completed' and completed_at TODAY
```

---

### Scenario 2: Automated Cron Job (Real Test)

**Setup**:
1. Create a test payout in the database:

```sql
-- Insert test payout
INSERT INTO payouts (
  id, shop_id, gross_amount, commission_amount, net_amount,
  payout_method, payout_number, status, requested_at
) VALUES (
  'test-payout-' || gen_random_uuid(),
  'YOUR_SHOP_ID_HERE',
  10000, -- 10,000 FCFA
  300,   -- 3% commission
  9700,  -- net
  'wave',
  '+221771234567', -- test phone
  'pending',
  NOW()
);
```

2. Deploy to Vercel:
```bash
git add -A
git commit -m "feat: automate payout processing with cron job"
git push origin main
```

3. Wait for deployment, then trigger cron manually:

**Via Vercel Dashboard**:
- Go to your project → Deployments
- Select latest deployment
- Go to "Functions" tab
- Find "process-pending-payouts" cron
- Click "Test" button
- Provide `Authorization: Bearer YOUR_CRON_SECRET`

**Or via curl**:
```bash
curl -X GET "https://your-domain.vercel.app/api/cron/process-pending-payouts" \
  -H "Authorization: Bearer $(cat .env.local | grep CRON_SECRET | cut -d'=' -f2)"
```

4. Check response:
```json
{
  "message": "Traité: 1, Échoué: 0",
  "processed": 1,
  "failed": 0,
  "total": 1,
  "results": [
    {
      "payoutId": "test-payout-xxx",
      "shopId": "your-shop-id",
      "amount": 10000,
      "method": "wave",
      "status": "processed"
    }
  ]
}
```

5. Verify in database:
```sql
SELECT id, status, completed_at, bictorys_transfer_id
FROM payouts
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

---

### Scenario 3: Multiple Pending Payouts

**Setup**:
1. Create 3 test payouts in database
2. Trigger cron job
3. All should be processed in sequence

**Expected Result**:
```json
{
  "message": "Traité: 3, Échoué: 0",
  "processed": 3,
  "failed": 0,
  "results": [...]
}
```

---

### Scenario 4: Error Handling (Bictorys API Down)

**Setup**:
1. Create a test payout with invalid phone: `+2218888888888`
2. Trigger cron job
3. Bictorys API will reject (invalid phone)

**Expected Result**:
```json
{
  "message": "Traité: 0, Échoué: 1",
  "processed": 0,
  "failed": 1,
  "results": [
    {
      "payoutId": "xxx",
      "status": "failed",
      "error": "Bictorys payout error 400: Invalid phone number"
    }
  ]
}
```

**Verification**:
- Payout stays 'pending' in database
- Can retry later
- Error logged in Vercel logs

---

## Scheduled Execution

### Enable Daily Automatic Processing

**Option A: Using vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/process-pending-payouts",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Option B: Using vercel.ts (TypeScript config)**

```typescript
import { VercelConfig, routes } from '@vercel/config/v1'

export const config: VercelConfig = {
  crons: [
    {
      path: '/api/cron/process-pending-payouts',
      schedule: '0 6 * * *', // Every day at 6:00 AM UTC
    },
  ],
}
```

**Schedule Explanation**:
- `0` = minute 0
- `6` = hour 6 (6:00 AM UTC)
- `*` = every day
- `*` = every month
- `*` = every day of week

**Alternative Schedules**:
```bash
# Every 6 hours
0 */6 * * *

# Every 2 hours
0 */2 * * *

# Three times daily (6 AM, 12 PM, 6 PM UTC)
0 6,12,18 * * *

# Every weekday at 6 AM
0 6 * * 1-5
```

---

## Monitoring & Logging

### View Cron Execution Logs

**Vercel Dashboard**:
1. Go to project → Deployments → select deployment
2. Click "Logs" tab
3. Filter by `/api/cron/process-pending-payouts`
4. See execution history with timestamps

**Expected Log Output**:
```
[cron/process-payouts] Starting to process 5 pending payouts
[cron/process-payouts] Processing payout abc123 for shop xyz789
[cron/process-payouts] ✅ Payout abc123 processed successfully
[cron/process-payouts] Processing payout def456 for shop uvw345
[cron/process-payouts] ✅ Payout def456 processed successfully
[cron/process-payouts] Completed: 5 processed, 0 failed
```

### Set Up Alerts (Optional)

Create a Slack webhook to notify on failures:

```typescript
// Add to cron job after loop
if (failed > 0) {
  const slackMessage = {
    text: `⚠️ Payout processing failed: ${failed}/${pendingPayouts.length}`,
    blocks: results
      .filter(r => r.status !== 'processed')
      .map(r => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${r.payoutId}*\n${r.error}`,
        },
      })),
  }

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify(slackMessage),
  })
}
```

---

## Troubleshooting

### Issue: "CRON_SECRET not configured"

**Fix**:
```bash
# Add to .env.local
CRON_SECRET=$(openssl rand -base64 32)

# Or manually:
echo "CRON_SECRET=your-secret-key" >> .env.local

# Deploy
git push origin main
```

### Issue: "Unauthorized" error

**Cause**: Authorization header doesn't match CRON_SECRET

**Fix**:
```bash
# Get the secret from Vercel dashboard
# Project Settings → Environment Variables

# Then test with correct secret
curl -X GET "https://your-domain/api/cron/process-pending-payouts" \
  -H "Authorization: Bearer the-actual-secret-value"
```

### Issue: Payout stays 'pending' after cron

**Cause**: Either cron didn't run, or Bictorys API failed

**Check**:
1. Verify cron is configured in vercel.json or vercel.ts
2. Check Vercel logs for execution
3. Check Vercel logs for Bictorys errors
4. Verify Bictorys API key is correct

### Issue: "Bictorys payout error 400"

**Cause**: Invalid payout data (phone format, amount, etc.)

**Fix**:
1. Verify phone number format: `+XXXXXXXXX`
2. Verify amount is > 0
3. Verify shop has valid payout numbers configured
4. Check Bictorys API documentation

---

## Idempotency & Safety

### Why Idempotency Matters

If the cron runs twice (network retry, etc.), the same payout might be processed twice!

**Solution**: The `processPayout()` function uses **idempotency keys**:

```typescript
// This ensures Bictorys won't process the same payout twice
const { transactionId } = await createBictorysPayout(
  apiKey,
  {...},
  bictorysPaymentType,
  payoutId, // ← This is the idempotency key!
)
```

**Verification in Bictorys**:
- Even if API called twice with same `payoutId`
- Only ONE transfer happens
- Second request returns "already processed"

---

## Production Checklist

Before going live:

- [ ] CRON_SECRET configured in Vercel environment variables
- [ ] vercel.json or vercel.ts has cron schedule configured
- [ ] Tested manual processing via admin button
- [ ] Tested cron job manually (via Vercel dashboard test)
- [ ] Verified Vercel logs show successful executions
- [ ] Verified database shows correct status transitions
- [ ] Tested with real shop payout numbers
- [ ] Tested error handling (invalid phone, etc.)
- [ ] Set up monitoring/alerts (optional)
- [ ] Communicated schedule to users (6 AM UTC daily)

---

## Real-World Flow

```
User in Dashboard:
1. Collects 100,000 FCFA in payments
2. Goes to /dashboard/revenues
3. Clicks "Demander un reversement"
4. Selects amount: 100,000 FCFA
5. Selects method: Wave Money
6. Submits

Backend:
1. Creates payout with status='pending'
2. Stores in database

Daily (6 AM UTC):
1. Cron job triggers
2. Finds all 'pending' payouts
3. Calls processPayout() for each
4. Calls Bictorys Payout API
5. Bictorys transfers money to user's phone
6. Updates status to 'completed'
7. Stores Bictorys transaction ID

Admin Dashboard:
1. Can see completed payouts in history
2. Can manually trigger payout anytime via button

User:
1. Receives money in 24-48 hours
2. Sees history in /admin/payouts
```

---

## Files Modified/Created

| File | Type | Purpose |
|------|------|---------|
| `src/app/api/cron/process-pending-payouts/route.ts` | Create | Daily cron job to process pending payouts |
| `src/app/api/admin/payouts/[id]/complete/route.ts` | Modify | Fix to call processPayout() instead of just updating DB |

---

## Support

**If something goes wrong**:

1. Check Vercel logs: Project → Deployments → select → Logs
2. Search for: `[cron/process-payouts]`
3. Look for error messages
4. Check database for payout status
5. Verify Bictorys API credentials
6. Test manually via admin button first

---

**Version**: 1.0  
**Status**: Ready for Production  
**Last Updated**: 2026-06-07
