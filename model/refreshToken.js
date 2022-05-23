const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  owner: {type: mongoose.Schema.Types.ObjectId, ref: "user"},
});

module.exports = mongoose.model("refreshToken", refreshTokenSchema);