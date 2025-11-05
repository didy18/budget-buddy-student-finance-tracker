# Budget Buddy - Email Notifications Setup

## Overview

Budget Buddy now supports email notifications for budget alerts. When your spending reaches the alert threshold you set, the system will automatically send you an email notification with detailed budget information and helpful tips.

## Features

✅ **Automatic Budget Alerts**: Get notified when you reach your spending threshold
✅ **Beautiful HTML Emails**: Professional, branded email templates
✅ **Detailed Budget Summary**: See your budget amount, total spent, and remaining balance
✅ **Smart Tips**: Receive personalized tips to help you stay on track
✅ **Multi-Currency Support**: Now includes Nigerian Naira (NGN) and 15 other currencies

## Email Notification System

### How It Works

1. **Automatic Trigger**: When you add or update an expense transaction, the system automatically checks your current budget
2. **Threshold Check**: If your spending has reached or exceeded your alert threshold (default: 80%), an email is sent
3. **Email Delivery**: A beautiful, detailed email is sent to your registered email address via Resend
4. **In-App Alerts**: You'll also see visual alerts in the Budget page when approaching your limit

### Email Content

The notification email includes:
- Alert message with current spending percentage
- Budget summary (amount, spent, remaining)
- Budget period (weekly/monthly)
- Visual progress bar
- Tips to help you stay on track
- Quick link back to your Budget page

## Setup Instructions

### 1. Get a Resend API Key

1. Go to [Resend](https://resend.com/) and create a free account
2. Verify your email address
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy your API key (starts with `re_`)

**Free Tier Includes:**
- 3,000 emails per month
- 100 emails per day
- Perfect for personal use

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email Notifications (using Resend)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=notifications@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- Replace `re_your_api_key_here` with your actual Resend API key
- For `FROM_EMAIL`, you can use:
  - `onboarding@resend.dev` (Resend's test email - works immediately)
  - Your own domain (requires DNS verification in Resend dashboard)
- Update `NEXT_PUBLIC_APP_URL` to your production URL when deploying

### 3. Verify Email Domain (Optional, for Production)

To send emails from your own domain:

1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain name
4. Add the provided DNS records to your domain registrar
5. Wait for verification (usually takes a few minutes)
6. Update `FROM_EMAIL` in `.env` to use your domain

## Testing Email Notifications

### Method 1: Through the App

1. Make sure you're logged in with a valid email address
2. Create a budget with a low alert threshold (e.g., 50%)
3. Add expenses until you exceed the threshold
4. Check your email inbox for the notification

### Method 2: Direct API Test

Test the notification API directly:

```bash
# Replace USER_ID and BUDGET_ID with actual values
curl -X POST http://localhost:3000/api/notifications/budget-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "budgetId": "BUDGET_ID"
  }'
```

### Method 3: Check All Budget Alerts

```bash
# Check if any budgets have reached alert threshold
curl http://localhost:3000/api/notifications/budget-alert?userId=USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Emails Not Being Sent

**Check 1: API Key Configuration**
```bash
# Verify environment variable is set
echo $RESEND_API_KEY
```

**Check 2: Email Service Logs**
- Open browser DevTools → Network tab
- Add an expense that exceeds threshold
- Look for POST request to `/api/notifications/budget-alert`
- Check the response for error messages

**Check 3: Resend Dashboard**
- Log in to Resend dashboard
- Check "Logs" section to see if emails were attempted
- Look for any error messages or bounces

### Common Issues

**Issue**: "Email service not configured"
- **Solution**: Make sure `RESEND_API_KEY` is set in your `.env` file and restart your dev server

**Issue**: Emails sent but not received
- **Solution**: 
  - Check spam/junk folder
  - Verify email address in your user account is correct
  - Make sure sender email is verified in Resend

**Issue**: "User email not found"
- **Solution**: Ensure you're logged in and your account has a valid email address

## Email Notification Frequency

The system is designed to send notifications intelligently:

- **Per Transaction**: Budget check runs after adding/updating expenses
- **Threshold-Based**: Only sends if spending ≥ alert threshold
- **No Spam**: The same alert may trigger multiple times if you continue adding expenses over the threshold
- **Manual Check**: You can manually trigger alerts via the API

## Currency Support

Budget Buddy now supports 16 currencies including:

- 🇺🇸 USD - US Dollar ($)
- 🇪🇺 EUR - Euro (€)
- 🇬🇧 GBP - British Pound (£)
- 🇳🇬 **NGN - Nigerian Naira (₦)** ✨ NEW
- 🇮🇳 INR - Indian Rupee (₹)
- 🇯🇵 JPY - Japanese Yen (¥)
- 🇨🇦 CAD - Canadian Dollar (C$)
- 🇦🇺 AUD - Australian Dollar (A$)
- 🇨🇭 CHF - Swiss Franc
- 🇨🇳 CNY - Chinese Yuan (¥)
- 🇲🇽 MXN - Mexican Peso (Mex$)
- 🇧🇷 BRL - Brazilian Real (R$)
- 🇿🇦 ZAR - South African Rand (R)
- 🇸🇬 SGD - Singapore Dollar (S$)
- 🇳🇿 NZD - New Zealand Dollar (NZ$)
- 🇰🇷 KRW - South Korean Won (₩)

Set your preferred currency in Settings → Currency Preferences

## Production Deployment

When deploying to production:

1. **Environment Variables**: Set all required env vars in your hosting platform
2. **Domain Verification**: Verify your sending domain in Resend
3. **Update URLs**: Change `NEXT_PUBLIC_APP_URL` to your production URL
4. **Monitor Logs**: Keep an eye on Resend dashboard for delivery issues
5. **Test Thoroughly**: Send test notifications before going live

## API Endpoints

### Send Budget Alert
```
POST /api/notifications/budget-alert
Body: { userId: string, budgetId: string }
```

### Check All Budget Alerts
```
GET /api/notifications/budget-alert?userId=string
```

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with Resend's test email: `onboarding@resend.dev`
4. Review Resend dashboard logs for email delivery status

---

**Happy Budgeting! 💰📧**
