const jwt = require("jsonwebtoken");
const { errorHandler } = require("../util");
const bcrypt = require("bcryptjs");
const User = require("../model/user");
const RefreshToken = require("../model/refreshToken");
const { verifyRefreshToken } = require("../middleware/auth");
const { HttpError } = require("../error");

const generateToken = (userId) => {
  return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: "15s" });
};

const generateRefreshToken = (userId, refreshTokenId) => {
  return jwt.sign({ userId: userId, tokenId: refreshTokenId }, process.env.REFRESH_TOKEN, { expiresIn: "30s" });
};

const signup = errorHandler(async (req, res) => {
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
  return { userId: user.id, token, refreshToken };
});

const login = errorHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!(email && password)) {
    throw new HttpError(400, "All input is required");
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const refreshTokenDoc = await RefreshToken.create({ owner: user.id });

    // Create token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id, refreshTokenDoc.id);

    return { userId: user.id, token, refreshToken };
  } else {
    throw new HttpError(401, "Invalid credentials");
  }
});

const newRefreshToken = errorHandler(async (req, res) => {
  const currentRefreshToken = await verifyRefreshToken(req.body.refreshToken, res);

  const refreshTokenDoc = await RefreshToken.create({
    owner: currentRefreshToken.userId,
  });

  await RefreshToken.deleteOne({ id: currentRefreshToken.tokenId });

  const refreshToken = generateRefreshToken(currentRefreshToken.userId, refreshTokenDoc.id);
  const token = generateToken(currentRefreshToken.userId);

  return { userId: currentRefreshToken.userId, token, refreshToken };
});

const newAccessToken = errorHandler(async (req, res) => {
  const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
  const accessToken = generateToken(refreshToken.userId);

  return { id: refreshToken.userId, token: accessToken, refreshToken: req.body.refreshToken };
});

const logout = errorHandler(async (req, res) => {
  const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
  await RefreshToken.deleteOne({ id: refreshToken.tokenId });

  return { success: true };
});

const logoutAll = errorHandler(async (req, res) => {
  const refreshToken = await verifyRefreshToken(req.body.refreshToken, res);
  await RefreshToken.deleteMany({ owner: refreshToken.userId });

  return { success: true };
});

module.exports = { signup, login, newRefreshToken, newAccessToken, logout, logoutAll, generateToken, generateRefreshToken };
