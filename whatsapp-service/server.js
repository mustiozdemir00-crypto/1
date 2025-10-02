const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();

app.use(express.json());

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "krampus-tattoo"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Generate QR code for authentication
client.on('qr', (qr) => {
    console.log('🔗 Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Client ready
client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

// Handle authentication failure
client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
});

// Handle disconnection
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp Client was disconnected:', reason);
});

// Initialize client
client.initialize();

// Webhook endpoint to send messages
app.post('/send-message', async (req, res) => {
    try {
        const { to, message, images } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Missing required fields: to, message' });
        }

        // Format phone number (ensure it has country code)
        let phoneNumber = to.replace(/\D/g, ''); // Remove non-digits
        if (!phoneNumber.startsWith('1') && !phoneNumber.startsWith('44') && !phoneNumber.startsWith('49')) {
            // Add default country code if none provided (adjust as needed)
            phoneNumber = '49' + phoneNumber; // Germany example
        }
        const chatId = phoneNumber + '@c.us';

        // Send text message
        const sentMessage = await client.sendMessage(chatId, message);
        console.log('✅ Message sent:', sentMessage.id.id);

        // Send images if provided
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                try {
                    const imageData = images[i];
                    let media;

                    if (imageData.startsWith('data:image/')) {
                        // Base64 image
                        media = new MessageMedia('image/jpeg', imageData.split(',')[1], `design_${i + 1}.jpg`);
                    } else if (imageData.startsWith('http')) {
                        // URL image
                        media = await MessageMedia.fromUrl(imageData);
                    } else {
                        console.warn('⚠️ Unsupported image format:', imageData.substring(0, 50));
                        continue;
                    }

                    await client.sendMessage(chatId, media, {
                        caption: `🖼️ Design ${i + 1}/${images.length} - Reservation`
                    });
                    console.log(`✅ Image ${i + 1} sent`);

                    // Small delay between images
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (imageError) {
                    console.error(`❌ Error sending image ${i + 1}:`, imageError);
                }
            }
        }

        res.json({ 
            success: true, 
            messageId: sentMessage.id.id,
            imagesCount: images ? images.length : 0
        });

    } catch (error) {
        console.error('❌ Error sending WhatsApp message:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        whatsappReady: client.info ? true : false,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp service running on port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/send-message`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down WhatsApp service...');
    await client.destroy();
    process.exit(0);
});