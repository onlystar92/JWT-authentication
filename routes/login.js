const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    // Get user input
    const { first_name, last_name, email, password } = req.body;

    // Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    // Checks if user already exist in the db
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      res.status(409).send("User already exists. Please login");
    }

    // Encrypt password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign({ user_id: user._id, email }, process.env.JWT_SECRET, { expiresIn: "2h" });

    console.log(token);

    // Save token
    user.token = token;

    // return new user
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ user_id: user._id, email }, process.env.JWT_SECRET, { expiresIn: "2h" });

      user.token = token;

      res.status(200).json(user);
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (error) {
    console.log("error");
  }
});

module.exports = router;
