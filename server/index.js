const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { RedisStore } = require("connect-redis");
const process = require("process");
const dotenv = require("dotenv");
dotenv.config();

const authRouter = require("./src/routes/auth");
const companiesRouter = require("./src/routes/companies");
const userRouter = require("./src/routes/user");

const server = express();

const {
  AuthError,
  CompaniesError,
  UserError,
} = require("./src/middleware/CustomErrors");

const { redisClient } = require("./src/utilities/RedisClient");

const PORT = process.env.PORT || 3001;

server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

server.use(express.json());

server.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "ci",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
  }),
);

server.use(authRouter);

const sessionValidation = (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ error: "You must be logged in to perform this action." });
  }
  next();
};

server.use(sessionValidation);

server.use(companiesRouter);

server.use(userRouter);

server.use((err, req, res, next) => {
  try {
    if (
      err instanceof AuthError ||
      err instanceof CompaniesError ||
      err instanceof UserError
    ) {
      return res.status(err.status).json({
        error: err.message,
        type: err.name,
      });
    }
    return res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
