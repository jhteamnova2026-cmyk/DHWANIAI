const express = require('express');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'static' directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Set up session (prevents the equivalent of RuntimeError in Flask)
app.use(session({
    secret: 'dwani_secure_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // Session valid for 10 minutes
}));

// Email Config
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: 'dhananjayshekar12345@gmail.com',
        // Use your 16-digit Google App Password here (NOT your normal password)
        pass: 'bfchzbocjegnvdpi'
    }
});

// Routes
app.get('/', (req, res) => {
    // Serve the index.html from templates directory
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/send-otp', async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.json({ success: false, message: "Username and Email required!" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        req.session.otp = otp;
        req.session.otp_time = Date.now();

        const mailOptions = {
            from: '"Dwani App" <dhananjayshekar12345@gmail.com>',
            to: email,
            subject: 'Dwani Verification Code',
            text: `Hello ${username},\n\nYour Dwani verification code is: ${otp}\n\nThis code will expire in 60 seconds.`,
            html: `<h3>Hello ${username},</h3><p>Your Dwani verification code is: <strong style="font-size: 1.2em;">${otp}</strong></p><p>This code will expire in 60 seconds.</p>`
        };

        await transporter.sendMail(mailOptions);
        return res.json({ success: true });
    } catch (error) {
        console.error(`SMTP Error: ${error}`);
        // This catches 'BadCredentials' if your App Password is wrong
        return res.json({ success: false, message: "Email Error. Check App Password." });
    }
});

app.post('/verify-otp', (req, res) => {
    const data = req.body;
    
    // Check if OTP was generated and if it has expired (60 seconds)
    const otpTime = req.session.otp_time || 0;
    if (Date.now() - otpTime > 60000) { // 60,000 milliseconds = 60 seconds
        return res.json({ success: false, message: "OTP Expired!" });
    }
    
    if (data.otp === req.session.otp) {
        return res.json({ success: true });
    }
    
    return res.json({ success: false, message: "Invalid OTP." });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
    
    // Automatically open browser like Python's webbrowser.open
    const url = `http://127.0.0.1:${PORT}`;
    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCmd} ${url}`);
});
