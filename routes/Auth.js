const router = require('express').Router()
const pool = require('../db')

//registering
router.post('/', async( req, res) => {
    try {
        console.log(req.body);
        const {firstName, lastName, email, password} = req.body;
        const user = await pool.query("SELECT * FROM users")
        console.log(user.rows);
        res.json(user.rows)
    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error")
    }
})

module.exports = router;