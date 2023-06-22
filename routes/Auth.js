const router = require('express').Router()

//registering

router.post('/signup', async( req, res) => {
    try {
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error")
    }
})