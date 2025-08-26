const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Adjust if your DB path is different

const JWT_SECRET = 'your_jwt_secret_key'; // Move to .env later

// ✅ REGISTER
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
            return res.status(400).json({ message: 'User already exists with that email' });
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

// ✅ LOGIN
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
            return res.status(401).json({ message: 'Invalid email or password' });
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

module.exports = router;
