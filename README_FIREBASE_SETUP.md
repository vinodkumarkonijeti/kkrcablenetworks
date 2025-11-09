# Firebase Cloud Functions Setup Guide

## Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Twilio account with WhatsApp enabled

## Setup Steps

### 1. Initialize Firebase Functions
```bash
cd functions
npm install
```

### 2. Configure Twilio Credentials
You need to set up Twilio environment variables for WhatsApp messaging:

```bash
firebase functions:config:set twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID"
firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
firebase functions:config:set twilio.whatsapp_number="YOUR_TWILIO_WHATSAPP_NUMBER"
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

## How the Monthly Automation Works

The `monthlyBillingAutomation` function runs automatically on the 29th of every month at midnight (IST):

1. **Fetches all customers** from Firestore
2. **Categorizes** them as Active or Deactive
3. **Updates bill status** to "Not Paid" for the new billing cycle
4. **Sends WhatsApp messages** to each customer with their bill amount
5. **Sends a monthly report** to all operators with customer statistics

## Twilio WhatsApp Setup

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Navigate to WhatsApp > Senders
3. Set up a WhatsApp Business Profile
4. Get your credentials:
   - Account SID
   - Auth Token
   - WhatsApp-enabled phone number (format: +14155238886)

## Testing the Function Locally

To test the function locally:
```bash
firebase functions:shell
monthlyBillingAutomation()
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

## Important Notes

- The function runs on the 29th of every month at 00:00 IST
- Ensure Twilio credentials are configured before deploying
- WhatsApp messages require approved message templates in production
- Monitor Twilio usage to avoid unexpected charges
