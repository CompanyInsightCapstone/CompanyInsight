const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { ValidationError } = require("./src/middleware/CustomErrors");

const authRouter = require("./src/routes/auth");
const companiesRouter = require("./src/routes/companies");
const server = express();
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 3000;

server.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

server.use(express.json());

server.use(
  session({
    secret: "ci",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 },
  }),
);

server.use(authRouter);
server.use(companiesRouter);

server.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
