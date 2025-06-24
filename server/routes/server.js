const dotenv = require("dotenv");
dotenv.config();

const server = require("./src/server");

const PORT = process.env.PORT || 3000;

server.listen(PORT, (req, res, next) => {
  console.log(`Server is running on port ${PORT}`);
});
