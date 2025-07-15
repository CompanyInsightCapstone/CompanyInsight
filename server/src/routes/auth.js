const express = require("express");
const database = require("../utilities/database");
const argon2 = require("argon2");
const router = express.Router();
const cache = require("../utilities/RedisClient");
const { AuthError } = require("../middleware/CustomErrors");

/**
 * Handles user registration with username, password, and email validation.
 * Creates new user account with hashed password and checks for existing users.
 * @route POST /signup
 */
router.post("/signup", async (req, res, next) => {
  const { username, password, email } = req.body;
  try {
    if (!username || !password || !email) {
      return next(
        new AuthError("Username, password, email are required.", 400),
      );
    }
    if (password.length < 8) {
      return next(
        new AuthError("Password must be at least 8 characters long.", 400),
      );
    }

    const existingUser = await database.scan(database.TABLE_NAMES_TYPE.USER, {
      where: { username: username },
    });

    if (existingUser) {
      return next(new AuthError("Username already exists", 400));
    }

    const existingUserEmail = await database.scan(
      database.TABLE_NAMES_TYPE.USER,
      { where: { email: email } },
    );

    if (existingUserEmail) {
      return next(new AuthError("Email already exists", 400));
    }

    const hashedPassword = await argon2.hash(password, {
      memoryCost: 1 << 16,
      timeCost: 3,
      parallelism: 1,
    });

    await database.createRecord(database.TABLE_NAMES_TYPE.USER, {
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    next(new AuthError("Something went wrong during signup", 500));
  }
});

/**
 * Handles user authentication with username and password verification.
 * Creates user session upon successful login and returns user data.
 * @route POST /login
 */
router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return next(new AuthError("Username and password are required", 400));
    }

    const user = await database.scan(database.TABLE_NAMES_TYPE.USER, {
      where: { username: username },
    });

    const isValidPassword = await argon2.verify(user.password, password);

    if (!user || !isValidPassword) {
      return next(new AuthError("Invalid username or password", 401));
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.infiniteScroll = user.infiniteScroll;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      infiniteScroll: user.infiniteScroll,
    });
  } catch (error) {
    next(new AuthError("Something went wrong during login", 500));
  }
});

/**
 * Validates current user session and returns user information.
 * Checks if user is logged in and retrieves their profile data from database.
 * @route GET /check-session
 */
router.get("/check-session", async (req, res, next) => {
  if (!req.session.userId) {
    return next(new AuthError("Not logged in", 401));
  }
  try {
    const user = await database.scan(database.TABLE_NAMES_TYPE.USER, {
      where: { id: req.session.userId },
      select: {
        username: true,
        email: true,
        password: false,
        infiniteScroll: true,
      },
    });
    res.json({
      id: req.session.userId,
      username: user.username,
      email: user.email,
      infiniteScroll: user.infiniteScroll,
    });
  } catch (error) {
    next(new AuthError("Error fetching user session data", 500));
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
