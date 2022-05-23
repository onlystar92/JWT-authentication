const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/refreshToken");
const { TokenExpiredError } = jwt;

const config = process.env;

const verifyToken = (req, res, next) => {
  // const token = req.body.token || req.query.token || req.headers["x-access-token"];
  const token = req.headers["authorization"].split(" ")[1];

  if (!token) {
    return res.status(403).send("A token is required for authetication");
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      return catchError(err, res);
    }

    req.user = decoded;

    next();
  });
};

const verifyRefreshToken = async (token, res) => {
  const decodeToken = () => {
    try {
      return jwt.verify(token, config.REFRESH_TOKEN);
    } catch (error) {
      res.status(401).send("Invalid refresh token");
    }
  }

  const decodedToken = decodeToken();
  const tokenExists = await RefreshToken.exists({_id: decodedToken.tokenId});

  if (!tokenExists) {
    res.status(401).send("Invalid refresh token");
  } else {
    return decodedToken;
  }
};

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).send("Token expired");
  }

  return res.status(401).send("Unauthorized");
};

module.exports = { verifyToken, verifyRefreshToken };
