const express = require("express");
const database = require("../utilities/database");
const argon2 = require("argon2");
const router = express.Router();
const cache = require("../utilities/cache");

/**
 * Handles user registration with username, password, and email validation.
 * Creates new user account with hashed password and checks for existing users.
 * @route POST /signup
 */
router.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "Username, password, email are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long." });
    }

    const existingUser = await database.scan(database.TABLE_NAMES_ENUM.USER, {
      where: { username: username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingUserEmail = await database.scan(
      database.TABLE_NAMES_ENUM.USER,
      { where: { email: email } },
    );

    if (existingUserEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await argon2.hash(password, {
      memoryCost: 1 << 16,
      timeCost: 3,
      parallelism: 1,
    });

    await database.createRecord(database.TABLE_NAMES_ENUM.USER, {
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong during signup" });
  }
});

/**
 * Handles user authentication with username and password verification.
 * Creates user session upon successful login and returns user data.
 * @route POST /login
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await database.scan(database.TABLE_NAMES_ENUM.USER, {
      where: { username: username },
    });

    const isValidPassword = await argon2.verify(user.password, password);

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong during login" });
  }
});

/**
 * Validates current user session and returns user information.
 * Checks if user is logged in and retrieves their profile data from database.
 * @route GET /check-session
 */
router.get("/check-session", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }
  try {
    const user = await database.scan(database.TABLE_NAMES_ENUM.USER, {
      where: { id: req.session.userId },
      select: { username: true, email: true, password: false },
    });
    res.json({
      id: req.session.userId,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user session data" });
  }
});

/**
 * Handles user logout by destroying session and clearing cookies.
 * Terminates the current user session and removes authentication data.
 * @route POST /logout
 */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
});

module.exports = router;
