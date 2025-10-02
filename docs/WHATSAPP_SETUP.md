# WhatsApp Integration Setup (Unofficial API)

## ⚠️ **IMPORTANT WARNINGS**

**Before proceeding, understand these risks:**
- **Against WhatsApp Terms of Service** - Your account could be banned
- **Unreliable** - Can break when WhatsApp updates their system
- **Not recommended for production business use**
- **Use at your own risk**

## 🚀 **Setup Instructions**

### Step 1: Install WhatsApp Service
```bash
# Navigate to whatsapp-service directory
cd whatsapp-service

# Install dependencies
npm install

# Start the service
npm start
```

### Step 2: QR Code Authentication
1. **Run the service** - You'll see a QR code in the terminal
2. **Open WhatsApp** on your phone
3. **Go to Settings > Linked Devices**
4. **Scan the QR code** displayed in terminal
5. **Wait for "WhatsApp Client is ready!" message**

### Step 3: Environment Variables
Add these to your `.env` file:
```env
# WhatsApp Configuration
VITE_NOTIFICATION_SERVICE=whatsapp
WHATSAPP_PHONE_NUMBER=your_whatsapp_number
WHATSAPP_TARGET_NUMBER=recipient_number
WHATSAPP_WEBHOOK_URL=http://localhost:3001/send-message
```

### Step 4: Phone Number Format
- **Include country code**: +49123456789 (Germany example)
- **Remove spaces and special characters**
- **Examples:**
  - Germany: 49123456789
  - UK: 44123456789
  - US: 1123456789

## 🔧 **How It Works**

```
Your App → Supabase Function → WhatsApp Service → WhatsApp Web → Recipient
```

1. **Reservation created** in your app
2. **Supabase function** calls WhatsApp service
3. **WhatsApp service** sends message via WhatsApp Web
4. **Recipient receives** message on WhatsApp

## 📱 **Features**

### ✅ **What Works:**
- Send text messages with reservation details
- Send design images
- Emoji support
- Bold text formatting (*text*)
- Multiple recipients

### ❌ **Limitations:**
- Requires constant internet connection
- Service must run 24/7
- Can break with WhatsApp updates
- Risk of account suspension
- No official support

## 🛠️ **Troubleshooting**

### QR Code Issues:
```bash
# Clear authentication and restart
rm -rf .wwebjs_auth
npm start
```

### Connection Problems:
```bash
# Check service status
curl http://localhost:3001/health
```

### Message Not Sending:
1. **Check phone number format** (include country code)
2. **Verify WhatsApp is connected** (green status)
3. **Check service logs** for errors
4. **Restart service** if needed

## 🔄 **Switching Back to Telegram**

To switch back to Telegram:
```env
VITE_NOTIFICATION_SERVICE=telegram
```

## 📋 **Production Deployment**

### For VPS/Server:
```bash
# Install PM2 for process management
npm install -g pm2

# Start service with PM2
pm2 start server.js --name whatsapp-service

# Save PM2 configuration
pm2 save
pm2 startup
```

### Docker Option:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🎯 **Recommendations**

1. **Test thoroughly** before using in production
2. **Have Telegram as backup** in case WhatsApp fails
3. **Monitor service health** regularly
4. **Consider official WhatsApp Business API** for production
5. **Use dedicated WhatsApp account** (not your personal one)

## 🆘 **Support**

If you encounter issues:
1. Check the service logs
2. Verify WhatsApp connection
3. Test with simple messages first
4. Consider switching back to Telegram if unreliable

Remember: **This is an unofficial solution with inherent risks!**