const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'home'))); // Serve home folder for CSS/images

// Temporary storage for OTPs
let otpStorage = {};

// --- GMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: "dhananjayshekar12345@gmail.com",
        pass: "kcabumqghneruxsz" // DOUBLE CHECK THIS CODE
    },
    tls: {
        rejectUnauthorized: false
    }
});
// --- ROUTES ---

// Serve home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home', 'home.html'));
});

// 1. Send OTP
app.post('/api/send-otp', async (req, res) => {
    let { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is missing" });
    
    email = email.toLowerCase().trim();
    console.log("-----------------------------------------");
    console.log(`📩 Sending OTP to: ${email}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage[email] = { otp, expires: Date.now() + 300000 };

    transporter.sendMail({
        from: '"Dhwani Secure" <dhananjayshekar12345@gmail.com>',
        to: email,
        subject: 'Dhwani: Verification Code',
        html: `<div style="text-align:center; font-family:sans-serif; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #333;">Dhwani Verification</h2>
                <h1 style="color:#007bff; letter-spacing:5px; font-size: 40px;">${otp}</h1>
                <p>Enter this code to access your account. Expires in 5 minutes.</p>
               </div>`
    }).then(() => {
        console.log(`✅ SUCCESS: OTP Sent to ${email}`);
    }).catch(err => {
        console.error("❌ GMAIL ERROR:", err.message);
    });

    res.json({ success: true });
});

// 2. Verify OTP
app.post('/api/verify-otp', (req, res) => {
    let { email, otp } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email missing" });
    
    email = email.toLowerCase().trim();
    const record = otpStorage[email];

    if (record && record.otp === otp && Date.now() < record.expires) {
        console.log(`🔑 OTP VERIFIED: ${email}`);
        delete otpStorage[email];
        res.json({ success: true });
    } else {
        console.log(`❌ VERIFICATION FAILED: ${email} (Record found: ${!!record}, Code match: ${record?.otp === otp})`);
        res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
});

// --- START SERVER ---
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 DHWANI LIVE: http://localhost:${PORT}`);
    console.log(`✅ GMAIL CONNECTED: Ready to send OTPs!`);
});
