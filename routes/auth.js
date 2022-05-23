const express = require("express");
const router = express.Router();
const controller = require("../controller/auth");

router.post("/register", controller.signup);
router.post("/login", controller.login);
router.post("/refresh-token", controller.newRefreshToken);
router.post("/new-access-token", controller.newAccessToken);
router.post("/logout", controller.logout);
router.post("/logout-all", controller.logoutAll);

module.exports = router;
