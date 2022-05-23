const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId: userId}, process.env.JWT_SECRET, { expiresIn: "15s" });
}

const generateRefreshToken = (userId, refreshTokenId) => {
  return jwt.sign({ userId: userId, tokenId: refreshTokenId }, process.env.REFRESH_TOKEN, { expiresIn: "30s" });
}

module.exports = { generateToken, generateRefreshToken };