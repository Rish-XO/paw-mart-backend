const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const authorization = require('../middleware/authorization')

//registering
router.post("/signup", async (req, res) => {
  try {
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
      "INSERT INTO users (firstname, lastname, email, password , role) VALUES ($1, $2, $3, $4, 'user') RETURNING *",
      [firstName, lastName, email, hashpwd]
    );

    // jwt token generator
    const token = jwtGenerator(newUser.rows[0].user_id);
    res.json({ token , role: 'user'});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("email or password incorrect");
    }

    const validatePassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validatePassword) {
      return res.status(401).json("email or password incorrect");
    }

    const token = jwtGenerator(user.rows[0].user_id);
    res.json({ token });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
  }
});

// verify
router.get('/is-verify' ,authorization, (req, res) => {
    try {
        res.json(true)
    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error");
    }
})

module.exports = router;
