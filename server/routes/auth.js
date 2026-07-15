const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Adjust if your DB path is different

const transporter = require('../utils/mailer');

const JWT_SECRET = 'your_jwt_secret_key'; // Move to .env later

// REGISTER
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log('📥 Registration request:', name, email, password); // Debug

    try {
        // Check if email already exists
        const [existing] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'User already exists with that email'});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        await db.promise().query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.json({ message: 'User registered successfully' });

    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('📥 Login request:', email); // Debug

    try {
        // Find user by email
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Optional: Generate JWT (commented for now)
        /*
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        */

        // Respond with user info (omit password)
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                // token: token // Uncomment if JWT used
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// FORGOT PASSWORD - SEND OTP
router.post('/forgot-password', async (req, res) => {

    const { email } = req.body;

    try {

        // Check whether user exists
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // OTP expires after 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Remove any previous OTP
        await db.promise().query(
            'DELETE FROM password_reset_otp WHERE email = ?',
            [email]
        );

        // Save new OTP
        await db.promise().query(
                `INSERT INTO password_reset_otp (email, otp, expires_at, is_verified) VALUES (?, ?, ?, ?)`,
                [email, otp, expiresAt, false]
            );

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Smart Product Finder - Password Reset OTP',
            html: `
                <h2>Password Reset</h2>

                <p>Your OTP is:</p>

                <h1>${otp}</h1>

                <p>This OTP is valid for <b>5 minutes</b>.</p>

                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        res.json({
            message: 'OTP sent successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Failed to send OTP'
        });

    }

});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {

    const { email, otp } = req.body;

    try {

        const [rows] = await db.promise().query(
            'SELECT * FROM password_reset_otp WHERE email = ?',
            [email]
        );

        // No OTP found
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'OTP not found'
            });
        }

        const storedOTP = rows[0];

        // OTP mismatch
        if (storedOTP.otp !== otp) {
            return res.status(401).json({
                message: 'Invalid OTP'
            });
        }

        // OTP expired
        if (new Date() > new Date(storedOTP.expires_at)) {

            await db.promise().query(
                'DELETE FROM password_reset_otp WHERE email = ?',
                [email]
            );

            return res.status(410).json({
                message: 'OTP has expired'
            });
        }

        await db.promise().query(
                `UPDATE password_reset_otp SET is_verified = TRUE WHERE email = ?`,
                [email]
            );

        res.json({
            message: 'OTP verified successfully'
        });

    } catch (err) {

        console.error('❌ OTP Verification Error:', err);

        res.status(500).json({
            message: 'Server error while verifying OTP'
        });

    }

});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {

    const { email, password } = req.body;

    try {

        // Check whether OTP exists (meaning it was verified)
        const [otpRows] = await db.promise().query(`SELECT * FROM password_reset_otp WHERE email = ?`,
                [email]
            );

            if (otpRows.length === 0) {
                return res.status(404).json({
                    message: 'OTP not found'
                });
            }

            const otpData = otpRows[0];

            if (!otpData.is_verified) {
                return res.status(403).json({
                    message: 'Please verify OTP first'
                });
            }

            if (new Date() > new Date(otpData.expires_at)) {

                await db.promise().query(
                    'DELETE FROM password_reset_otp WHERE email=?',
                    [email]
                );

                return res.status(410).json({
                    message: 'OTP expired'
                });
            }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await db.promise().query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        // Delete OTP
        await db.promise().query(
            'DELETE FROM password_reset_otp WHERE email = ?',
            [email]
        );

        res.json({
            message: 'Password reset successful'
        });

    } catch (err) {

        console.error('❌ Reset Password Error:', err);

        res.status(500).json({
            message: 'Server error while resetting password'
        });

    }

});

module.exports = router;
