require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const auth = require("./middleware/auth");

const app = express();
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;
const host = process.env.HOST || "localhost"

app.use(express.json());

app.use("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome to the API");
})

app.use("/api/", require("./routes/login"));

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});