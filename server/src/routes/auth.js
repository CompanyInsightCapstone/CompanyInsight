const express = require('express')
const database = require('../utilities/database')
const argon2 = require('argon2')
const router = express.Router()

// Signup Route
router.post('/signup', async (req, res) => {
    const { username, password, email } = req.body
    try {
        if (!username || !password || !email) {
            return res.status(400).json({ error: "Username, password, email are required." })
        }
        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters long." })
        }

        const existingUser = await database.scan(database.TABLE_NAMES_ENUM.USER,
            { where: { username: username } }
        )

        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" })
        }

        const existingUserEmail = await database.scan(database.TABLE_NAMES_ENUM.USER,
            { where: { email: email } }
        )

        if (existingUserEmail) {
            return res.status(400).json({ error: "Email already exists" })
        }

        const hashedPassword = await argon2.hash(password, {
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        })

        const newUser = await database.create(database.TABLE_NAMES_ENUM.USER, {
            username,
            email,
            password: hashedPassword
        })

        res.status(201).json({ message: "Signup successful!" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Something went wrong during signup" })
    }
})

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body
    try {
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" })
        }

        const user = await database.scan('user',
            { where: { username: username } }
        )

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        const isValidPassword = await argon2.verify(user.password, password)
        req.session.userId = user.id
        req.session.username = user.username
        res.json({ id: user.id, username: user.username, email: user.email })
    } catch (error) {
        res.status(500).json({ error: "Something went wrong during login"  })
    }
})

// Check Session Route
router.get('/check-session', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" })
    }

    try {
        const user = await database.scan('user',
            {
                where: { id: req.session.userId },
                select: { username: true }
            }
        )
        res.json({ id: req.session.userId, username: user.username, email: user.email })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching user session data" })
    }
})

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

module.exports = router
