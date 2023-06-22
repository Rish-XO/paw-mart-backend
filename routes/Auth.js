const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

//registering
router.post("/", async (req, res) => {
  try {
    console.log(req.body);
    const { firstName, lastName, email, password } = req.body;

    // check if the user already exist
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length !== 0) {
      return res.status(401).send("User already exist");
    }

    // bcrypt password
    const salt = await bcrypt.genSalt(10);
    const hashpwd = await bcrypt.hash(password, salt);

    //enter the new user to database
    const newUser = await pool.query(
      "INSERT INTO users (firstName, lastName, email, password , role) VALUES ($1, $2, $3, $4, 'user')",
      [firstName, lastName, email, hashpwd]
    );
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
  }
});

module.exports = router;
