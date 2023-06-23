const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  const jwtToken = req.header("token");
  const payload = jwt.verify(jwtToken, process.env.secret);
  req.user = payload.user;
  next();
  if (!jwtToken) {
    return res.status(403).json("Not authorized");
  }
};
