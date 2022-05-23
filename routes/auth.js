const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { generateToken, generateRefreshToken } = require("../controller/auth");
const RefreshToken = require("../model/refreshToken");
const { verifyRefreshToken } = require("../middleware/auth");

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

    const refreshTokenDoc = await RefreshToken.create({
      owner: user.id,
    });

    // Create token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id, refreshTokenDoc.id);

    // return new user
    res.status(201).json({ userId: user.id, token, refreshToken });
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
      const refreshTokenDoc = await RefreshToken.create({ owner: user.id });

      // Create token
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user.id, refreshTokenDoc.id);

      res.status(200).json({ userId: user.id, token, refreshToken });
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (error) {
    console.log("error");
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const currentRefreshToken = await verifyRefreshToken(req.body.refreshToken, res);

    const refreshTokenDoc = await RefreshToken.create({
      owner: currentRefreshToken.userId,
    });

    await RefreshToken.deleteOne({ id: currentRefreshToken.tokenId });

    const refreshToken = generateRefreshToken(currentRefreshToken.userId, refreshTokenDoc.id);
    const token = generateToken(currentRefreshToken.userId);

    res.status(200).json({ userId: currentRefreshToken.userId, token, refreshToken });
    //const refreshToken = await RefreshToken.findById(currentRefreshToken.user);
  } catch (error) {
    console.log(error);
  }
});

router.post("/new-access-token", async (req, res) => {
  try {
    const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
    const accessToken = generateToken(refreshToken.userId);

    res.status(200).json({ id: refreshToken.userId, token: accessToken, refreshToken: req.body.refreshToken });
  } catch (error) {
    console.log(error);
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
    await RefreshToken.deleteOne({ id: refreshToken.tokenId });

    res.status(200).send("Logged out");
  } catch (error) {
    console.log(error);
  }
});

// Removes all the token for the user, if the user is logged in multiple devices at the same time he has to log in again
router.post("/logout-all", async (req, res) => {
  try {
    const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
    await RefreshToken.deleteMany({ owner: refreshToken.userId });

    res.status(200).send("Logged out");
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
